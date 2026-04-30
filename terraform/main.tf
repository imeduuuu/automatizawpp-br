# DigitalOcean Provider Configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# SSH Key
resource "digitalocean_ssh_key" "automatizawpp" {
  name       = "automatizawpp-${var.environment}"
  public_key = file(var.ssh_public_key_path)
}

# VPC
resource "digitalocean_vpc" "automatizawpp" {
  name     = "automatizawpp-${var.environment}"
  region   = var.region
  description = "Network for AutomatizaWPP Sales OS"
}

# Database Cluster
resource "digitalocean_database_cluster" "postgres" {
  name       = "automatizawpp-db-${var.environment}"
  engine     = "pg"
  version    = "16"
  size       = var.db_size
  region     = var.region
  node_count = var.db_nodes

  tags = [
    "automatizawpp",
    var.environment
  ]
}

# Database
resource "digitalocean_database_db" "automatizawpp" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "automatizawpp"
}

# Database User
resource "digitalocean_database_user" "automatizawpp" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "automatizawpp"
}

# Firewall for Database
resource "digitalocean_database_firewall" "automatizawpp" {
  cluster_id = digitalocean_database_cluster.postgres.id

  rule {
    type  = "app"
    value = digitalocean_app_spec.automatizawpp.id
  }
}

# App Platform (Droplet with auto-scaling)
resource "digitalocean_app_spec" "automatizawpp" {
  name   = "automatizawpp-${var.environment}"
  region = var.region

  # Web Service
  service {
    name             = "web"
    github_repo      = var.github_repo
    github_branch    = var.github_branch
    source_dir       = "/"
    build_command    = "npm run build"
    run_command      = "npm start"
    http_port        = 3000
    instance_count   = var.app_instances
    instance_size_slug = var.app_size

    envs {
      key   = "NODE_ENV"
      value = var.environment
    }

    envs {
      key   = "DATABASE_URL"
      value = "postgresql://${digitalocean_database_user.automatizawpp.name}:${random_password.db_password.result}@${digitalocean_database_cluster.postgres.host}:${digitalocean_database_cluster.postgres.port}/automatizawpp?sslmode=require"
    }

    envs {
      key   = "REDIS_URL"
      value = "redis://${digitalocean_app_spec.automatizawpp.id}-redis-1:6379"
    }

    envs {
      key   = "ANTHROPIC_API_KEY"
      value = var.anthropic_api_key
      scope = "RUN_AND_BUILD_TIME"
    }

    envs {
      key   = "BIRD_WORKSPACE_ID"
      value = var.bird_workspace_id
    }

    http_port_match_behavior = "MATCH_ANY"

    routes {
      path = "/"
    }

    health_check {
      http_path = "/health"
      http_protocol = "HTTP"
      initial_delay_seconds = 30
      port = 3000
      period_seconds = 60
      success_threshold = 2
      failure_threshold = 5
      timeout_seconds = 5
    }

    autoscaling {
      min_instance_count = var.app_instances
      max_instance_count = var.app_max_instances
      metrics {
        cpu_percentage = var.app_cpu_threshold
        memory_percentage = 75
      }
    }

    alerts {
      rule = "CPU_THRESHOLD_PERCENTAGE"
      value = var.app_cpu_threshold
      window = 5
    }
  }

  # Redis Database (sidecar)
  database {
    name = "redis"
    engine = "REDIS"
    version = "7"
    production = var.environment == "prod"
  }

  # Scheduled worker for follow-ups
  worker {
    name = "scheduler"
    github_repo = var.github_repo
    github_branch = var.github_branch
    build_command = "npm run build"
    run_command = "npm run scheduler"

    envs {
      key = "DATABASE_URL"
      value = "postgresql://${digitalocean_database_user.automatizawpp.name}:${random_password.db_password.result}@${digitalocean_database_cluster.postgres.host}/automatizawpp"
    }
  }

  # Static site (landing page)
  static_site {
    name = "landing"
    github_repo = var.github_repo
    github_branch = var.github_branch
    source_dir = "public"
    routes {
      path = "/static"
    }
  }
}

# Load Balancer
resource "digitalocean_loadbalancer" "automatizawpp" {
  name   = "automatizawpp-lb-${var.environment}"
  region = var.region

  forwarding_rule {
    entry_protocol  = "HTTPS"
    entry_port      = 443
    target_protocol = "HTTP"
    target_port     = 3000
    certificate_id  = digitalocean_certificate.automatizawpp.id
  }

  forwarding_rule {
    entry_protocol  = "HTTP"
    entry_port      = 80
    target_protocol = "HTTP"
    target_port     = 3000
  }

  healthcheck {
    protocol = "http"
    port     = 3000
    path     = "/health"
    check_interval_seconds = 10
    response_timeout_seconds = 5
    healthy_threshold = 3
    unhealthy_threshold = 5
  }

  enable_proxy_protocol = false
  enable_backend_keepalive = true
  http_idempotency_header_enabled = true

  sticky_sessions {
    type = "cookies"
    cookie_name = "lb"
    cookie_ttl_seconds = 300
  }

  redirect_http_to_https = true
  enable_tlsv1_3 = true

  algorithm = "least_conn"
  status = "new"

  droplet_ids = digitalocean_droplet.app[*].id
}

# SSL Certificate
resource "digitalocean_certificate" "automatizawpp" {
  name            = "automatizawpp-cert-${var.environment}"
  type            = "lets_encrypt"
  domains         = [var.domain, "www.${var.domain}"]
  validation_method = "http"
}

# Domain
resource "digitalocean_domain" "automatizawpp" {
  name       = var.domain
  ip_address = digitalocean_loadbalancer.automatizawpp.ip
}

# DNS Records
resource "digitalocean_record" "www" {
  domain = digitalocean_domain.automatizawpp.name
  type   = "CNAME"
  name   = "www"
  value  = "@"
}

resource "digitalocean_record" "api" {
  domain = digitalocean_domain.automatizawpp.name
  type   = "CNAME"
  name   = "api"
  value  = "@"
}

# Firewall
resource "digitalocean_firewall" "automatizawpp" {
  name = "automatizawpp-fw-${var.environment}"

  inbound_rule {
    protocol = "tcp"
    port_range = "22"
    sources {
      addresses = var.allowed_ssh_ips
    }
  }

  inbound_rule {
    protocol = "tcp"
    port_range = "80"
    sources {
      addresses = ["0.0.0.0/0", "::/0"]
    }
  }

  inbound_rule {
    protocol = "tcp"
    port_range = "443"
    sources {
      addresses = ["0.0.0.0/0", "::/0"]
    }
  }

  outbound_rule {
    protocol = "tcp"
    port_range = "all"
    destinations {
      addresses = ["0.0.0.0/0", "::/0"]
    }
  }

  outbound_rule {
    protocol = "udp"
    port_range = "all"
    destinations {
      addresses = ["0.0.0.0/0", "::/0"]
    }
  }

  tags = ["web"]
}

# Spaces (Object Storage for backups)
resource "digitalocean_spaces_bucket" "backups" {
  name   = "automatizawpp-backups-${var.environment}"
  region = var.region
  acl    = "private"
  versioning {
    enabled = true
  }
}

# Monitoring - Alert Policy
resource "digitalocean_monitoring_alert_policy" "cpu" {
  alerts {
    slack {
      channel = var.slack_channel
      url     = var.slack_webhook_url
    }
  }

  window      = "5m"
  type        = "v1/insights/droplet/cpu"
  compare     = "greater_than"
  value       = 80
  enabled     = true
  description = "Alert when CPU exceeds 80%"
}

resource "digitalocean_monitoring_alert_policy" "memory" {
  alerts {
    slack {
      channel = var.slack_channel
      url     = var.slack_webhook_url
    }
  }

  window      = "5m"
  type        = "v1/insights/droplet/memory_utilization_percent"
  compare     = "greater_than"
  value       = 85
  enabled     = true
  description = "Alert when memory exceeds 85%"
}

# Random password for DB
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Output
output "loadbalancer_ip" {
  value       = digitalocean_loadbalancer.automatizawpp.ip
  description = "Load Balancer IP address"
}

output "domain" {
  value       = digitalocean_domain.automatizawpp.name
  description = "Application domain"
}

output "database_host" {
  value       = digitalocean_database_cluster.postgres.host
  sensitive   = true
  description = "Database host"
}

output "database_url" {
  value       = "postgresql://${digitalocean_database_user.automatizawpp.name}:${random_password.db_password.result}@${digitalocean_database_cluster.postgres.host}:${digitalocean_database_cluster.postgres.port}/automatizawpp?sslmode=require"
  sensitive   = true
  description = "Full database connection string"
}
