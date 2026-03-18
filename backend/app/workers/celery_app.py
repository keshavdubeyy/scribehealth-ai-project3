import os
from celery import Celery

redis_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")

celery = Celery(
    "worker",
    broker=redis_url,
    backend=redis_url,
    include=['app.workers.tasks']
)


