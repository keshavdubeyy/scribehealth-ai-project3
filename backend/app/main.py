from fastapi import FastAPI
from app.api.routes import health, consultation, status

app = FastAPI()

app.include_router(health.router)
app.include_router(consultation.router)
app.include_router(status.router)
