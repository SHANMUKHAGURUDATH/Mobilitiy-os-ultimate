"""
AI microservice for the Mobility OS platform.

This is a DEMO / rule-based scoring engine, not a trained ML model.
Each endpoint is written so a real model (XGBoost / Random Forest / LSTM /
CNN / anomaly detection) can be dropped in behind the same request/response
contract without touching the Node.js backend or frontend.

Run:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional
import re
import io
import logging

logger = logging.getLogger("mobility-os-ai")

app = FastAPI(
    title="Mobility OS AI Service",
    description="Modular AI scoring endpoints — DEMO rule-based logic, not validated ML models.",
    version="0.1.0",
)


# ---------------------------------------------------------------------------
# Accident-risk scoring
# ---------------------------------------------------------------------------
class RiskFactors(BaseModel):
    traffic_density: float = Field(ge=0, le=100, description="0-100 simulated traffic density")
    accident_history: float = Field(ge=0, le=100, description="0-100 simulated historical incident frequency")
    weather_severity: float = Field(ge=0, le=100, description="0-100 simulated weather severity")
    road_condition: float = Field(ge=0, le=100, description="0-100 simulated road condition (100 = worst)")


class RiskResponse(BaseModel):
    score: int
    level: str
    factors: list[dict]
    model: str = "demo-rule-based-v1"


def level_from_score(score: int) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 35:
        return "MEDIUM"
    return "LOW"


@app.post("/v1/risk-score", response_model=RiskResponse)
def risk_score(factors: RiskFactors):
    """
    Weighted rule-based risk score. Replace the body of this function with a
    call to a trained model (e.g. XGBoost.predict) while keeping the same
    request/response schema so the Node backend needs no changes.
    """
    score = round(
        factors.traffic_density * 0.30
        + factors.accident_history * 0.30
        + factors.weather_severity * 0.20
        + factors.road_condition * 0.20
    )
    return RiskResponse(
        score=score,
        level=level_from_score(score),
        factors=[
            {"label": "Traffic density", "weightPct": 30},
            {"label": "Accident history", "weightPct": 30},
            {"label": "Weather", "weightPct": 20},
            {"label": "Road condition", "weightPct": 20},
        ],
    )


# ---------------------------------------------------------------------------
# Road-hazard image classification (mock)
# ---------------------------------------------------------------------------
class ClassifyRequest(BaseModel):
    image_uri: Optional[str] = Field(default=None, description="Pointer to uploaded image, not the raw bytes")
    description: Optional[str] = Field(default=None, description="Optional citizen-supplied description")


class ClassifyResponse(BaseModel):
    predicted_type: str
    confidence: float
    severity: str
    model: str = "demo-mock-classifier"


@app.post("/v1/classify-road-hazard", response_model=ClassifyResponse)
def classify_road_hazard(req: ClassifyRequest):
    """
    DEMO classifier — returns a plausible label without running real computer
    vision. Swap in a CNN/vision-transformer behind this same endpoint.
    """
    text = (req.description or "").lower()
    if "flood" in text or "water" in text:
        predicted, severity = "FLOODING", "HIGH"
    elif "pothole" in text or "hole" in text:
        predicted, severity = "POTHOLE", "MEDIUM"
    elif "tree" in text:
        predicted, severity = "FALLEN_TREE", "MEDIUM"
    elif "signal" in text or "light" in text:
        predicted, severity = "SIGNAL_FAULT", "LOW"
    else:
        predicted, severity = "OTHER", "LOW"
    return ClassifyResponse(predicted_type=predicted, confidence=0.62, severity=severity)


# ---------------------------------------------------------------------------
# Predictive maintenance (mock)
# ---------------------------------------------------------------------------
class MaintenanceInput(BaseModel):
    mileage_km: float
    months_since_last_service: float
    battery_health_pct: Optional[float] = None


class MaintenanceResponse(BaseModel):
    maintenance_score: int
    recommendation: str
    model: str = "demo-rule-based-v1"


@app.post("/v1/maintenance-score", response_model=MaintenanceResponse)
def maintenance_score(inp: MaintenanceInput):
    score = 100
    score -= min(40, inp.mileage_km / 2000)
    score -= min(30, inp.months_since_last_service * 4)
    if inp.battery_health_pct is not None:
        score -= max(0, (100 - inp.battery_health_pct) * 0.3)
    score = max(0, round(score))
    recommendation = (
        "Schedule an inspection soon" if score < 60 else "No immediate action needed"
    )
    return MaintenanceResponse(maintenance_score=score, recommendation=recommendation)


@app.get("/v1/health")
def health():
    return {"status": "ok", "service": "mobility-os-ai-service", "note": "DEMO / rule-based endpoints"}


# ---------------------------------------------------------------------------
# License plate OCR — REAL implementation (section 20 of the spec).
#
# This actually runs Tesseract OCR over the image; it is not a mock. It is
# genuinely limited compared to a purpose-trained ANPR model (no plate
# localization/cropping step, so accuracy on cluttered photos will be much
# lower than a real production ANPR pipeline) — that's a real, disclosed
# limitation, not a fake result. If OCR can't find something plate-shaped,
# it truthfully returns plate_number=None rather than inventing one.
# ---------------------------------------------------------------------------
class PlateOcrRequest(BaseModel):
    file_url: str = Field(description="URL the AI service can fetch the evidence image from")


class PlateOcrResponse(BaseModel):
    plate_number: Optional[str] = None
    confidence: float
    raw_text: str
    model: str = "tesseract-ocr"
    note: Optional[str] = None


# Indian registration plate pattern, tolerant of OCR noise: e.g. AP05CD1234 / AP 05 CD 1234
PLATE_PATTERN = re.compile(r"[A-Z]{2}\s?-?\s?\d{1,2}\s?-?\s?[A-Z]{1,3}\s?-?\s?\d{1,4}")


def _extract_plate(raw_text: str):
    cleaned = raw_text.upper()
    match = PLATE_PATTERN.search(cleaned)
    if not match:
        return None
    candidate = re.sub(r"[\s-]", "", match.group(0))
    return candidate


@app.post("/ai/plate-ocr", response_model=PlateOcrResponse)
def plate_ocr(req: PlateOcrRequest):
    try:
        import pytesseract
        import cv2
        import numpy as np
        import requests
    except ImportError as exc:
        return PlateOcrResponse(
            plate_number=None, confidence=0.0, raw_text="",
            note=f"AI model not configured: missing dependency ({exc}). Run `pip install -r requirements.txt` and install the tesseract-ocr system package.",
        )

    try:
        resp = requests.get(req.file_url, timeout=10)
        resp.raise_for_status()
        image_bytes = np.frombuffer(resp.content, dtype=np.uint8)
        img = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image from file_url")
    except Exception as exc:
        logger.warning("plate_ocr: failed to fetch/decode image: %s", exc)
        return PlateOcrResponse(plate_number=None, confidence=0.0, raw_text="", note=f"Could not fetch/decode image: {exc}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 11, 17, 17)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    raw_text = pytesseract.image_to_string(thresh, config="--psm 7")
    plate = _extract_plate(raw_text)

    if not plate:
        return PlateOcrResponse(
            plate_number=None, confidence=0.0, raw_text=raw_text.strip(),
            note="Plate not confidently recognized.",
        )

    # Confidence heuristic from Tesseract's own per-word confidence, not invented.
    data = pytesseract.image_to_data(thresh, config="--psm 7", output_type=pytesseract.Output.DICT)
    confs = [int(c) for c in data.get("conf", []) if c not in ("-1", -1)]
    confidence = round((sum(confs) / len(confs)) / 100, 2) if confs else 0.4

    return PlateOcrResponse(plate_number=plate, confidence=confidence, raw_text=raw_text.strip())


# ---------------------------------------------------------------------------
# Vehicle detection — HONEST stub (section 19). No YOLO weights are bundled
# with this service (they're a multi-hundred-MB download this environment
# has no verified way to fetch/validate). Rather than fake bounding boxes,
# this endpoint reports its real, unconfigured state per section 82 of the
# spec ("AI unavailable" must be shown, never silently faked).
#
# To make this real: `pip install ultralytics`, download yolov8n.pt (or a
# vehicle-specific fine-tune), and replace the body below with an actual
# model.predict() call returning real boxes/classes/confidences.
# ---------------------------------------------------------------------------
class VehicleDetectionResponse(BaseModel):
    configured: bool = False
    detections: list = []
    note: str = "AI model not configured. See ai-service/main.py for how to wire in a real YOLO model."


@app.post("/ai/vehicle-detection", response_model=VehicleDetectionResponse)
def vehicle_detection():
    return VehicleDetectionResponse()


@app.get("/health")
def health_alias():
    """Alias of /v1/health — the Node backend's /api/system/health checks this path."""
    return health()
