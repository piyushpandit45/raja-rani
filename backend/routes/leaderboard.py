from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.database import get_database
from backend.models import GameType, LeaderboardEntry

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("/{game_type}", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    game_type: GameType,
    database: AsyncIOMotorDatabase = Depends(get_database),
) -> list[LeaderboardEntry]:
    cursor = (
        database.leaderboard.find({"game_type": game_type.value})
        .sort([("wins", -1), ("points", -1), ("username", 1)])
        .limit(50)
    )
    return [
        LeaderboardEntry(
            username=document["username"],
            game_type=game_type,
            wins=document.get("wins", 0),
            points=document.get("points", 0),
            crowns=document.get("wins", 0),
        )
        async for document in cursor
    ]
