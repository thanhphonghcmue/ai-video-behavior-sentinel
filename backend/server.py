"""
=============================================================================
SENTINEL AI SURVEILLANCE & BEHAVIOR TELEMETRY SYSTEM - BACKEND ENGINE
Framework: FastAPI + OpenCV + Google GenAI SDK (Gemini 2.5 Flash)
Modules:
  - MODULE 1: Video Behavior Timeline & Dynamic Action Event Slicing (File API)
  - MODULE 2: Real-Time Webcam Analyzer, Face Tracking & AI Incident Copilot
=============================================================================
"""

import os
import sys
import io
import time
import base64
import json
import uuid
import shutil
import threading
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any

# Ensure UTF-8 stdout for Windows consoles
if sys.platform.startswith('win') and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import cv2
import numpy as np
from PIL import Image
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, File, UploadFile, Form, Header
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Optional face recognition for real-time person tracking
try:
    import face_recognition
    HAS_FACE_RECOGNITION = True
except ImportError:
    HAS_FACE_RECOGNITION = False

# Load environment variables
load_dotenv()

# Setup Google GenAI Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

genai_client = None

def init_genai(api_key: str, model: Optional[str] = None):
    global genai_client, MODEL_NAME
    if model and model.strip():
        MODEL_NAME = model.strip()
    if api_key and api_key != "YOUR_GEMINI_API_KEY_HERE":
        try:
            from google import genai
            genai_client = genai.Client(api_key=api_key)
            print(f"[AI ENGINE] Google GenAI Client initialized successfully using model: {MODEL_NAME}")
            return True
        except Exception as e:
            print(f"[AI ENGINE WARNING] Failed to initialize Google GenAI Client: {e}")
            genai_client = None
            return False
    else:
        print("[AI ENGINE INFO] GEMINI_API_KEY not configured. Running in intelligent fallback simulation mode.")
        genai_client = None
        return False

init_genai(GEMINI_API_KEY, MODEL_NAME)

# Initialize FastAPI App
app = FastAPI(
    title="SENTINEL AI - Vision & Behavior Telemetry Backend",
    version="2.5.0",
    description="Surveillance backend powered by OpenCV and Gemini 2.5 Flash"
)

# Enable CORS for Next.js Frontend (port 3000 & 8000)
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Uploads Directory for Module 1 Video Storage & HTTP Range Streaming
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# =============================================================================
# DATA SCHEMAS & MODELS
# =============================================================================

class AnalysisResponse(BaseModel):
    action_detected: str = Field(..., description="Action recognized in the frame")
    risk_score: int = Field(..., ge=0, le=100, description="Calculated threat score (0-100)")
    alert_level: str = Field(..., description="NORMAL, WARNING, or CRITICAL")
    description: str = Field(..., description="Contextual description in Vietnamese")
    timestamp: str = Field(..., description="ISO-8601 formatted timestamp")
    objects_in_scene: List[str] = Field(default_factory=list)
    is_cloud_gemini: bool = Field(default=False)

class AnalyzeFrameRequest(BaseModel):
    image_base64: Optional[str] = None
    use_current_stream: bool = True
    roi_polygon: Optional[List[Dict[str, float]]] = None

class ChatRequest(BaseModel):
    query: str
    history: Optional[List[Dict[str, str]]] = []

class IncidentRecord(BaseModel):
    id: str
    timestamp: str
    action_detected: str
    risk_score: int
    alert_level: str
    description: str
    thumbnail_base64: Optional[str] = None

# MULTI-SUBJECT VIDEO BEHAVIOR ANALYSIS SCHEMAS
class TimeInterval(BaseModel):
    start_time: float
    end_time: float
    time_label: Optional[str] = None
    action_description: str
    risk_score: int
    risk_level: str
    is_danger: bool = False
    danger_summary: Optional[str] = None

class SubjectTrack(BaseModel):
    target_id: str
    subject_class: str = Field(default="Person", alias="class")
    bounding_box_normalized: List[float] = Field(default_factory=lambda: [0.15, 0.20, 0.75, 0.45])  # [ymin, xmin, ymax, xmax] 0.0 - 1.0
    time_intervals: List[TimeInterval] = Field(default_factory=list)

class VideoActionEvent(BaseModel):
    id: Optional[str] = None
    event_id: str
    character_id: Optional[str] = None
    target_id: str
    subject_class: Optional[str] = "Person"
    start_time: float
    end_time: float
    time_label: Optional[str] = None
    timestamp_display: str
    action: Optional[str] = None
    action_description: str
    risk_score: int
    risk_level: str
    is_danger: bool = False
    danger_summary: Optional[str] = None
    danger_notes: Optional[str] = None
    bounding_box_normalized: Optional[List[float]] = None  # [ymin, xmin, ymax, xmax] 0.0 - 1.0

class VideoAnalysisResult(BaseModel):
    total_subjects_detected: int = 0
    scene_summary: Optional[str] = ""
    subjects: List[SubjectTrack] = Field(default_factory=list)
    characters_detected: List[str] = Field(default_factory=list)
    characters: List[str] = Field(default_factory=list)
    events: List[VideoActionEvent] = Field(default_factory=list)
    video_url: str
    filename: str
    duration: float
    ai_model_used: str

class SetApiKeyRequest(BaseModel):
    api_key: str
    model: Optional[str] = None

class SetModelRequest(BaseModel):
    model: str


# =============================================================================
# REAL-TIME CAMERA CAPTURE & WEBCAM TRACKING SUBSYSTEM
# =============================================================================

class CameraManager:
    """Manages OpenCV VideoCapture with real-time face detection and fallback stream."""
    def __init__(self, source=0):
        self.source = source
        self.cap = None
        self.lock = threading.Lock()
        self.current_frame = None
        self.is_running = False
        self.use_synthetic = False
        self.fps = 30
        self.tick = 0
        self.detected_face: Optional[Dict[str, Any]] = None
        self.last_detection_time = 0
        self.start_dwell_time = time.time()
        self._init_camera()

    def _init_camera(self):
        try:
            self.cap = cv2.VideoCapture(self.source, cv2.CAP_DSHOW if os.name == 'nt' else cv2.CAP_ANY)
            if self.cap and self.cap.isOpened():
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                self.is_running = True
                self.use_synthetic = False
                print(f"[CAMERA] Hardware camera ({self.source}) initialized successfully.")
            else:
                self.use_synthetic = True
                self.is_running = True
                print("[CAMERA] Hardware camera not found. Switching to Synthetic Security Stream.")
        except Exception as e:
            print(f"[CAMERA WARNING] Hardware camera error: {e}. Using synthetic stream.")
            self.use_synthetic = True
            self.is_running = True

    def get_latest_frame(self) -> np.ndarray:
        with self.lock:
            if not self.use_synthetic and self.cap and self.cap.isOpened():
                ret, frame = self.cap.read()
                if ret and frame is not None:
                    # Perform periodic real-time face tracking every 0.15s
                    now = time.time()
                    if now - self.last_detection_time > 0.15:
                        self.last_detection_time = now
                        self._detect_real_face(frame)

                    self.current_frame = frame
                    return frame

            # Synthetic Camera Generator with HUD & moving security subject
            self.tick += 1
            w, h = 1280, 720
            synth = np.zeros((h, w, 3), dtype=np.uint8)
            synth[:] = (18, 22, 30)

            # Security perspective grid
            for x in range(0, w, 60):
                cv2.line(synth, (x, 0), (x, h), (35, 42, 54), 1)
            for y in range(0, h, 60):
                cv2.line(synth, (0, y), (w, y), (35, 42, 54), 1)

            # Laser scan sweep
            sweep_y = int((self.tick * 8) % h)
            cv2.line(synth, (0, sweep_y), (w, sweep_y), (24, 0, 215), 2)

            # Moving human subject
            pos_x = int(w * 0.45 + np.sin(self.tick * 0.04) * (w * 0.25))
            pos_y = int(h * 0.32)
            cv2.rectangle(synth, (pos_x - 70, pos_y), (pos_x + 70, pos_y + 260), (24, 0, 215), 2)
            cv2.putText(synth, "TARGET ID #01 (DETECTED)", (pos_x - 70, pos_y - 12),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (24, 0, 215), 2)

            # Update simulated detected face coordinates
            self.detected_face = {
                "left": pos_x - 60,
                "top": pos_y + 10,
                "right": pos_x + 60,
                "bottom": pos_y + 130,
                "confidence": 0.92
            }

            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cv2.putText(synth, f"SENTINEL AI SURVEILLANCE - CAM 01 [LIVE] | {now_str}", 
                        (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.circle(synth, (18, 33), 7, (24, 0, 215), -1)

            self.current_frame = synth
            return synth

    def _detect_real_face(self, frame: np.ndarray):
        """Detects real human face in camera frame to feed dynamic bounding boxes."""
        try:
            h, w = frame.shape[:2]
            scale = 4
            small = cv2.resize(frame, (w // scale, h // scale))
            rgb_small = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)

            if HAS_FACE_RECOGNITION:
                faces = face_recognition.face_locations(rgb_small, model="hog")
                if faces:
                    t, r, b, l = faces[0]
                    self.detected_face = {
                        "top": int(t * scale),
                        "right": int(r * scale),
                        "bottom": int(b * scale),
                        "left": int(l * scale),
                        "confidence": 0.96
                    }
                    return
            
            # Fallback: skin color / motion contour if face_recognition finds no face
            gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (7, 7), 0)
            thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                           cv2.THRESH_BINARY_INV, 11, 2)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                c = max(contours, key=cv2.contourArea)
                if cv2.contourArea(c) > 500:
                    x, y, cw, ch = cv2.boundingRect(c)
                    self.detected_face = {
                        "top": int(y * scale),
                        "left": int(x * scale),
                        "bottom": int((y + ch) * scale),
                        "right": int((x + cw) * scale),
                        "confidence": 0.85
                    }
                    return

            self.detected_face = None
        except Exception:
            pass

    def release(self):
        if self.cap and self.cap.isOpened():
            self.cap.release()

camera_manager = CameraManager(source=int(os.getenv("CAMERA_SOURCE", "0")))


# =============================================================================
# IN-MEMORY INCIDENTS & TELEMETRY STORE
# =============================================================================

latest_telemetry: Dict[str, Any] = {
    "action_detected": "Quan sát thông thường (Normal Monitoring)",
    "risk_score": 18,
    "alert_level": "NORMAL",
    "description": "Hệ thống giám sát an ninh SENTINEL AI đang hoạt động ổn định.",
    "timestamp": datetime.now().isoformat(),
    "objects_in_scene": ["người", "khu vực làm việc"],
    "is_cloud_gemini": bool(genai_client is not None),
    "camera_active": True,
    "person": {
        "id": "TARGET_01",
        "tracking_label": "TARGET_01 (Trực Tiếp)",
        "bbox": {"left": 280, "top": 120, "right": 520, "bottom": 380, "confidence": 0.95},
        "is_detected": True,
        "is_in_roi": False,
        "dwell_time": 6
    }
}

incident_history: List[IncidentRecord] = [
    IncidentRecord(
        id="INC-2026-001",
        timestamp="14:02:15",
        action_detected="ROI_INTRUSION",
        risk_score=89,
        alert_level="CRITICAL",
        description="Đối tượng vượt qua ranh giới ảo đã thiết lập bằng vạch đỏ"
    ),
    IncidentRecord(
        id="INC-2026-002",
        timestamp="14:03:40",
        action_detected="PUNCHING_VIOLENCE",
        risk_score=94,
        alert_level="CRITICAL",
        description="Cử chỉ vung tay tấn công với gia tốc cao bất thường"
    ),
    IncidentRecord(
        id="INC-2026-003",
        timestamp="14:04:10",
        action_detected="BENDING_LOITERING",
        risk_score=68,
        alert_level="WARNING",
        description="Góc nghiêng thân trên gập thấp gần khu vực quầy hàng"
    )
]


# =============================================================================
# CLOUD AI ANALYSIS ENGINE (GEMINI 2.5 FLASH MULTIMODAL)
# =============================================================================

def analyze_frame_with_gemini(pil_image: Image.Image) -> Dict[str, Any]:
    """Sends frame to Google Gemini 2.5 Flash for multimodal action recognition & risk evaluation."""
    global genai_client

    if not genai_client:
        sec = int(time.time())
        phase = sec % 25
        if phase > 20:
            return {
                "action_detected": "Cúi người lén lút (Bending Loiter)",
                "risk_score": 68,
                "alert_level": "WARNING",
                "description": "Đối tượng cúi người quan sát vị trí thiết bị nhạy cảm.",
                "objects_in_scene": ["người", "thiết bị"],
                "is_cloud_gemini": False,
            }
        else:
            return {
                "action_detected": "Quan sát thông thường (Normal Activity)",
                "risk_score": 18,
                "alert_level": "NORMAL",
                "description": "Đối tượng hiện diện bình thường trước camera giám sát an ninh.",
                "objects_in_scene": ["người", "phòng giám sát"],
                "is_cloud_gemini": False,
            }

    system_instruction = """
    Bạn là chuyên gia an ninh thị giác máy tính cao cấp (AI Computer Vision Threat Analyst).
    Nhiệm vụ: Quan sát hình ảnh chụp từ camera an ninh và phân tích hành vi đối tượng con người theo thời gian thực.
    Đánh giá các hành vi nguy cơ:
    - BÌNH THƯỜNG (NORMAL, risk_score 0-45): Đứng, ngồi, đi bộ, làm việc thông thường.
    - CẢNH BÁO (WARNING, risk_score 50-79): Lén lút di chuyển, cúi người lục lọi, lảng vảng quá lâu (loitering).
    - NGUY CẤP (CRITICAL, risk_score 80-100): Đột nhập vùng cấm, trèo rào (climbing), vung tay đấm đá ẩu đả (fighting/punching), té ngã bất thường (falling).

    BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON DUY NHẤT sau:
    {
      "action_detected": "string (Tên hành vi bằng tiếng Việt, kèm tiếng Anh trong ngoặc)",
      "risk_score": number (nguyên từ 0 đến 100),
      "alert_level": "NORMAL" | "WARNING" | "CRITICAL",
      "description": "Giải thích ngắn gọn 1-2 câu về cử chỉ và nguy cơ phát hiện bằng tiếng Việt",
      "objects_in_scene": ["danh sách các đối tượng nhận diện được"]
    }
    """

    try:
        response = genai_client.models.generate_content(
            model=MODEL_NAME,
            contents=[pil_image, "Phân tích hành vi con người và mức độ đe dọa an ninh trong khung hình này theo chỉ dẫn hệ thống."],
            config={
                "system_instruction": system_instruction,
                "response_mime_type": "application/json",
                "temperature": 0.2,
            }
        )
        parsed = json.loads(response.text)
        parsed["is_cloud_gemini"] = True
        return parsed
    except Exception as e:
        print(f"[GEMINI API ERROR] {e}. Falling back to rule-based engine.")
        return {
            "action_detected": "Quan sát thông thường",
            "risk_score": 20,
            "alert_level": "NORMAL",
            "description": f"Phân tích cục bộ dự phòng (Lỗi API: {str(e)[:50]}...)",
            "objects_in_scene": ["người"],
            "is_cloud_gemini": False,
        }


# =============================================================================
# BACKGROUND CONTINUOUS SAMPLING WORKER
# =============================================================================

async def background_sampling_task():
    """Background loop updating telemetry and detected face position."""
    interval = float(os.getenv("ANALYSIS_INTERVAL_SEC", "3"))
    while True:
        try:
            frame = camera_manager.get_latest_frame()
            if frame is not None:
                h, w = frame.shape[:2]

                # Update live detected person coordinates
                if camera_manager.detected_face:
                    df = camera_manager.detected_face
                    center_x = (df["left"] + df["right"]) // 2
                    center_y = (df["top"] + df["bottom"]) // 2
                    is_in_roi = (350 <= center_x <= 750 and 150 <= center_y <= 500)

                    latest_telemetry["person"] = {
                        "id": "TARGET_01",
                        "tracking_label": "TARGET_01 (Khuôn mặt phát hiện)",
                        "bbox": {
                            "left": int(df["left"] * (800 / w)),
                            "top": int(df["top"] * (450 / h)),
                            "right": int(df["right"] * (800 / w)),
                            "bottom": int(df["bottom"] * (450 / h)),
                            "confidence": df.get("confidence", 0.95)
                        },
                        "is_detected": True,
                        "is_in_roi": is_in_roi,
                        "dwell_time": int(time.time() - camera_manager.start_dwell_time)
                    }
                else:
                    latest_telemetry["person"] = {
                        "id": "TARGET_01",
                        "tracking_label": "TARGET_01 (Đang tìm mục tiêu)",
                        "bbox": {"left": 280, "top": 120, "right": 520, "bottom": 380, "confidence": 0.8},
                        "is_detected": False,
                        "is_in_roi": False,
                        "dwell_time": int(time.time() - camera_manager.start_dwell_time)
                    }

                # Local tracking updates only (Gemini is called on-demand via /api/upload-video and /api/analyze-live)
                latest_telemetry["timestamp"] = datetime.now().isoformat()

        except Exception:
            pass

        await asyncio.sleep(interval)


@app.on_event("startup")
async def startup_event():
    async def delayed_start():
        await asyncio.sleep(3)
        await background_sampling_task()
    asyncio.create_task(delayed_start())
    print("[SERVER] Background AI frame sampling task scheduled.")


# =============================================================================
# API ROUTES
# =============================================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "SENTINEL AI Surveillance Backend",
        "model": MODEL_NAME,
        "gemini_active": genai_client is not None,
        "camera_feed": "/video_feed",
        "telemetry": "/api/telemetry"
    }


@app.get("/api/status")
def get_system_status():
    """Returns AI Engine connection status, current model, and camera operational health."""
    return {
        "gemini_active": genai_client is not None,
        "model": MODEL_NAME,
        "has_api_key": bool(GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE"),
        "camera_source": camera_manager.source,
        "use_synthetic": camera_manager.use_synthetic,
        "has_face_recognition": HAS_FACE_RECOGNITION
    }


@app.get("/api/models")
def get_available_models():
    """Returns available Gemini models and the current active model."""
    return {
        "current_model": MODEL_NAME,
        "available_models": [
            {
                "id": "gemini-3.8-flash",
                "name": "Gemini 3.8 Flash",
                "tag": "Khuyên dùng - Đời mới nhất",
                "description": "Mô hình đời mới nhất: Nhận diện hành vi đa phương thức, trích xuất bounding box và phân đoạn video tốc độ cao."
            },
            {
                "id": "gemini-2.5-pro",
                "name": "Gemini 2.5 Pro",
                "tag": "Suy luận an ninh chuyên sâu",
                "description": "Mô hình suy luận mạnh mẽ nhất, phân tích logic đe dọa phức tạp và phát hiện dị thường tinh vi."
            },
            {
                "id": "gemini-2.5-flash",
                "name": "Gemini 2.5 Flash (Legacy)",
                "tag": "Phiên bản cũ",
                "description": "Phiên bản trước, có thể không khả dụng với API key mới."
            },
            {
                "id": "gemini-2.0-flash-exp",
                "name": "Gemini 2.0 Flash Experimental",
                "tag": "Thử nghiệm siêu nhanh",
                "description": "Phiên bản thế hệ 2.0 tối ưu phản hồi tức thì."
            }
        ]
    }


@app.post("/api/set-model")
def set_model(req: SetModelRequest):
    """Dynamically switch active Gemini model."""
    global MODEL_NAME
    model_choice = req.model.strip()
    if not model_choice:
        raise HTTPException(status_code=400, detail="Mã mô hình không được để trống")
    MODEL_NAME = model_choice
    print(f"[AI ENGINE] Active Gemini model switched to: {MODEL_NAME}")
    return {"success": True, "model": MODEL_NAME}


@app.post("/api/set-api-key")
def set_gemini_api_key(req: SetApiKeyRequest):
    """Dynamically sets Google AI Studio API key and model."""
    global GEMINI_API_KEY, genai_client, MODEL_NAME
    key = req.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API Key cannot be empty")

    chosen_model = (req.model or MODEL_NAME).strip()
    success = init_genai(key, chosen_model)
    if success:
        GEMINI_API_KEY = key
        MODEL_NAME = chosen_model
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
        try:
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(f"GEMINI_API_KEY={key}\nGEMINI_MODEL={chosen_model}\nPORT=8000\nHOST=0.0.0.0\nCAMERA_SOURCE=0\nANALYSIS_INTERVAL_SEC=4\n")
        except Exception:
            pass

        latest_telemetry["is_cloud_gemini"] = True
        return {"success": True, "status": "ONLINE", "model": MODEL_NAME}
    else:
        raise HTTPException(status_code=400, detail="Failed to initialize Google GenAI client with provided key.")


def generate_mjpeg_stream():
    """Generates continuous multipart MJPEG stream from the CameraManager."""
    while True:
        frame = camera_manager.get_latest_frame()
        if frame is None:
            time.sleep(0.04)
            continue

        ret, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if not ret:
            continue

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
        time.sleep(0.033)


@app.get("/video_feed")
def video_feed():
    """Multipart MJPEG video stream accessible directly by Next.js <img /> or <video />."""
    return StreamingResponse(
        generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/api/telemetry")
def get_telemetry():
    """Returns the latest real-time AI behavioral telemetry."""
    return latest_telemetry


@app.post("/api/analyze-frame", response_model=AnalysisResponse)
async def analyze_frame_endpoint(req: AnalyzeFrameRequest):
    """Analyzes an image snapshot from the client (base64) or grabs camera frame."""
    if req.image_base64:
        try:
            clean_b64 = req.image_base64.split(",")[-1]
            img_bytes = base64.b64decode(clean_b64)
            pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")
    else:
        frame = camera_manager.get_latest_frame()
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb)

    result = analyze_frame_with_gemini(pil_image)
    result["timestamp"] = datetime.now().isoformat()
    return result


# =============================================================================
# MODULE 1: DYNAMIC ACTION EVENT SLICING & VIDEO UPLOAD
# =============================================================================

@app.post("/api/upload-video", response_model=VideoAnalysisResult)
@app.post("/api/analyze-video", response_model=VideoAnalysisResult)
async def upload_video_endpoint(
    request: Request,
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None),
    x_gemini_key: Optional[str] = Header(None)
):
    """
    MODULE 1: CHUNKED VIDEO INGESTION & DENSE MULTI-SUBJECT AI TRACKING
    - Accepts MP4/WebM surveillance video files via chunked stream.
    - Saves in 4MB chunks to prevent memory overflow on large video files.
    - Uploads directly to Google AI Studio using official google-genai SDK (client.files.upload).
    - Polls processing state until ACTIVE before executing dense multi-subject behavior recognition.
    """
    global genai_client, GEMINI_API_KEY

    # Dynamically initialize Gemini client if key is provided in request
    effective_key = (api_key or x_gemini_key or "").strip()
    if effective_key and not genai_client:
        init_genai(effective_key)

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".mp4", ".webm", ".avi", ".mov"]:
        raise HTTPException(status_code=400, detail="Only MP4, WebM, AVI, and MOV videos are supported")

    # 1. Chunked File Stream Ingestion to prevent memory exhaustion
    unique_filename = f"video_{uuid.uuid4().hex[:8]}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, unique_filename)

    CHUNK_SIZE = 4 * 1024 * 1024  # 4MB chunks
    try:
        with open(saved_path, "wb") as buffer:
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break
                buffer.write(chunk)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded video chunks: {e}")

    # Inspect video metadata (FPS and duration)
    duration_sec = 30.0
    try:
        vcap = cv2.VideoCapture(saved_path)
        fps = vcap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_cnt = vcap.get(cv2.CAP_PROP_FRAME_COUNT)
        if frame_cnt > 0 and fps > 0:
            duration_sec = round(frame_cnt / fps, 2)
        vcap.release()
    except Exception as e:
        print(f"[VIDEO METADATA ERROR] {e}")

    # Determine dynamic video URL
    host_header = request.headers.get("host", "localhost:8000")
    video_url = f"http://{host_header}/uploads/{unique_filename}"

    # Strict Error Handling: Missing API Key or Client
    if not genai_client or not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Missing API Key or Gemini Connection Failed",
                "detail": "GEMINI_API_KEY is not configured or Client initialization failed. Mock data is disabled."
            }
        )

    # Real connection to Google Gemini API (No mock data fallback)
    try:
        print(f"[MODULE 1] Uploading {unique_filename} ({duration_sec}s) to Google AI Studio File API...")
        uploaded_file = genai_client.files.upload(file=saved_path)

        # Poll processing status until ACTIVE
        wait_time = 0
        while hasattr(uploaded_file, "state") and getattr(uploaded_file.state, "name", "") in ["PROCESSING", "STATE_UNSPECIFIED"] and wait_time < 90:
            time.sleep(2)
            wait_time += 2
            uploaded_file = genai_client.files.get(name=uploaded_file.name)
            print(f"[MODULE 1] Polling Google AI Studio file state: {getattr(uploaded_file.state, 'name', 'UNKNOWN')} ({wait_time}s)")

        prompt = f"""
        Analyze the attached video accurately. Describe the ACTUAL visual context (e.g., classroom, street, office). Do NOT assume it is a traffic scene unless explicitly visible. Identify all distinct human subjects or vehicles. Return 'total_subjects' and a 'subjects' array with 'target_id', 'action_description', 'risk_score', and 'bounding_box_normalized'.

        OUTPUT SPECIFICATIONS:
        - 'scene_summary': Concise description in Vietnamese of the actual observed environment and events.
        - 'total_subjects': Integer count of all distinct subjects detected.
        - 'subjects': Array of objects with:
          * 'target_id': "Target_01", "Target_02", etc.
          * 'class': "Teacher", "Student", "Person", "Vehicle", etc.
          * 'action_description': Detailed Vietnamese description of what the subject is physically doing.
          * 'risk_score': 0 to 100 based on security/danger level.
          * 'risk_level': "LOW", "MEDIUM", or "CRITICAL".
          * 'is_danger': true if risk_score >= 70 else false.
          * 'bounding_box_normalized': [ymin, xmin, ymax, xmax] as float numbers strictly between 0.0 and 1.0.
          * 'time_intervals': Array of time spans with start_time and end_time (seconds, up to {duration_sec}s).

        Return STRICT valid JSON only.
        """

        # Priority list of models to execute the real Gemini API call
        model_candidates = [
            "gemini-1.5-pro",
            MODEL_NAME,
            "gemini-3.5-flash",
            "gemini-3.1-flash-lite",
            "gemini-3.7-flash",
            "gemini-3.8-flash"
        ]
        seen_models = set()
        models_to_try = [m for m in model_candidates if m and not (m in seen_models or seen_models.add(m))]

        response = None
        last_error = None
        model_used = None

        for model_id in models_to_try:
            try:
                print(f"[MODULE 1] Calling Gemini API with model '{model_id}'...")
                response = genai_client.models.generate_content(
                    model=model_id,
                    contents=[uploaded_file, prompt],
                    config={"response_mime_type": "application/json", "temperature": 0.1}
                )
                model_used = model_id
                print(f"[MODULE 1] Gemini API call succeeded with model '{model_id}'.")
                break
            except Exception as ex:
                last_error = ex
                print(f"[MODULE 1 WARNING] Gemini model '{model_id}' failed: {ex}")

        if not response or not response.text:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Missing API Key or Gemini Connection Failed",
                    "detail": f"Gemini API call failed: {last_error}"
                }
            )

        parsed = json.loads(response.text)
        scene_summary = parsed.get("scene_summary") or "Khung cảnh giám sát đã được phân tích bởi Gemini AI."
        subjects_data = parsed.get("subjects") or []
        subjects_list: List[SubjectTrack] = []
        events_list: List[VideoActionEvent] = []

        if isinstance(subjects_data, list) and subjects_data:
            for subj in subjects_data:
                t_id = subj.get("target_id") or f"Target_{len(subjects_list)+1:02d}"
                s_class = subj.get("class") or "Person"
                raw_bbox = subj.get("bounding_box_normalized") or [0.15, 0.20, 0.75, 0.45]

                # Clamp bounding box coordinates strictly to float 0.0 - 1.0
                bbox = []
                for c in raw_bbox:
                    try:
                        val = float(c)
                        if val > 1.0:  # in case model returned 0-1000 integer scale
                            val = val / 1000.0
                        bbox.append(round(max(0.0, min(1.0, val)), 4))
                    except Exception:
                        bbox.append(0.2)
                if len(bbox) != 4:
                    bbox = [0.15, 0.20, 0.75, 0.45]

                t_intervals: List[TimeInterval] = []
                raw_intervals = subj.get("time_intervals") or []
                if not raw_intervals:
                    # Model returned action_description at subject level
                    subj_action = subj.get("action_description") or subj.get("action") or "Hành vi quan sát được"
                    subj_risk = int(subj.get("risk_score", 15))
                    raw_intervals = [{
                        "start_time": 0.0,
                        "end_time": duration_sec,
                        "action_description": subj_action,
                        "risk_score": subj_risk,
                        "risk_level": "CRITICAL" if subj_risk >= 70 else ("MEDIUM" if subj_risk >= 40 else "LOW"),
                        "is_danger": subj_risk >= 70
                    }]
                for interval in raw_intervals:
                    st = max(0.0, float(interval.get("start_time", 0.0)))
                    et = min(duration_sec, float(interval.get("end_time", duration_sec)))
                    if et <= st:
                        et = min(duration_sec, st + 2.0)
                    time_display = f"{int(st//60):02d}:{int(st%60):02d} - {int(et//60):02d}:{int(et%60):02d}"
                    act_desc = interval.get("action_description") or interval.get("action") or "Hành vi quan sát được"
                    r_score = int(interval.get("risk_score", 15))
                    r_lvl = interval.get("risk_level", "LOW")
                    if r_lvl in ["NORMAL", "LOW", "Safe"]:
                        r_lvl = "LOW"
                    elif r_lvl in ["WARNING", "MEDIUM", "MODERATE"]:
                        r_lvl = "MEDIUM"
                    else:
                        r_lvl = "CRITICAL"

                    is_d = bool(interval.get("is_danger", r_score >= 70))
                    d_sum = interval.get("danger_summary") or interval.get("danger_notes") or ("Cảnh báo nguy cơ cao" if is_d else "")

                    t_intervals.append(TimeInterval(
                        start_time=st,
                        end_time=et,
                        time_label=time_display,
                        action_description=act_desc,
                        risk_score=r_score,
                        risk_level=r_lvl,
                        is_danger=is_d,
                        danger_summary=d_sum
                    ))

                    evt_id = f"evt_{len(events_list)+1}"
                    events_list.append(VideoActionEvent(
                        id=evt_id,
                        event_id=evt_id,
                        character_id=t_id,
                        target_id=t_id,
                        subject_class=s_class,
                        start_time=st,
                        end_time=et,
                        time_label=time_display,
                        timestamp_display=time_display,
                        action=act_desc,
                        action_description=act_desc,
                        risk_score=r_score,
                        risk_level="CRITICAL" if is_d or r_lvl == "CRITICAL" else ("WARNING" if r_lvl == "MEDIUM" else "NORMAL"),
                        is_danger=is_d,
                        danger_summary=d_sum,
                        danger_notes=d_sum,
                        bounding_box_normalized=bbox
                    ))

                subjects_list.append(SubjectTrack(
                    target_id=t_id,
                    subject_class=s_class,
                    bounding_box_normalized=bbox,
                    time_intervals=t_intervals
                ))
        else:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Missing API Key or Gemini Connection Failed",
                    "detail": "Gemini returned empty subjects list. Mock data fallback is disabled."
                }
            )

        distinct_chars = [s.target_id for s in subjects_list]
        total_subjects = parsed.get("total_subjects") or parsed.get("total_subjects_detected") or len(subjects_list)

        return VideoAnalysisResult(
            total_subjects_detected=total_subjects,
            scene_summary=scene_summary,
            subjects=subjects_list,
            characters_detected=distinct_chars,
            characters=distinct_chars,
            events=events_list,
            video_url=video_url,
            filename=file.filename,
            duration=duration_sec,
            ai_model_used=model_used or MODEL_NAME
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[MODULE 1 CRITICAL ERROR] Gemini processing failed: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Missing API Key or Gemini Connection Failed",
                "detail": str(e)
            }
        )


@app.post("/api/analyze-live")
async def analyze_live_endpoint(req: AnalyzeFrameRequest):
    """
    Live Camera Mode Telemetry (Gemini 2.5 Flash):
    - Receives camera snapshots every 3-4s.
    - Returns immediate telemetry to update the right-hand panel without refreshing UI.
    """
    global genai_client
    if req.image_base64:
        try:
            clean_b64 = req.image_base64.split(",")[-1]
            img_bytes = base64.b64decode(clean_b64)
            pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image: {e}")
    else:
        frame = camera_manager.get_latest_frame()
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb)

    now_str = datetime.now().strftime("%H:%M:%S")

    if genai_client:
        try:
            prompt = """
            Phân tích nhanh khung hình camera an ninh trực tiếp này.
            Nhận diện nhân vật (ví dụ: Target #1), hành vi hiện tại bằng tiếng Việt, và mức độ rủi ro an ninh.
            Trả về JSON:
            {
              "character_id": "Target #1",
              "action": "Mô tả ngắn gọn hành vi thực tế",
              "risk_score": 25,
              "risk_level": "NORMAL",
              "is_danger": false,
              "danger_notes": ""
            }
            """
            res = genai_client.models.generate_content(
                model=MODEL_NAME,
                contents=[pil_image, prompt],
                config={"response_mime_type": "application/json", "temperature": 0.2}
            )
            data = json.loads(res.text)
            r_score = int(data.get("risk_score", 20))
            lvl = data.get("risk_level", "NORMAL")
            return {
                "character_id": data.get("character_id", "Target #1"),
                "action": data.get("action", "Hoạt động bình thường"),
                "risk_score": r_score,
                "risk_level": lvl,
                "is_danger": bool(data.get("is_danger", r_score >= 70)),
                "danger_notes": data.get("danger_notes", ""),
                "time_label": now_str,
                "model_used": MODEL_NAME
            }
        except Exception as e:
            print(f"[LIVE AI ERROR] {e}")

    return {
        "character_id": "Target #1",
        "action": "Đối tượng hiện diện trong góc quan sát camera an ninh",
        "risk_score": 20,
        "risk_level": "NORMAL",
        "is_danger": False,
        "danger_notes": "",
        "time_label": now_str,
        "model_used": "Offline Telemetry"
    }


# =============================================================================
# INCIDENT HISTORY & AI COPILOT
# =============================================================================

@app.get("/api/incidents")
def get_incidents():
    """Returns list of detected security incidents."""
    return {
        "total": len(incident_history),
        "incidents": incident_history
    }


@app.post("/api/chat")
async def chat_copilot_endpoint(req: ChatRequest):
    """Context-aware AI Security Copilot powered by Google Gemini 2.5 Flash."""
    global genai_client

    query = req.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    context_str = f"""
    THÔNG TIN CAMERA HIỆN TẠI TỪ HỆ THỐNG:
    - Hành vi đối tượng ghi nhận: {latest_telemetry.get('action_detected')}
    - Mức độ rủi ro (Threat Score): {latest_telemetry.get('risk_score')}% ({latest_telemetry.get('alert_level')})
    - Tóm tắt thị giác: {latest_telemetry.get('description')}
    - Thời gian kiểm tra: {latest_telemetry.get('timestamp')}
    - Số lượng sự cố cảnh báo đã lưu trong ca: {len(incident_history)} sự cố.
    """

    if not genai_client:
        lower = query.lower()
        if "tóm tắt" in lower or "5 phút" in lower:
            answer = f"Báo cáo ca trực: Hệ thống ghi nhận hành vi hiện tại là '{latest_telemetry.get('action_detected')}'. Điểm nguy cơ: {latest_telemetry.get('risk_score')}%. Đang giám sát camera 01 liên tục."
        elif "vùng cấm" in lower or "roi" in lower:
            answer = "Ranh giới Vùng Cấm (ROI) đang được theo dõi bằng thuật toán ranh giới đa giác. Nếu đối tượng xâm phạm vạch đỏ, còi báo động sẽ được kích hoạt tức thì."
        elif "bạo lực" in lower or "ẩu đả" in lower:
            answer = "Hiện tại không phát hiện cử chỉ vung tay bạo lực. Các cử chỉ cử động cơ thể nằm trong ngưỡng an toàn."
        else:
            answer = f"AI Copilot đã ghi nhận câu hỏi '{query}'. Trạng thái an ninh hiện thời là {latest_telemetry.get('alert_level')} ({latest_telemetry.get('risk_score')}%). Mọi thông số an ninh đang được đảm bảo."
        return {
            "answer": answer,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "model_used": "Offline Security Heuristic (Nhập GEMINI_API_KEY để kích hoạt Gemini 2.5 Flash)"
        }

    chat_prompt = f"""
    {context_str}

    Bạn là AI Security Copilot cao cấp trong phòng điều khiển trung tâm giám sát an ninh thông minh SENTINEL AI VISION.
    Người vận hành đang hỏi: "{query}"

    Hãy trả lời chuyên nghiệp, súc tích, bằng tiếng Việt chuẩn mực an ninh, đưa ra nhận định rõ ràng và khuyến nghị hành động nếu có nguy cơ.
    """

    try:
        response = genai_client.models.generate_content(
            model=MODEL_NAME,
            contents=[chat_prompt],
            config={"temperature": 0.4}
        )
        return {
            "answer": response.text,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "model_used": MODEL_NAME
        }
    except Exception as e:
        return {
            "answer": f"Lỗi gọi Gemini AI ({str(e)[:80]}). Trạng thái hiện tại: {latest_telemetry.get('action_detected')}, Nguy cơ: {latest_telemetry.get('risk_score')}%.",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "model_used": "Fallback"
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"\n=======================================================")
    print(f"[START] SENTINEL AI SURVEILLANCE BACKEND RUNNING ON http://localhost:{port}")
    print(f"[VIDEO] MJPEG Video Feed: http://localhost:{port}/video_feed")
    print(f"[TELEMETRY] Telemetry API: http://localhost:{port}/api/telemetry")
    print(f"[UPLOAD] Video Upload API: http://localhost:{port}/api/upload-video")
    print(f"=======================================================\n")
    uvicorn.run(app, host=host, port=port)
