from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class ServiceStatus(BaseModel):
    status: str = Field(..., description="'healthy', 'degraded', or 'unhealthy'")
    response_time_ms: Optional[float] = Field(None, description="Response latency in milliseconds")
    details: Optional[str] = Field(None, description="Diagnostic detail or error message")


class HealthResponse(BaseModel):
    status: str = Field(..., description="Overall platform status")
    version: str = Field(..., description="CodeArena backend version")
    environment: str = Field(..., description="Application environment")
    timestamp: datetime = Field(..., description="UTC timestamp of the health check")
    services: Dict[str, ServiceStatus] = Field(
        ..., description="Health status of constituent services"
    )
