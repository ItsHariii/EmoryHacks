import logging
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional
from pythonjsonlogger import jsonlogger

from .config import settings


class StructuredFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter for structured logging."""
    
    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp
        log_record['timestamp'] = datetime.utcnow().isoformat()
        
        # Add service information
        log_record['service'] = 'ovi-backend'
        log_record['environment'] = settings.ENVIRONMENT
        
        # Add level name
        log_record['level'] = record.levelname
        
        # Add logger name
        log_record['logger'] = record.name
        
        # Add request ID if available
        if hasattr(record, 'request_id'):
            log_record['request_id'] = record.request_id
        
        # Add user ID if available
        if hasattr(record, 'user_id'):
            log_record['user_id'] = record.user_id


def setup_logging() -> logging.Logger:
    """Set up structured logging configuration."""
    
    # Create logger
    logger = logging.getLogger("ovi")
    logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    
    # Use JSON formatter for production, simple format for development
    if settings.ENVIRONMENT == "production":
        formatter = StructuredFormatter(
            '%(timestamp)s %(level)s %(logger)s %(message)s'
        )
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Don't propagate to root logger
    logger.propagate = False
    
    return logger


# Initialize logger
logger = setup_logging()


class LoggerAdapter(logging.LoggerAdapter):
    """Logger adapter for adding contextual information."""
    
    def __init__(self, logger: logging.Logger, extra: Optional[Dict[str, Any]] = None):
        super().__init__(logger, extra or {})
    
    def process(self, msg: str, kwargs: Dict[str, Any]) -> tuple:
        """Process log message and add extra context."""
        if 'extra' not in kwargs:
            kwargs['extra'] = {}
        
        # Add adapter's extra data
        kwargs['extra'].update(self.extra)
        
        return msg, kwargs


def get_logger(name: str, **extra) -> LoggerAdapter:
    """Get a logger with optional extra context."""
    base_logger = logging.getLogger(f"ovi.{name}")
    return LoggerAdapter(base_logger, extra)