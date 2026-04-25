# Tech Stack

## Backend (Core Pipeline)

- **Framework:** FastAPI  
- **Async Workers:** Celery  
- **Message Broker / Queue:** Redis  
- **Database:** PostgreSQL  

---

## Frontend (UI Layer)

- **Framework:** Next.js  
- **UI Components:** shadcn/ui  
- **Styling:** Tailwind CSS  

---

## Communication Layer

- REST APIs via FastAPI  
- Polling for job status (initial approach)  
- Upgrade later → WebSockets (if needed)  

---

## DevOps (Minimal Setup)

- **Containerization:** Docker  
- **Local Orchestration:** docker-compose  

- Future deployment options:
  - AWS  
  - GCP  
  - Azure  

---

## System Flow

```

User (Next.js UI)
↓
FastAPI (API Gateway)
↓
Celery (Task Orchestrator)
↓
Redis (Queue)
↓
Workers (Transcription → NLP → Notes → Notification)
↓
PostgreSQL (Storage)

```

---

## Key Reasons for This Stack

### 1. Built for Async Pipelines
- Handles multi-stage workflows naturally  
- Supports retries and background jobs  

### 2. Python Ecosystem Advantage
- Best support for:
  - AI/ML
  - NLP
  - LLM integrations  

### 3. Clean Separation
- Frontend and backend are independent  
- Pipeline logic is isolated  
- UI only reflects system state  

### 4. Avoids Overengineering
- No Kafka  
- No unnecessary microservices  
- No premature scaling  

---

## What NOT to Use

- MERN (not ideal for async pipelines)  
- MongoDB (weak for structured relations)  
- Go (premature optimization)  
- Java (slower iteration speed)  

---

## Important Notes

This stack will work only if you:

- Implement retries properly  
- Track task states clearly  
- Expose status properly in UI  

Bad architecture cannot be fixed by a good stack.

---

## Final Stack (One Line)

**FastAPI + Celery + Redis + PostgreSQL + Next.js + shadcn + Tailwind**