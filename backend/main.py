from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.database import lifespan
from backend.routes import auth, games, health, leaderboard

settings = get_settings()
app = FastAPI(
    title="Raja & Rani API",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(games.router)
app.include_router(leaderboard.router)
app.include_router(health.router)
app.include_router(health.root_router)
