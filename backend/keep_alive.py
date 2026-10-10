import asyncio
import logging
from urllib.error import URLError
from urllib.request import urlopen

HEALTH_CHECK_URL = "https://raja-rani-backend-4fx9.onrender.com/health"
KEEP_ALIVE_INTERVAL_SECONDS = 14 * 60
REQUEST_TIMEOUT_SECONDS = 10

logger = logging.getLogger(__name__)


def ping_health_endpoint() -> int | None:
    try:
        with urlopen(HEALTH_CHECK_URL, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            status_code = response.status
    except (OSError, URLError) as error:
        logger.warning("Render keep-alive ping failed: %s", error)
        return None

    logger.info("Render keep-alive ping succeeded with status %s", status_code)
    return status_code


async def run_keep_alive() -> None:
    while True:
        await asyncio.sleep(KEEP_ALIVE_INTERVAL_SECONDS)
        await asyncio.to_thread(ping_health_endpoint)
