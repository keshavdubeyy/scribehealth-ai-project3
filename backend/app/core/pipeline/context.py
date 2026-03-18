class ConsultationContext:
    def __init__(self):
        # Keeps state as stage processes audio -> transcript -> entities -> notes
        self.audio = None
        self.transcript = None
        self.entities = []
        self.note = None
        self.errors = []
