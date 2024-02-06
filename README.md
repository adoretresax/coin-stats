# Crypto Backend Service with NestJS and AWS

## Overview

This NestJS application, designed for real-time cryptocurrency data processing, interacts with the Bitazza API through WebSocket connections and is deployed on AWS. The application emphasizes efficient management of cryptocurrency data, with a focus on scalability and real-time data handling.

## Key Features

- **Instruments Service**: Manages WebSocket connections for real-time cryptocurrency data streaming.
- **API Endpoints**:
  - `/api/get-top-gainers`: Retrieves the top cryptocurrency gainers.
  - `/health`: For service health checks.
- **CI/CD Pipeline**: Incorporates linting, Terraform-based infrastructure planning and applying, and comprehensive testing.

## Application Port

The application is configured to run on port `3000`.

## New Endpoint: Get Top Gainers

The `/api/get-top-gainers` endpoint fetches the top cryptocurrency gainers within a specified date range.

### Usage

- **Endpoint**: `GET /api/get-top-gainers`
- **Query Parameters**:
  - `omsId` (required): The OMS ID.
  - `fromDate` (optional): The start date for the range (format: YYYY-MM-DD). Default is "2020-07-18".
  - `toDate` (optional): The end date for the range (format: YYYY-MM-DD). If not provided, the current date is used.

### Example Request

```javascript
const omsId = 1;
const fromDate = "2020-01-01"; // Optional: specify a start date or remove if not needed
const toDate = "2021-12-31"; // Optional: specify an end date or remove if not needed

// Example usage in JavaScript
// axios.get('/api/get-top-gainers?omsId=1&fromDate=2020-01-01&toDate=2021-12-31');
```

### Response

The response will be a JSON array of top gainers with relevant data for each cryptocurrency.

### Error Handling

Errors are returned with appropriate HTTP status codes. For internal server errors, a status code of 500 is returned.

---

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
