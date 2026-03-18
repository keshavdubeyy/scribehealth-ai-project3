class ConsultationPipeline:
    def __init__(self, stages):
        self.stages = stages

    def execute(self, context):
        for stage in self.stages:
            result = stage.process(context)

            if not result.success:
                context.errors.append(result.error)
                return result

            context = result.data

        return result
