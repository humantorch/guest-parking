variable "DATABASE_URL" {
  type        = string
  description = "Connection string for PostgreSQL"
}

variable "RESEND_API_KEY" {
  type        = string
  description = "API key for Resend"
}

variable "FROM_EMAIL" {
  type        = string
  description = "Email address to send from"
}

variable "ALLOWED_ORIGINS" {
  type        = string
  description = "Comma-separated list of CORS-allowed origins"
}
