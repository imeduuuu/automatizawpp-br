variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc3"
  validation {
    condition = contains([
      "nyc1", "nyc3", "sfo1", "sfo3", "lon1", "fra1",
      "tor1", "sgp1", "blr1"
    ], var.region)
    error_message = "Invalid DigitalOcean region."
  }
}

variable "domain" {
  description = "Primary domain for the application"
  type        = string
}

variable "app_instances" {
  description = "Number of app instances to start with"
  type        = number
  default     = 2
  validation {
    condition     = var.app_instances >= 1 && var.app_instances <= 10
    error_message = "App instances must be between 1 and 10."
  }
}

variable "app_max_instances" {
  description = "Maximum number of app instances for autoscaling"
  type        = number
  default     = 5
  validation {
    condition     = var.app_max_instances >= 2 && var.app_max_instances <= 20
    error_message = "Max instances must be between 2 and 20."
  }
}

variable "app_size" {
  description = "Droplet size for app (s-1vcpu-1gb, s-2vcpu-2gb, etc.)"
  type        = string
  default     = "s-2vcpu-2gb"
}

variable "app_cpu_threshold" {
  description = "CPU percentage threshold for autoscaling (0-100)"
  type        = number
  default     = 70
  validation {
    condition     = var.app_cpu_threshold > 0 && var.app_cpu_threshold < 100
    error_message = "CPU threshold must be between 1 and 99."
  }
}

variable "db_size" {
  description = "Database droplet size"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

variable "db_nodes" {
  description = "Number of database nodes"
  type        = number
  default     = 1
  validation {
    condition     = var.db_nodes >= 1 && var.db_nodes <= 3
    error_message = "Database nodes must be 1 (single) or 3 (cluster)."
  }
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "github_repo" {
  description = "GitHub repository URL"
  type        = string
  default     = "https://github.com/YOUR_USER/automatizawppBR"
}

variable "github_branch" {
  description = "GitHub branch to deploy"
  type        = string
  default     = "main"
}

variable "anthropic_api_key" {
  description = "Anthropic API key"
  type        = string
  sensitive   = true
}

variable "bird_workspace_id" {
  description = "Bird workspace ID"
  type        = string
  sensitive   = true
}

variable "slack_channel" {
  description = "Slack channel for alerts"
  type        = string
  default     = "#alerts"
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts"
  type        = string
  sensitive   = true
  default     = ""
}

variable "allowed_ssh_ips" {
  description = "List of IPs allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

locals {
  tags = {
    environment = var.environment
    project     = "automatizawpp"
    managed_by  = "terraform"
  }
}
