from fastapi import APIRouter
from app.workers.tasks import start_pipeline

router = APIRouter()

@router.post("/process")
def process_consultation():
    # .delay() triggers celery async task
    job_id = start_pipeline.delay().id
    return {"job_id": job_id}
