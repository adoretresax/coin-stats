# Crypto Backend Service with NestJS and AWS

## Overview

This NestJS application, designed for real-time cryptocurrency data processing, interacts with the Bitazza API through WebSocket connections and is deployed on AWS. The application emphasizes efficient management of cryptocurrency data, with a focus on scalability and real-time data handling.

## Key Features

- **Instruments Service**: Manages WebSocket connections for real-time cryptocurrency data streaming.
- **API Endpoints**: Includes `/api/get-top-gainers` for top cryptocurrency gainers and `/health` for service health checks.
- **CI/CD Pipeline**: Incorporates linting, Terraform-based infrastructure planning and applying, and comprehensive testing.

## Setup and Configuration

- **Entry Point (`main.ts`)**: Initializes the NestJS application with WebSocket support and CORS.
- **Running the App**: Launch the application using `npm run start`.

### Environment and Dependencies

- Configured for Docker containerization, leveraging AWS ECS and ECR for deployment.
- Managed dependencies via `npm` in a Node.js environment.

## Docker Build for M1 Architecture

The Dockerfile is configured for the `linux/amd64` platform, ensuring compatibility with Apple's M1 architecture. This ensures that the Docker image can be built and run seamlessly on M1 machines, as well as on traditional amd64 architecture.

To build the Docker image for M1 architecture, use:

```bash
docker build --platform=linux/amd64 -t coin-stats-be .
```

## CI/CD Pipeline Overview

1. **Lint**: Code quality and consistency checks.
2. **Plan and Apply**: Terraform-based AWS infrastructure deployment.
3. **Test**: Execution of unit and integration tests.

### AWS Infrastructure

- Deployed on AWS with ECS for container orchestration and ALB for load balancing.

## Project Scripts

- **Build, Start, Lint, Test**: Simplified scripts in `package.json` for project management.

## License

This project is licensed under the [MIT License](LICENSE).
