class Result:
    def __init__(self, success, data=None, error=None):
        self.success = success
        self.data = data
        self.error = error
        # Common pattern: result = Result(True, context)
