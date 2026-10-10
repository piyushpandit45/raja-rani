from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import PyMongoError

from backend.database import get_database

router = APIRouter(prefix="/api", tags=["health"])
root_router = APIRouter(tags=["health"])


@root_router.get("/health", response_class=PlainTextResponse, status_code=200)
async def root_health_check() -> str:
    return "OK"


@router.get("/health")
async def health_check(database: AsyncIOMotorDatabase = Depends(get_database)) -> dict[str, object]:
    try:
        await database.command("ping")
    except PyMongoError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "error", "db_connected": False},
        ) from error
    return {"status": "ok", "db_connected": True}
