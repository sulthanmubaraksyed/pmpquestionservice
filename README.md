# 📋 PMP Question Service

A RESTful API service for serving **Project Management Professional (PMP)** exam practice questions. Built with **TypeScript + Express**, deployable both locally and on **AWS Lambda** via AWS SAM.

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                      Client / Frontend                    │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTP + X-API-Key header
           ┌──────────────▼──────────────┐
           │    AWS API Gateway  /  Local │
           │         Express Server       │
           └──────────────┬──────────────┘
                          │
           ┌──────────────▼──────────────┐
           │       API Key Auth          │  ← middleware/apiKeyAuth.ts
           │    (requireApiKey guard)     │
           └──────────────┬──────────────┘
                          │
           ┌──────────────▼──────────────┐
           │         Routes              │  ← api/routes.ts
           │  GET /pmp-questions         │
           │  POST /saveRecord           │
           │  GET /getQuestion           │
           │  DELETE /deleteQuestion     │
           └──────────────┬──────────────┘
                          │
           ┌──────────────▼──────────────┐
           │      Question Service       │  ← utils/questionService.ts
           │  Reads/writes JSON files    │
           └──────────────┬──────────────┘
                          │
           ┌──────────────▼──────────────┐
           │     JSON Question Files     │
           │  in.ts  pl.ts  ex.ts        │
           │  mc.ts  cl.ts               │
           └─────────────────────────────┘
```

---

## 📁 Project Structure

```
pmpquestionservice/
├── src/
│   ├── api/
│   │   ├── app.ts          # Express app setup (middleware, routes, error handling)
│   │   ├── routes.ts       # All API route definitions
│   │   ├── lambda.ts       # AWS Lambda handler wrapper
│   │   └── auth.ts         # Lambda API key authorizer
│   ├── middleware/
│   │   └── apiKeyAuth.ts   # requireApiKey middleware
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces (QAResponseIndividual, RetrieveParams, etc.)
│   ├── utils/
│   │   ├── questionService.ts    # Core CRUD operations for questions
│   │   ├── apiKeyService.ts      # API key validation/management
│   │   ├── logger.ts             # Logging utility
│   │   └── questionManager.ts    # Question management helpers
│   ├── questions/
│   │   ├── in.ts           # Initiating process group questions
│   │   ├── pl.ts           # Planning process group questions
│   │   ├── ex.ts           # Executing process group questions
│   │   ├── mc.ts           # Monitoring & Controlling questions
│   │   └── cl.ts           # Closing process group questions
│   ├── config.ts           # API configuration (base URL, endpoints)
│   └── server.ts           # Lightweight local dev server
├── template.yaml           # AWS SAM deployment template
├── deploy.sh               # Deployment helper script
├── DEPLOYMENT_GUIDE.md     # Detailed AWS deployment guide
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm**
- _(For AWS deployment)_ AWS CLI + AWS SAM CLI

### Installation

```bash
git clone https://github.com/sulthanmubaraksyed/pmpquestionservice.git
cd pmpquestionservice
npm install
```

### Running Locally

```bash
npm run dev
```

The server starts on **http://localhost:3030**

---

## 🔑 Authentication

All API endpoints require an **API key** passed via the `X-API-Key` header.

```
X-API-Key: pmp_service_key_2024
```

| Status | Meaning |
|--------|---------|
| `401 Unauthorized` | Header missing |
| `403 Forbidden` | Invalid key |

---

## 📡 API Endpoints

### `GET /health`
Health check — no auth required.

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "PMP Question Service",
  "version": "1.0.0"
}
```

---

### `GET /api/pmp-questions`
Retrieve a filtered list of PMP questions.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `processGroup` | string | Filter by process group | `Initiating`, `Planning`, `Executing`, `Monitoring and Controlling`, `Closing`, `all` |
| `knowledgeArea` | string | Filter by knowledge area | `Integration`, `Scope`, `Schedule`, `all` |
| `count` | number | Max questions to return | `50` |
| `isValid` | boolean | Filter by validation status | `true` |

**Example Request:**
```bash
curl -H "X-API-Key: pmp_service_key_2024" \
  "http://localhost:3030/api/pmp-questions?processGroup=Planning&count=10"
```

**Example Response:**
```json
{
  "questions": [
    {
      "id": "uuid-here",
      "question_pmp": "A project manager is preparing the project charter...",
      "options_pmp": {
        "OPTION_A": "Conduct a stakeholder analysis",
        "OPTION_B": "Define the project scope",
        "OPTION_C": "Identify risks",
        "OPTION_D": "Develop the WBS"
      },
      "option_a_result": "Correct. Stakeholder analysis...",
      "option_b_result": "Incorrect. Scope definition comes later...",
      "process_group": "Initiating",
      "knowledge_area": "Stakeholder Management",
      "suggested_read": "PMBOK Guide Chapter 13",
      "concepts_to_understand": "Stakeholder identification and engagement"
    }
  ]
}
```

---

### `POST /api/saveRecord`
Update an existing question record (e.g., track user attempt results).

**Headers:** `X-API-Key`, `Content-Type: application/json`

**Request Body:**
```json
{
  "id": "question-uuid",
  "process_group": "Planning",
  "is_attempted": true,
  "selected_option": "OPTION_A",
  "did_user_get_it_right": true,
  "is_valid": true,
  "is_verified": false
}
```

**Response:**
```json
{ "message": "Record updated successfully" }
```

---

### `GET /api/getQuestion`
Fetch a single question by ID.

```bash
curl -H "X-API-Key: pmp_service_key_2024" \
  "http://localhost:3030/api/getQuestion?id=your-question-uuid"
```

---

### `DELETE /api/deleteQuestion`
Delete a question by ID and process group.

```bash
curl -X DELETE -H "X-API-Key: pmp_service_key_2024" \
  "http://localhost:3030/api/deleteQuestion?id=uuid&processGroup=Planning"
```

---

## 🗂️ PMP Process Groups & Question Files

Questions are organized by PMP process group, each stored in its own TypeScript file:

| File | Process Group | Description |
|------|--------------|-------------|
| `src/questions/in.ts` | **Initiating** | Project charter, stakeholder identification |
| `src/questions/pl.ts` | **Planning** | Scope, schedule, cost, risk planning |
| `src/questions/ex.ts` | **Executing** | Directing work, quality assurance |
| `src/questions/mc.ts` | **Monitoring & Controlling** | Change control, performance monitoring |
| `src/questions/cl.ts` | **Closing** | Project/phase closure |

---

## 🧩 Question Data Model

```typescript
interface QAResponseIndividual {
  id: string;                    // UUID
  question_pmp: string;          // The question text
  options_pmp: {
    OPTION_A: string;
    OPTION_B: string;
    OPTION_C: string;
    OPTION_D: string;
  };
  option_a_result: string;       // Explanation for Option A
  option_b_result: string;       // Explanation for Option B
  option_c_result: string;       // Explanation for Option C
  option_d_result: string;       // Explanation for Option D
  process_group: string;         // e.g., "Planning"
  knowledge_area: string;        // e.g., "Risk Management"
  tool: string;                  // PM tool/technique referenced
  suggested_read: string;        // Reading material reference
  concepts_to_understand: string;
  question_type: string;         // "single" or "multi-select"
  is_attempted: boolean;
  is_valid: boolean;
  is_verified: boolean;
  selected_option: string;
  did_user_get_it_right?: boolean;
  is_sample?: string;
}
```

---

## ☁️ AWS Deployment

This service is designed to run on **AWS Lambda + API Gateway** using [AWS SAM](https://aws.amazon.com/serverless/sam/).

### Build & Deploy

```bash
# Build TypeScript
npm run build

# Build SAM package
sam build

# Deploy (first time — guided)
sam deploy --guided

# Subsequent deploys
npm run deploy
```

### AWS Resources Created

| Resource | Type | Description |
|----------|------|-------------|
| `PMPQuestionFunction` | Lambda | Main API handler |
| `ApiKeyAuthorizer` | Lambda | API key validation authorizer |
| `PMPApi` | API Gateway | REST API with CORS |
| `PMPApiKey` | API Gateway Key | Service API key |
| `PMPUsagePlan` | Usage Plan | Rate: 100 req/s, Quota: 10,000/day |

> 📖 See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full step-by-step deployment instructions.

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Start compiled app |
| `npm run package` | Build + SAM build |
| `npm run deploy` | SAM deploy (guided) |

---

## 📝 License

ISC
