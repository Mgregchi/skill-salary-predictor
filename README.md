# Skill-to-Salary Prediction API

Open-source, modular salary prediction system with job scheduling and webhook notifications.

## Features

✨ **Core Features**
- 🚀 Instant salary predictions (<3 seconds)
- 🌍 Multi-region support (US, EU, UK, CA, AU, IN, NG, LATAM, APAC)
- 🎯 90+ supported tech skills
- 💼 Experience-based adjustments
- 🔗 Skill combination bonuses
- 📊 Confidence scoring

🔧 **Technical Features**
- ⚡ Built with Fastify (high performance)
- 🗄️ Prisma ORM (type-safe database)
- 📋 Job queue with webhook notifications
- 🔄 Batch processing
- 📈 Analytics endpoints
- 📚 OpenAPI/Swagger documentation
- 🚦 Rate limiting
- 🔒 CORS enabled

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/mgregchi/skill-salary-predictor.git
cd skill-salary-predictor

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npm run setup

# Start server
npm start
```

### Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/salary_predictor"

# Server
PORT=3000
NODE_ENV=development

# Optional: Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

## Project Structure

```
skill-salary-predictor/
├── core/
│   └── predictor.js          # Core prediction engine
├── api/
│   └── server.js             # Fastify API server
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── tests/
│   ├── predictor.test.js
│   └── api.test.js
├── package.json
├── .env.example
└── README.md
```

## API Documentation

Once the server is running, visit:
- API Docs: `http://localhost:3000/docs`
- Health Check: `http://localhost:3000/health`

### Core Endpoints

#### POST `/api/predict` - Instant Prediction

Get salary prediction in <3 seconds.

```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["React", "TypeScript", "Node.js", "AWS"],
    "region": "US",
    "experienceYears": 5,
    "saveResult": true
  }'
```

**Response:**
```json
{
  "estimatedSalary": 142500,
  "salaryRange": {
    "min": 121125,
    "max": 171000
  },
  "currency": "USD",
  "region": "US",
  "experienceYears": 5,
  "breakdown": {
    "baseSalary": 75000,
    "skillMultiplier": 1.45,
    "experienceMultiplier": 1.25,
    "comboBonus": 0.15,
    "seniorBonus": 0.2
  },
  "skills": {
    "matched": ["react", "typescript", "nodejs", "aws"],
    "unmatched": [],
    "total": 4
  },
  "confidence": 91,
  "executionTimeMs": 2
}
```

#### POST `/api/jobs` - Schedule Job

For heavy workloads or webhook notifications.

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["Python", "TensorFlow", "Kubernetes"],
    "region": "US",
    "experienceYears": 8,
    "webhookUrl": "https://yourapp.com/webhook",
    "metadata": {
      "userId": "user123",
      "source": "mobile-app"
    }
  }'
```

**Response:**
```json
{
  "jobId": "job_1_1702345678901",
  "status": "pending",
  "statusUrl": "/api/jobs/job_1_1702345678901"
}
```

#### GET `/api/jobs/:jobId` - Check Job Status

```bash
curl http://localhost:3000/api/jobs/job_1_1702345678901
```

**Response:**
```json
{
  "id": "job_1_1702345678901",
  "status": "completed",
  "result": {
    "estimatedSalary": 165000,
    "salaryRange": { "min": 140250, "max": 198000 }
  },
  "createdAt": 1702345678901,
  "completedAt": 1702345678950
}
```

#### POST `/api/batch` - Batch Processing

Process multiple skill sets at once.

```bash
curl -X POST http://localhost:3000/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "skillSets": [
      ["React", "TypeScript"],
      ["Python", "Django"],
      ["Go", "Kubernetes"]
    ],
    "region": "US",
    "experienceYears": 3
  }'
```

#### GET `/api/skills` - List Supported Skills

```bash
curl http://localhost:3000/api/skills
```

#### GET `/api/regions` - List Supported Regions

```bash
curl http://localhost:3000/api/regions
```

### Analytics Endpoints

#### GET `/api/analytics/trends` - Salary Trends

```bash
curl http://localhost:3000/api/analytics/trends?region=US&limit=100
```

#### GET `/api/analytics/skills` - Top Skills by Demand

```bash
curl http://localhost:3000/api/analytics/skills?limit=20
```

## Supported Skills

### Languages (50+)
JavaScript, TypeScript, Python, Go, Rust, Java, Kotlin, Swift, C++, C#, Ruby, PHP, Scala, Elixir

### Frontend (10+)
React, Vue, Angular, Svelte, Next.js, Nuxt

### Backend (15+)
Node.js, Express, Fastify, NestJS, Django, Flask, Rails, Spring

### Databases (10+)
PostgreSQL, MongoDB, MySQL, Redis, Elasticsearch, DynamoDB, Cassandra

### Cloud & DevOps (15+)
AWS, Azure, GCP, Docker, Kubernetes, Terraform, Ansible, Jenkins, GitHub Actions

### Data & ML (10+)
Machine Learning, Deep Learning, TensorFlow, PyTorch, Pandas, Spark, Airflow

### Mobile (5+)
React Native, Flutter, iOS, Android

### Other (10+)
GraphQL, gRPC, Microservices, Blockchain, WebAssembly, Cybersecurity

## Webhook Notifications

When scheduling jobs with `webhookUrl`, you'll receive notifications:

**Webhook Payload (Success):**
```json
{
  "jobId": "job_1_1702345678901",
  "status": "completed",
  "result": {
    "estimatedSalary": 142500,
    "salaryRange": { "min": 121125, "max": 171000 },
    "confidence": 91
  }
}
```

**Webhook Payload (Failure):**
```json
{
  "jobId": "job_1_1702345678901",
  "status": "failed",
  "error": "Invalid skills provided"
}
```

## Using as a Library

```javascript
const { SalaryPredictor } = require('./core/predictor');

// Create predictor
const predictor = new SalaryPredictor({
  region: 'US',
  experienceYears: 5
});

// Get prediction
const result = predictor.predict([
  'React', 'TypeScript', 'Node.js', 'AWS'
]);

console.log(`Salary: $${result.estimatedSalary.toLocaleString()}`);
console.log(`Confidence: ${result.confidence}%`);

// Chain operations
const result2 = predictor
  .setRegion('EU')
  .setExperience(8)
  .predict(['Python', 'Django', 'PostgreSQL']);
```

## Database Setup

### Migrations

```bash
# Create migration
npx prisma migrate dev --name init

# Apply migration
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

### Prisma Studio

```bash
npm run prisma:studio
```

Visit `http://localhost:5555` to manage your database visually.

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Performance

- **Instant predictions**: <3ms execution time
- **Batch processing**: 100+ predictions in <100ms
- **Rate limiting**: 100 requests/minute default
- **Concurrent jobs**: Unlimited (async processing)

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/salary_predictor
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: salary_predictor
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Roadmap

- [ ] Machine learning model training
- [ ] Historical data analysis
- [ ] Real-time market data integration
- [ ] Company-specific adjustments
- [ ] Benefits calculator
- [ ] Equity/stock options valuation
- [ ] GraphQL API
- [ ] WebSocket support for real-time updates

## License

MIT License - feel free to use in your projects!

## Support

- 📧 Email: mgregchi+support[at]gmail.com
- 💬 Discord: [Join our community](#)
- 🐛 Issues: [GitHub Issues](#)

---

Built with ❤️ for the open-source community