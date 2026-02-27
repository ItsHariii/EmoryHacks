import asyncio
import logging
import time
from typing import Any, Optional, Sequence, Union

import google.generativeai as genai

from app.core.config import settings


logger = logging.getLogger(__name__)


class AIServiceUnavailable(Exception):
    """Raised when the AI service is not available (missing config or circuit open)."""


class AIRequestFailed(Exception):
    """Raised when an AI request ultimately fails after retries."""


class AITimeoutError(AIRequestFailed):
    """Raised when an AI request repeatedly times out."""


class GeminiClient:
    """
    Thin wrapper around the Gemini SDK that adds:
    - Centralized configuration from Settings
    - Per-call timeouts
    - Bounded retries with exponential backoff
    - Simple circuit-breaker to avoid hammering an unhealthy upstream
    """

    def __init__(
        self,
        api_key: str,
        model_name: str,
        *,
        timeout_seconds: int = 20,
        max_retries: int = 2,
        cool_down_seconds: int = 30,
        name: str = "gemini",
    ) -> None:
        self.api_key = api_key
        self.model_name = model_name
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        self.cool_down_seconds = cool_down_seconds
        self.name = name

        # Epoch timestamp until which the circuit is considered "open"
        self._circuit_open_until: float = 0.0

    @property
    def is_configured(self) -> bool:
        """Whether this client has an API key configured."""
        return bool(self.api_key)

    @property
    def is_circuit_open(self) -> bool:
        """Whether the circuit breaker is currently open."""
        return time.time() < self._circuit_open_until

    @property
    def is_available(self) -> bool:
        """Convenience property for callers that want a quick availability check."""
        return self.is_configured and not self.is_circuit_open

    def _open_circuit(self) -> None:
        self._circuit_open_until = time.time() + self.cool_down_seconds
        logger.warning(
            "Opening circuit for Gemini client '%s' for %s seconds after repeated failures.",
            self.name,
            self.cool_down_seconds,
        )

    def _ensure_available(self) -> None:
        if not self.is_configured:
            raise AIServiceUnavailable(
                f"Gemini client '{self.name}' is not configured (missing API key)."
            )
        if self.is_circuit_open:
            raise AIServiceUnavailable(
                f"Gemini client '{self.name}' circuit breaker is currently open."
            )

    def _generate_content_sync(
        self,
        parts: Union[str, Sequence[Any]],
        **kwargs: Any,
    ):
        """
        Synchronous wrapper around the SDK call.
        This is executed in a thread so it can be awaited with a timeout.
        """
        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel(self.model_name)
        return model.generate_content(parts, **kwargs)

    async def generate_content(
        self,
        parts: Union[str, Sequence[Any]],
        **kwargs: Any,
    ):
        """
        Call Gemini with:
        - Timeout
        - Retries with exponential backoff
        - Circuit breaker on repeated failures
        """
        self._ensure_available()

        last_err: Optional[Exception] = None

        for attempt in range(self.max_retries + 1):
            try:
                return await asyncio.wait_for(
                    asyncio.to_thread(self._generate_content_sync, parts, **kwargs),
                    timeout=self.timeout_seconds,
                )
            except asyncio.TimeoutError as e:
                last_err = e
                logger.warning(
                    "Gemini client '%s' timeout on attempt %s/%s",
                    self.name,
                    attempt + 1,
                    self.max_retries + 1,
                )
            except Exception as e:
                last_err = e
                logger.warning(
                    "Gemini client '%s' error on attempt %s/%s: %s",
                    self.name,
                    attempt + 1,
                    self.max_retries + 1,
                    e,
                    exc_info=True,
                )

            if attempt < self.max_retries:
                # Exponential backoff with an upper bound
                backoff = min(2**attempt, self.cool_down_seconds)
                await asyncio.sleep(backoff)

        # Open the circuit and fail fast until cool-down elapses
        self._open_circuit()

        if isinstance(last_err, asyncio.TimeoutError):
            raise AITimeoutError(
                f"Gemini request repeatedly timed out for client '{self.name}'."
            ) from last_err

        raise AIRequestFailed(
            f"Gemini request failed for client '{self.name}': {last_err}"
        ) from last_err


def extract_text_from_response(response: Any) -> str:
    """
    Normalize Gemini responses to a plain text string.

    This handles both the convenient `.text` attribute and the lower-level
    `candidates[0].content.parts[].text` structure.
    """
    # Preferred path
    try:
        text = getattr(response, "text", None)
        if isinstance(text, str) and text.strip():
            return text.strip()
    except Exception:
        pass

    # Fallback to candidates/parts
    try:
        candidates = getattr(response, "candidates", None) or []
        if candidates:
            candidate = candidates[0]
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", None) or []
            texts = [getattr(p, "text", "") for p in parts if getattr(p, "text", "")]
            combined = "".join(texts).strip()
            if combined:
                return combined
    except Exception:
        pass

    return ""


# Centralized Gemini clients for different use cases
_default_model = settings.GEMINI_DEFAULT_MODEL

food_gemini_client = GeminiClient(
    api_key=settings.GEMINI_FOOD_API_KEY or settings.GEMINI_API_KEY,
    model_name=_default_model,
    timeout_seconds=settings.GEMINI_TIMEOUT_SECONDS,
    max_retries=settings.GEMINI_MAX_RETRIES,
    cool_down_seconds=settings.GEMINI_COOL_DOWN_SECONDS,
    name="food",
)

chatbot_gemini_client = GeminiClient(
    api_key=settings.GEMINI_CHATBOT_API_KEY or settings.GEMINI_API_KEY,
    model_name=_default_model,
    timeout_seconds=settings.GEMINI_TIMEOUT_SECONDS,
    max_retries=settings.GEMINI_MAX_RETRIES,
    cool_down_seconds=settings.GEMINI_COOL_DOWN_SECONDS,
    name="wellness",
)

# Vision currently shares the same configuration as the food client
vision_gemini_client = food_gemini_client

