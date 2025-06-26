# PMP Question Service - AWS Lambda + API Gateway Deployment Guide

## Prerequisites

1. **AWS CLI** installed and configured
2. **AWS SAM CLI** installed
3. **Node.js 18+** installed
4. **AWS Account** with appropriate permissions

## Step-by-Step Deployment Process

### Step 1: Install AWS SAM CLI

```bash
# macOS
brew install aws-sam-cli

# Windows
# Download from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Linux
pip install aws-sam-cli
```

### Step 2: Configure AWS CLI

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter your output format (json)
```

### Step 3: Build the Application

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Build SAM application
sam build
```

### Step 4: Deploy to AWS

```bash
# First-time deployment (guided)
sam deploy --guided

# Follow the prompts:
# - Stack Name: pmp-question-service
# - AWS Region: us-east-1 (or your preferred region)
# - Confirm changes before deploy: Y
# - Allow SAM CLI IAM role creation: Y
# - Save arguments to configuration file: Y
```

### Step 5: Verify Deployment

```bash
# Get the API Gateway URL
aws cloudformation describe-stacks \
  --stack-name pmp-question-service \
  --query 'Stacks[0].Outputs[?OutputKey==`PMPQuestionApi`].OutputValue' \
  --output text

# Test the API
curl -X GET "YOUR_API_GATEWAY_URL/health"
```

### Step 6: Get API Key

```bash
# Get the API Key
aws cloudformation describe-stacks \
  --stack-name pmp-question-service \
  --query 'Stacks[0].Outputs[?OutputKey==`PMPApiKey`].OutputValue' \
  --output text
```

## API Usage

### Base URL
```
https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod/
```

### Endpoints

1. **Health Check**
   ```bash
   GET /health
   ```

2. **Get PMP Questions**
   ```bash
   GET /api/pmp-questions
   Headers: X-API-Key: YOUR_API_KEY
   ```

3. **Save Record**
   ```bash
   POST /api/saveRecord
   Headers: X-API-Key: YOUR_API_KEY
   Content-Type: application/json
   ```

### Example Usage

```bash
# Health check
curl -X GET "https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod/health"

# Get questions
curl -X GET "https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod/api/pmp-questions" \
  -H "X-API-Key: YOUR_API_KEY"

# Save record
curl -X POST "https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod/api/saveRecord" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1234567890",
    "processGroup": "Planning",
    "isValid": true,
    "isAttempted": true,
    "selectedOption": "A",
    "didUserGetItRight": true,
    "additionalNotes": "User correctly identified the answer"
  }'
```

## Monitoring and Logs

### View Lambda Logs
```bash
sam logs -n PMPQuestionFunction --stack-name pmp-question-service --tail
```

### View API Gateway Logs
```bash
# Enable CloudWatch logging in API Gateway console
# Or use AWS CLI to configure logging
```

## Updating the Deployment

### Step 1: Make Changes
Edit your code and test locally.

### Step 2: Build and Deploy
```bash
npm run build
sam build
sam deploy
```

## Cost Optimization

1. **Lambda Configuration**
   - Memory: 512MB (adjust based on performance needs)
   - Timeout: 30 seconds (adjust based on response time)

2. **API Gateway**
   - Enable caching for frequently accessed endpoints
   - Use usage plans to control rate limits

3. **Monitoring**
   - Set up CloudWatch alarms for errors
   - Monitor Lambda execution time and memory usage

## Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   # Clean and rebuild
   rm -rf .aws-sam
   npm run build
   sam build
   ```

2. **Deployment Errors**
   ```bash
   # Check CloudFormation events
   aws cloudformation describe-stack-events --stack-name pmp-question-service
   ```

3. **API Gateway CORS Issues**
   - Verify CORS configuration in template.yaml
   - Check preflight OPTIONS requests

4. **Lambda Timeout**
   - Increase timeout in template.yaml
   - Optimize code performance

### Useful Commands

```bash
# List all stacks
aws cloudformation list-stacks

# Delete stack
aws cloudformation delete-stack --stack-name pmp-question-service

# Get stack status
aws cloudformation describe-stacks --stack-name pmp-question-service

# View SAM logs
sam logs -n PMPQuestionFunction --stack-name pmp-question-service
```

## Security Considerations

1. **API Key Management**
   - Rotate API keys regularly
   - Use AWS Secrets Manager for sensitive data

2. **IAM Roles**
   - Follow principle of least privilege
   - Review and update permissions regularly

3. **Network Security**
   - Use VPC if needed for database access
   - Configure security groups appropriately

## Performance Optimization

1. **Lambda Cold Starts**
   - Use provisioned concurrency for critical functions
   - Optimize package size

2. **API Gateway**
   - Enable caching
   - Use compression

3. **Monitoring**
   - Set up CloudWatch dashboards
   - Monitor response times and error rates 