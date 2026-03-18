from fastapi import APIRouter
from app.workers.celery_app import celery

router = APIRouter()

@router.get("/status/{job_id}")
def get_status(job_id: str):
    result = celery.AsyncResult(job_id)
    return {"status": result.status}

    # Possible statuses: PENDING, STARTED, SUCCESS, FAILURE, RETRY, REVOKED
