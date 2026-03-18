from app.workers.celery_app import celery
from app.core.pipeline.pipeline import ConsultationPipeline
from app.core.pipeline.context import ConsultationContext
from app.core.pipeline.stages.transcription import TranscriptionStage

@celery.task(bind=True)
def start_pipeline(self):
    context = ConsultationContext()

    pipeline = ConsultationPipeline([
        TranscriptionStage()
    ])

    result = pipeline.execute(context)

    return {"success": result.success}
