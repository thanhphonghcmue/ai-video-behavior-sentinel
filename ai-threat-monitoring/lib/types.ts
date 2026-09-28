// ==========================================
// TYPE DEFINITIONS FOR AI THREAT MONITORING
// Integrated with HumanRecognitionBehaviorAnalysis-main
// ==========================================

export type ThreatLevel = 'LOW' | 'MEDIUM' | 'CRITICAL';

export type ActionCategory = 'NORMAL' | 'SUSPICIOUS' | 'DANGER';

export type ActionType =
  // Normal
  | 'STANDING'
  | 'WALKING'
  | 'SITTING'
  // Suspicious
  | 'BENDING_LOITERING'
  | 'SNEAKING'
  | 'SUSPICIOUS_LOITERING'
  // Danger
  | 'PUNCHING_VIOLENCE'
  | 'FIGHTING'
  | 'ROI_INTRUSION'
  | 'SUDDEN_FALL';

export type EmotionType = 'neutral' | 'anger' | 'surprise' | 'fear' | 'happy' | 'sad';

export interface Point2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  confidence: number;
}

// 18 OpenPose Keypoints corresponding to lightweight_openpose_adapted
export interface PoseKeypoint {
  id: number;
  name: string;
  x: number; // 0 to 1 normalized or pixel space
  y: number;
  score: number;
}

// Pairs of keypoint IDs that form human skeleton limbs
export type SkeletonConnection = [number, number];

export interface DetectedPerson {
  id: string;
  trackingLabel: string;
  bbox: BoundingBox;
  keypoints: PoseKeypoint[];
  action: ActionType;
  actionConfidence: number;
  emotion: EmotionType;
  isInROI: boolean;
  dwellTimeSeconds: number;
  threatScore: number;
  threatLevel: ThreatLevel;
  velocity: number;
  lastUpdated: number;
}

export interface ROIZone {
  id: string;
  name: string;
  points: Point2D[];
  isRestricted: boolean;
  sensitivityThreshold: number;
  color?: string;
}

export interface IncidentEvent {
  id: string;
  timestamp: string;
  relativeTimeSec: number;
  action: ActionType;
  actionLabelVi: string;
  threatScore: number;
  threatLevel: ThreatLevel;
  personId: string;
  personLabel: string;
  location: string;
  thumbnailUrl?: string;
  description: string;
  acknowledged: boolean;
}

export type CameraSourceType = 'webcam' | 'file' | 'rtsp' | 'mjpeg';

export interface CameraSourceConfig {
  type: CameraSourceType;
  url?: string;
  fps: number;
  resolution: { width: number; height: number };
}

export type UserRole = 'admin' | 'operator' | 'demo';

export interface UserSession {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  metadata?: {
    threatLevel?: ThreatLevel;
    incidentId?: string;
    actionType?: ActionType;
    quickChips?: string[];
  };
}

export interface SystemTelemetry {
  fps: number;
  activePersonsCount: number;
  currentThreatScore: number;
  systemStatus: 'SAFE' | 'WARNING' | 'ALERT_CRITICAL';
  cpuLoad: number;
  gpuLoad: number;
  backendConnected: boolean;
}
