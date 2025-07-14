# ----------------------
# IAM Role & Policies for Lambda
# ----------------------
resource "aws_iam_role" "lambda_exec_role" {
  name = "lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Principal = {
        Service = "lambda.amazonaws.com"
      },
      Effect = "Allow",
      Sid    = ""
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# ----------------------
# Lambda Security Group
# ----------------------
resource "aws_security_group" "lambda_sg" {
  name        = "guest-parking-lambda-sg"
  description = "Allow Lambda to connect to RDS and the internet"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lambda-sg"
  }
}

# ----------------------
# Lambda Function
# ----------------------
resource "aws_lambda_function" "backend" {
  function_name = "guest-parking-backend"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "lambda.handler"
  runtime       = "nodejs22.x"

  filename         = "backend.zip"
  source_code_hash = filebase64sha256("backend.zip")
  timeout          = 20 # Increase if bookings or email operations may take longer

  environment {
    variables = {
      DATABASE_URL    = var.DATABASE_URL
      RESEND_API_KEY  = var.RESEND_API_KEY
      FROM_EMAIL      = var.FROM_EMAIL
      ALLOWED_ORIGINS = var.ALLOWED_ORIGINS
    }
  }
}

# ----------------------
# API Gateway HTTP API
# ----------------------
resource "aws_apigatewayv2_api" "api" {
  name          = "guest-parking-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                = aws_apigatewayv2_api.api.id
  integration_type      = "AWS_PROXY"
  integration_uri       = aws_lambda_function.backend.invoke_arn
  integration_method    = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "proxy" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_route" "cors_preflight" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "OPTIONS /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# ----------------------
# Allow API Gateway to Invoke Lambda
# ----------------------
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
