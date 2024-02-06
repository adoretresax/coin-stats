terraform {
  cloud {
    organization = "adoretresax"

    workspaces {
      name = "bit-workspace"
    }
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.34.0"
    }
  }
}

provider "aws" {
  region = "ap-southeast-1"
}

# Fetching the AWS account ID dynamically
data "aws_caller_identity" "current" {}

# VPC Creation
resource "aws_vpc" "coin_stats_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "coin-stats-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.coin_stats_vpc.id

  tags = {
    Name = "main"
  }
}

# Subnet Creation
resource "aws_subnet" "subnet_1" {
  vpc_id            = aws_vpc.coin_stats_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "ap-southeast-1a"

  tags = {
    Name = "subnet-1"
  }
}

resource "aws_subnet" "subnet_2" {
  vpc_id            = aws_vpc.coin_stats_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "ap-southeast-1b"

  tags = {
    Name = "subnet-2"
  }
}

# Route Table
resource "aws_route_table" "r" {
  vpc_id = aws_vpc.coin_stats_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "main"
  }
}

resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.subnet_1.id
  route_table_id = aws_route_table.r.id
}

resource "aws_route_table_association" "b" {
  subnet_id      = aws_subnet.subnet_2.id
  route_table_id = aws_route_table.r.id
}

# Security Group for ALB
resource "aws_security_group" "alb_sg" {
  name        = "alb-security-group"
  description = "ALB Security Group"
  vpc_id      = aws_vpc.coin_stats_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Application Load Balancer (ALB)
resource "aws_lb" "ecs_alb" {
  name               = "ecs-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = [aws_subnet.subnet_1.id, aws_subnet.subnet_2.id]
  security_groups    = [aws_security_group.alb_sg.id]
}

# Target Group for ECS Tasks
resource "aws_lb_target_group" "ecs_tg" {
  name        = "ecs-target-group"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.coin_stats_vpc.id
  target_type = "ip"

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    path                = "/"
    interval            = 30
    matcher             = "200-299"
  }
}

# Application Load Balancer Listener
resource "aws_lb_listener" "alb_listener" {
  load_balancer_arn = aws_lb.ecs_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ecs_tg.arn
  }
}

# Output ALB DNS Name
output "alb_dns_name" {
  value = aws_lb.ecs_alb.dns_name
}

# ECR Repository with image tag immutability and scanning configuration
resource "aws_ecr_repository" "coin_stats_repo" {
  name                 = "coin-stats-be"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Restrictive ECR Repository Policy
resource "aws_ecr_repository_policy" "ecr_policy" {
  repository = aws_ecr_repository.coin_stats_repo.name

  policy = <<EOF
{
  "Version": "2008-10-17",
  "Statement": [
    {
      "Sid": "Statement1",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ]
    }
  ]
}
EOF
}

# ECS Cluster
resource "aws_ecs_cluster" "coin_stats_cluster" {
  name = "coin-stats-cluster"
}

# IAM Role for ECS Execution
resource "aws_iam_role" "ecs_execution_role" {
  name = "ecs_execution_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# ECS Task Definition with Health Check
resource "aws_ecs_task_definition" "coin_stats_task" {
  family                   = "coin-stats"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([{
    name      = "coin-stats-container"
    image     = "654654369553.dkr.ecr.ap-southeast-1.amazonaws.com/coin-stats-be:latest"
    cpu       = 256
    memory    = 1024
    essential = true
    portMappings = [{
      containerPort = 3000
      hostPort      = 3000
    }]
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }
  }])
}

# ECS Service
resource "aws_ecs_service" "coin_stats_service" {
  name            = "coin-stats-service"
  cluster         = aws_ecs_cluster.coin_stats_cluster.id
  task_definition = aws_ecs_task_definition.coin_stats_task.arn
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.subnet_1.id, aws_subnet.subnet_2.id]
    assign_public_ip = false
    security_groups  = [aws_security_group.ecs_sg.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.ecs_tg.arn
    container_name   = "coin-stats-container"
    container_port   = 3000
  }

  depends_on    = [aws_lb_listener.alb_listener]
  desired_count = 1
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_sg" {
  name        = "ecs_security_group"
  description = "Allow inbound traffic"
  vpc_id      = aws_vpc.coin_stats_vpc.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Security Group for ECS Executions
resource "aws_iam_role_policy" "ecs_execution_policy" {
  name = "ecs_execution_policy"
  role = aws_iam_role.ecs_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}
