import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import CORS_ORIGINS, PROJECT_NAME
from backend.app.api.v1.endpoints import sessions, drivers, teams, comparisons

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=PROJECT_NAME,
    description="F1 Tyre Degradation and Stint Pace Analysis Engine",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 endpoints
app.include_router(sessions.router, prefix="/api/v1/sessions", tags=["Sessions"])
app.include_router(drivers.router, prefix="/api/v1/analysis", tags=["Driver Analysis"])
app.include_router(teams.router, prefix="/api/v1/analysis", tags=["Constructor Analysis"])
app.include_router(comparisons.router, prefix="/api/v1/comparisons", tags=["Comparisons"])

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": PROJECT_NAME,
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
