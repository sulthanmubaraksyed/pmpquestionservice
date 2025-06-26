#!/bin/bash

# PMP Question Service - AWS Lambda Deployment Script

set -e

echo "🚀 Starting PMP Question Service deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    print_error "AWS SAM CLI is not installed. Please install it first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install it first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install it first."
    exit 1
fi

print_status "All prerequisites are satisfied!"

# Check AWS credentials
print_status "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "AWS credentials are valid!"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build the application
print_status "Building the application..."
npm run build

# Build SAM application
print_status "Building SAM application..."
sam build

# Deploy to AWS
print_status "Deploying to AWS..."
if [ "$1" = "--guided" ]; then
    sam deploy --guided
else
    sam deploy
fi

# Get deployment outputs
print_status "Getting deployment outputs..."

API_URL=$(aws cloudformation describe-stacks \
  --stack-name pmp-question-service \
  --query 'Stacks[0].Outputs[?OutputKey==`PMPQuestionApi`].OutputValue' \
  --output text 2>/dev/null || echo "Stack not found")

API_KEY=$(aws cloudformation describe-stacks \
  --stack-name pmp-question-service \
  --query 'Stacks[0].Outputs[?OutputKey==`PMPApiKey`].OutputValue' \
  --output text 2>/dev/null || echo "API Key not found")

# Print deployment summary
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "API Gateway URL: $API_URL"
echo "API Key: $API_KEY"
echo ""
echo "🧪 Test your deployment:"
echo "========================"
echo "Health Check:"
echo "curl -X GET \"$API_URL/health\""
echo ""
echo "Get Questions:"
echo "curl -X GET \"$API_URL/api/pmp-questions\" -H \"X-API-Key: $API_KEY\""
echo ""
echo "📚 Documentation:"
echo "================="
echo "See DEPLOYMENT_GUIDE.md for detailed usage instructions"
echo ""
echo "🔍 Monitoring:"
echo "=============="
echo "View logs: sam logs -n PMPQuestionFunction --stack-name pmp-question-service --tail"
echo "View stack: aws cloudformation describe-stacks --stack-name pmp-question-service" 