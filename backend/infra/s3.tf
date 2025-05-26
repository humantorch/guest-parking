data "aws_s3_bucket" "backend_deploys" {
  bucket = "guest-parking-backend-deploys"
}

resource "aws_s3_bucket_public_access_block" "block_public" {
  bucket = data.aws_s3_bucket.backend_deploys.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
