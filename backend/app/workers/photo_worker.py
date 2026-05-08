"""arq worker for durable photo-analysis jobs.

Runs alongside the API process. The API enqueues `analyze_photo_job` with the
object-storage key for the uploaded image; this worker fetches the bytes,
opens its own DB session, and runs `_perform_photo_analysis`.

Worker entrypoint:
    arq app.workers.photo_worker.WorkerSettings
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from arq.connections import RedisSettings

from app.core.config import settings
from app.core.database import SessionFactory
from app.services import object_storage


logger = logging.getLogger(__name__)


def _redis_settings() -> RedisSettings:
    """Build arq RedisSettings from REDIS_URL or fall back to localhost."""
    url = settings.REDIS_URL or "redis://localhost:6379/0"
    return RedisSettings.from_dsn(url)


async def analyze_photo_job(
    ctx: Dict[str, Any],
    *,
    image_key: str,
    user_id: str,
    user_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Run photo analysis for an enqueued job.

    `image_key` is an opaque object-storage key returned by `object_storage.put_image`.
    Returns the same response shape as the synchronous endpoint so pollers can
    consume it without branching.
    """
    # Local import — avoid circular import at module load.
    from app.api.food.photo_analysis import _perform_photo_analysis

    image_data = object_storage.get_image(image_key)

    db = SessionFactory()
    try:
        result = await _perform_photo_analysis(
            image_data=image_data,
            user_context=user_context or {},
            user_id=user_id,
            db=db,
        )
        return result
    finally:
        db.close()
        # Best-effort blob cleanup once the job has produced a result.
        try:
            object_storage.delete_image(image_key)
        except Exception as e:
            logger.warning("Failed to delete photo blob %s: %s", image_key, e)


class WorkerSettings:
    """arq WorkerSettings — referenced by the `arq` CLI entrypoint."""

    functions = [analyze_photo_job]
    redis_settings = _redis_settings()
    queue_name = settings.ARQ_QUEUE_NAME
    job_timeout = max(60, settings.GEMINI_TIMEOUT_SECONDS * 4)
    max_jobs = 4
    keep_result = 60 * 60  # keep job results for 1h so polls can fetch them
