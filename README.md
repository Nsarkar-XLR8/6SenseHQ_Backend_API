<br />
<div align="center">
  <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNG52eG5nZGNuYmg5bzRjMHRhdWRoN2M2b2J3YjRyanUwZGQwdzI1byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1X7Al9gXX8gXd3HdSF/giphy.gif" alt="Modern Developer Animation" width="200" height="200"/>
</div>

<h1 align="center">🚀 Ultimate TypeScript Express Boilerplate</h1>

<div align="center">
  <p><strong>A production-ready, industry-standard backend boilerplate designed for scale and developer experience.</strong></p>

  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&duration=4000&pause=1000&color=2563EB&center=true&vCenter=true&width=500&lines=TypeScript+%2B+Express.js;MongoDB,+Postgres,+MySQL;Swagger+OpenAPI+Docs;RabbitMQ+%2B+Kafka+Queuing;Docker+%2B+Kubernetes+Ready" alt="Typing SVG" />
  </a>
  <br/>
  <br/>
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=ts,nodejs,express,mongodb,postgres,mysql,docker,kubernetes,rabbitmq,kafka,jest,vitest,git,github&theme=dark&perline=7" alt="Tech Stack" />
  </a>
</div>

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=Swagger&logoColor=black)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

</div>

<br />

## ✨ Features

- **Unified Message Bus** with transport-aware routing for BullMQ, Kafka, and RabbitMQ.
- **Parallel Worker Runtime** with dedicated worker entrypoints for queue/event/command processing.
- **BullMQ by Default** for delayed/retryable jobs with optional Kafka and RabbitMQ integrations.
- **Authentication + Security** with JWT access/refresh rotation, refresh reuse detection, RBAC guard, and Redis-backed rate limiting.
- **Stripe Webhooks** with signature verification, idempotency protection, and async dispatch via queue workflows.
- **Observability** with OpenTelemetry tracing, Prometheus metrics, structured logging, and capability diagnostics.
- **OpenAPI + Contract Checks** with Swagger docs export and Spectral linting.
- **Strict CI Quality Gate** covering typecheck, lint, tests, contracts, and security audit.
- **Migration + Seeding Support** with `migrate-mongo` and seed scripts.
- **Docker + Kubernetes Ready** with local stack orchestration and production manifests.

---

## ⚡ Quick Start

### 1. Prerequisites
Install the following:
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) for `dev:stack` (optional but recommended)

### 2. Clone
```bash
git clone https://github.com/Nayem-Dev/TS_Backend.git
cd TS_Backend/TS_Boiler_Plate
```

### 3. Install
```bash
npm install
```

### 4. Configure Environment
```bash
cp .env.example .env
```

Set required values in `.env`:
```env
DB_TYPE=mongodb
MONGODB_URL=mongodb://localhost:27017/ts_boilerplate
REDIS_URL=redis://localhost:6379

BULLMQ_ENABLED=true
KAFKA_ENABLED=true
RABBITMQ_ENABLED=true
STRIPE_ENABLED=false
```

### 5. Run
- API only:
```bash
npm run dev
```
- Full local stack (API + workers + infra via Docker):
```bash
npm run dev:stack
```

---

## 📂 Project Structure

```text
TS_Boiler_Plate/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── auth/
│   ├── config/
│   ├── database/
│   ├── jobs/
│   ├── lib/
│   ├── messaging/          # Unified message bus
│   ├── modules/
│   ├── observability/
│   ├── payments/
│   ├── queues/
│   ├── routes/
│   ├── workers/            # Dedicated worker entrypoints
│   └── utils/
├── docker-compose.yml
├── k8s/
└── scripts/
```

---

## 🛠️ Scripts Overview

| Command | Description |
|---|---|
| `npm run dev` | Start API in dev mode |
| `npm run dev:stack` | Start API + workers + infra (Docker Compose) |
| `npm run worker:bullmq` | Run BullMQ worker |
| `npm run worker:kafka` | Run Kafka consumer worker |
| `npm run worker:rabbitmq` | Run RabbitMQ consumer worker |
| `npm run typecheck` | Run strict TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest suites |
| `npm run check:contracts` | Export OpenAPI + run Spectral lint |
| `npm run check:security` | Run npm audit gate |
| `npm run check:all` | Run full quality gate |
| `npm run migrate:up` | Apply Mongo migrations |
| `npm run seed` | Run seed data |

---

## 🔎 Diagnostics Endpoints

- `GET /api/v1/health`
- `GET /api/v1/ready`
- `GET /api/v1/system/capabilities`
- `GET /api/v1/system/pipeline-ready`
- `GET /metrics`

---

## 🤝 Contributing

Contributions are welcome. Please ensure `npm run check:all` passes before opening a PR.

<div align="center">
  <sub>Built with ❤️ by the community. Stay awesome! 🚀</sub>
</div>
