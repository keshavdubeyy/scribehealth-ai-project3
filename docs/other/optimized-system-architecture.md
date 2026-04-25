## 1. System Architecture

### Core Services

- **API Gateway**: Receives consultation requests, returns job IDs, and provides status endpoints.
- **Pipeline Orchestrator**: Manages pipeline execution, stage transitions, retries, and idempotency.
- **Stage Workers** (asynchronous, queue-based):
  - **Transcription Worker**: Uses primary (e.g., Google) and fallback (e.g., Whisper) services.
  - **NLP Worker**: Uses primary (e.g., LLM) and fallback (e.g., Basic) NLP services.
  - **Note Generation Worker**
  - **Notification Worker**
- **Audit Service**: Centralized logging for all actions and errors.
- **Persistence Layer**: Stores consultation context, notes, error logs, and job status.
- **Idempotency Service**: Ensures no duplicate notes per consultation.

### Interactions

- All stages communicate via message queues (e.g., RabbitMQ, Kafka, or cloud equivalents).
- Each stage worker is stateless and idempotent.
- Audit Service is called on every error or critical event.
- Notification failures are logged but do not block the pipeline.

---

## 2. Pipeline Stage Details

### A. Transcription Stage

- **Failure Scenarios**:
  - Service unavailable
  - Low confidence score
  - File corruption
- **Retry Strategy**:
  - Exponential backoff, max 3 attempts
- **Fallback**:
  - On persistent failure, switch to fallback transcription service
  - If both fail, mark as critical, log, and halt pipeline

### B. NLP Stage

- **Failure Scenarios**:
  - Service timeout
  - Entity extraction errors
  - Unexpected input format
- **Retry Strategy**:
  - Exponential backoff, max 2 attempts
- **Fallback**:
  - Use fallback NLP service
  - If both fail, mark as critical, log, and halt pipeline

### C. Note Generation Stage

- **Failure Scenarios**:
  - Template mismatch
  - Generation service error
- **Retry Strategy**:
  - Fixed delay, max 2 attempts
- **Fallback**:
  - Use default template or simplified note generator
  - If all fail, mark as critical, log, and halt pipeline

### D. Notification Stage

- **Failure Scenarios**:
  - Channel unavailable (e.g., email server down)
  - Invalid recipient
- **Retry Strategy**:
  - Linear backoff, max 3 attempts per channel
- **Fallback**:
  - Try alternate channels (SMS, WhatsApp)
  - If all fail, mark as non-critical, log, and continue pipeline

---

## 3. Fault Tolerance, Idempotency, and Logging

- **Transcription & NLP**: Both have fallback services and retries; failures are logged with error type and context.
- **Notification**: Failures do not block note creation; all attempts and failures are logged.
- **Idempotency**: Each pipeline execution is keyed by consultation ID; before note creation, check for existing note to prevent duplicates.
- **Audit Logging**: Every error, retry, fallback, and critical/non-critical failure is logged with user, action, and timestamp.

---

## 4. Sequence Flow

### Success Case

1. API Gateway receives request, creates job, and persists context.
2. Orchestrator enqueues job to Transcription Worker.
3. Transcription Worker processes audio, returns transcript.
4. NLP Worker extracts entities.
5. Note Generation Worker creates note.
6. Notification Worker sends notifications.
7. Each stage logs actions and errors to Audit Service.
8. Final status is updated and available via API.

### Failure Case (e.g., Transcription Service Down)

1. Transcription Worker fails, retries.
2. After retries, switches to fallback service.
3. If fallback fails, logs critical error, halts pipeline, updates job status.
4. Audit Service logs all attempts and errors.
5. No duplicate notes are created due to idempotency check.

---

## 5. API Boundaries

- **/consultations [POST]**: Start new pipeline, returns job ID.
- **/consultations/{id}/status [GET]**: Get pipeline/job status.
- **/consultations/{id}/note [GET]**: Retrieve generated note.
- **/consultations/{id}/errors [GET]**: Retrieve error logs for a job.
- **/consultations/{id}/retry [POST]**: Manually trigger retry for failed stage (optional).

---

## 6. Diagram Summaries

### A. Services & Interactions

- API Gateway ⇄ Orchestrator ⇄ [Queue] ⇄ Stage Workers
- Stage Workers ⇄ Persistence Layer
- Stage Workers ⇄ Audit Service
- Notification Worker ⇄ External Channels

### B. Sequence (Success & Failure)

- [API Request] → [Orchestrator] → [Transcription Worker] → [NLP Worker] → [Note Generation Worker] → [Notification Worker]
- On failure: [Stage Worker] → [Retry] → [Fallback] → [Audit Log] → [Critical: Halt | Non-critical: Continue]

---

This architecture ensures robust, asynchronous, and fault-tolerant processing with clear API boundaries and operational transparency. If you need a visual diagram (e.g., Mermaid or PlantUML), let me know! 