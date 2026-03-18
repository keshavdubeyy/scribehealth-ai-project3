from app.core.pipeline.result import Result

class TranscriptionStage:
    def process(self, context):
        context.transcript = "dummy transcript"
        return Result(success=True, data=context)
