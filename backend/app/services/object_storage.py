"""Pluggable object storage for photo uploads.

Two backends:
    - "local": writes to OBJECT_STORAGE_LOCAL_DIR (dev / tests).
    - "s3":   uses boto3 against OBJECT_STORAGE_S3_BUCKET (prod).

Async-job flow uses this so we don't stuff multi-MB image blobs into Redis or
in-memory queues. Writers return an opaque object key; readers resolve it back
to bytes.
"""

from __future__ import annotations

import logging
import os
import uuid
from typing import Optional

from app.core.config import settings


logger = logging.getLogger(__name__)


class ObjectStorageError(RuntimeError):
    """Raised on storage backend failures (missing key, network, permissions)."""


class _LocalBackend:
    def __init__(self, base_dir: str) -> None:
        self.base_dir = os.path.abspath(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    def _path_for(self, key: str) -> str:
        # Prevent path traversal — key is trusted (we generate it) but be safe.
        safe = key.replace("..", "").lstrip("/")
        return os.path.join(self.base_dir, safe)

    def put(self, data: bytes, suffix: str = ".bin") -> str:
        key = f"{uuid.uuid4().hex}{suffix}"
        path = self._path_for(key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as fh:
            fh.write(data)
        return key

    def get(self, key: str) -> bytes:
        path = self._path_for(key)
        if not os.path.exists(path):
            raise ObjectStorageError(f"Object not found: {key}")
        with open(path, "rb") as fh:
            return fh.read()

    def delete(self, key: str) -> None:
        path = self._path_for(key)
        try:
            os.remove(path)
        except FileNotFoundError:
            pass


class _S3Backend:
    def __init__(self, bucket: str, region: Optional[str], prefix: str) -> None:
        try:
            import boto3  # type: ignore
        except ImportError as exc:
            raise ObjectStorageError(
                "boto3 not installed; install it or switch OBJECT_STORAGE_BACKEND to 'local'."
            ) from exc
        self._client = boto3.client("s3", region_name=region) if region else boto3.client("s3")
        self.bucket = bucket
        self.prefix = prefix.rstrip("/") + "/" if prefix else ""

    def _full_key(self, key: str) -> str:
        return f"{self.prefix}{key}"

    def put(self, data: bytes, suffix: str = ".bin") -> str:
        key = f"{uuid.uuid4().hex}{suffix}"
        try:
            self._client.put_object(Bucket=self.bucket, Key=self._full_key(key), Body=data)
        except Exception as e:
            raise ObjectStorageError(f"S3 put failed: {e}") from e
        return key

    def get(self, key: str) -> bytes:
        try:
            response = self._client.get_object(Bucket=self.bucket, Key=self._full_key(key))
            return response["Body"].read()
        except Exception as e:
            raise ObjectStorageError(f"S3 get failed for {key}: {e}") from e

    def delete(self, key: str) -> None:
        try:
            self._client.delete_object(Bucket=self.bucket, Key=self._full_key(key))
        except Exception as e:
            logger.warning("S3 delete failed for %s: %s", key, e)


def _build_backend():
    backend = (settings.OBJECT_STORAGE_BACKEND or "local").lower()
    if backend == "s3":
        if not settings.OBJECT_STORAGE_S3_BUCKET:
            raise ObjectStorageError(
                "OBJECT_STORAGE_BACKEND=s3 requires OBJECT_STORAGE_S3_BUCKET."
            )
        return _S3Backend(
            bucket=settings.OBJECT_STORAGE_S3_BUCKET,
            region=settings.OBJECT_STORAGE_S3_REGION,
            prefix=settings.OBJECT_STORAGE_S3_PREFIX,
        )
    return _LocalBackend(settings.OBJECT_STORAGE_LOCAL_DIR)


_backend = None


def _get_backend():
    global _backend
    if _backend is None:
        _backend = _build_backend()
    return _backend


def put_image(data: bytes, suffix: str = ".jpg") -> str:
    """Persist image bytes and return an opaque key for retrieval."""
    return _get_backend().put(data, suffix=suffix)


def get_image(key: str) -> bytes:
    """Retrieve image bytes by key. Raises ObjectStorageError if missing."""
    return _get_backend().get(key)


def delete_image(key: str) -> None:
    """Best-effort delete; missing keys are not an error."""
    _get_backend().delete(key)
