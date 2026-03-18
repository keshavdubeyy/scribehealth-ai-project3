#!/bin/bash

# Load python venv
source venv/bin/activate

echo "Starting Celery worker..."
celery -A app.workers.celery_app.celery worker --loglevel=info > celery.log 2>&1 &
CELERY_PID=$!

echo "Starting FastAPI server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 > fastapi.log 2>&1 &
FASTAPI_PID=$!

sleep 5

echo "Testing /process endpoint..."
curl -s -X POST http://localhost:8000/process > process.json
cat process.json

# Extract job_id
JOB_ID=$(grep -o '"job_id":"[^"]*' process.json | cut -d'"' -f4)

if [ -z "$JOB_ID" ] || [ "$JOB_ID" == "null" ]; then
  echo "Error: Did not receive job_id"
  kill $CELERY_PID $FASTAPI_PID 2>/dev/null || true
  exit 1
fi

echo -e "\nJob ID: $JOB_ID"
sleep 5 # Wait for worker to finish processing

echo "Testing /status endpoint..."
curl -s http://localhost:8000/status/$JOB_ID

echo -e "\nLogs from Celery:"
cat celery.log | tail -n 10

echo -e "\nLogs from FastAPI:"
cat fastapi.log | tail -n 10

# Cleanup
kill $CELERY_PID $FASTAPI_PID 2>/dev/null || true
echo "Done."

