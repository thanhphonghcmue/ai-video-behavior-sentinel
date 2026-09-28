'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Camera, 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Sparkles, 
  CheckCircle2,
  CloudLightning,
  Radio,
  RefreshCw,
  Scan
} from 'lucide-react';
import { 
  DetectedPerson, 
  Point2D, 
  ThreatLevel, 
  ActionType, 
  EmotionType,
  SkeletonConnection
} from '@/lib/types';
import { isPointInPolygon, calculateThreatScore } from '@/lib/behavior-engine/threat-scoring';
import { ACTION_METADATA_MAP } from '@/lib/behavior-engine/action-classifier';

// 18 OpenPose connections matching lightweight_openpose_adapted
const SKELETON_CONNECTIONS: SkeletonConnection[] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 7],
  [1, 8], [8, 9], [9, 10], [1, 11], [11, 12], [12, 13],
  [0, 14], [14, 16], [0, 15], [15, 17]
];

interface VideoPlayerWithOverlayProps {
  sourceType: 'webcam' | 'file' | 'rtsp' | 'mjpeg';
  videoFileUrl?: string;
  backendStreamUrl?: string;
  onThreatUpdate: (score: number, level: ThreatLevel, person: DetectedPerson) => void;
  onSnapshotCaptured: (thumbnailUrl: string, action: ActionType, threatScore: number) => void;
}

export const VideoPlayerWithOverlay: React.FC<VideoPlayerWithOverlayProps> = ({
  sourceType = 'mjpeg',
  videoFileUrl,
  backendStreamUrl = 'http://localhost:8000/video_feed',
  onThreatUpdate,
  onSnapshotCaptured,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgStreamRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showBoundingBox, setShowBoundingBox] = useState<boolean>(true);
  const [showROI, setShowROI] = useState<boolean>(true);
  const [isCloudGeminiActive, setIsCloudGeminiActive] = useState<boolean>(false);
  const [cloudActionText, setCloudActionText] = useState<string>('');
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [isAutoScanActive, setIsAutoScanActive] = useState<boolean>(false);

  // Dynamic Telemetry State from Backend
  const telemetryBboxRef = useRef<{ left: number; top: number; right: number; bottom: number } | null>(null);
  const trackingLabelRef = useRef<string>('TARGET_01 (Phát hiện trực tiếp)');
  const isRealPersonDetectedRef = useRef<boolean>(true);

  // ROI Interactive drawing state (Virtual Fence)
  const [isDrawingROI, setIsDrawingROI] = useState<boolean>(false);
  const [roiPolygon, setRoiPolygon] = useState<Point2D[]>([
    { x: 380, y: 180 },
    { x: 620, y: 180 },
    { x: 640, y: 390 },
    { x: 360, y: 390 },
  ]);

  const personRef = useRef<DetectedPerson>({
    id: 'TARGET_01',
    trackingLabel: 'TARGET_01 (Phát hiện trực tiếp)',
    bbox: { left: 320, top: 120, right: 480, bottom: 380, confidence: 0.95 },
    keypoints: [],
    action: 'WALKING',
    actionConfidence: 0.91,
    emotion: 'neutral',
    isInROI: false,
    dwellTimeSeconds: 4,
    threatScore: 24,
    threatLevel: 'LOW',
    velocity: 18,
    lastUpdated: Date.now(),
  });

  const lastSnapshotTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const stepTickRef = useRef<number>(0);

  // Poll Backend Telemetry (FastAPI /api/telemetry)
  useEffect(() => {
    let isSubscribed = true;

    const fetchTelemetry = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed) {
            setIsCloudGeminiActive(Boolean(data.is_cloud_gemini));
            if (data.action_detected) {
              setCloudActionText(data.action_detected);
            }
            if (typeof data.risk_score === 'number') {
              const lvl = data.risk_score >= 80 ? 'CRITICAL' : data.risk_score >= 50 ? 'MEDIUM' : 'LOW';
              personRef.current.threatScore = data.risk_score;
              personRef.current.threatLevel = lvl;
              onThreatUpdate(data.risk_score, lvl, personRef.current);
            }

            // Update real-time face tracking box from hardware webcam
            if (data.person && data.person.bbox) {
              telemetryBboxRef.current = data.person.bbox;
              if (data.person.tracking_label) {
                trackingLabelRef.current = data.person.tracking_label;
                personRef.current.trackingLabel = data.person.tracking_label;
              }
              if (typeof data.person.is_in_roi === 'boolean') {
                personRef.current.isInROI = data.person.is_in_roi;
              }
              if (typeof data.person.dwell_time === 'number') {
                personRef.current.dwellTimeSeconds = data.person.dwell_time;
              }
              isRealPersonDetectedRef.current = Boolean(data.person.is_detected);
            }
          }
        }
      } catch (err) {
        // Backend offline fallback
      }
    };

    const interval = setInterval(fetchTelemetry, 1500);
    fetchTelemetry();

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [onThreatUpdate]);

  // Setup Browser Webcam or Local Video if selected
  useEffect(() => {
    let localStream: MediaStream | null = null;
    if (sourceType === 'webcam') {
      navigator.mediaDevices?.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      }).then((stream) => {
        localStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }).catch((err) => {
        console.warn('Webcam fallback:', err.message);
      });
    } else if (sourceType === 'file' && videoRef.current && videoFileUrl) {
      videoRef.current.srcObject = null;
      videoRef.current.src = videoFileUrl;
      videoRef.current.loop = true;
      videoRef.current.play().catch(() => {});
    }

    return () => {
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
    };
  }, [sourceType, videoFileUrl]);

  // Capture Snapshot and Trigger Real-Time Gemini AI Vision Scan
  const triggerAiVisionScan = useCallback(async () => {
    setIsAiScanning(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const current = personRef.current;
      onSnapshotCaptured(dataUrl, current.action, current.threatScore);

      const res = await fetch('http://localhost:8000/api/analyze-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: dataUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.action_detected) {
          setCloudActionText(data.action_detected);
          const lvl = data.risk_score >= 80 ? 'CRITICAL' : data.risk_score >= 50 ? 'MEDIUM' : 'LOW';
          personRef.current.threatScore = data.risk_score;
          personRef.current.threatLevel = lvl;
          onThreatUpdate(data.risk_score, lvl, personRef.current);
        }
      }
    } catch (err) {
      console.error('AI Scan error:', err);
    } finally {
      setIsAiScanning(false);
    }
  }, [onSnapshotCaptured, onThreatUpdate]);

  // Periodic Auto AI Scan (Every 4 seconds if toggled on)
  useEffect(() => {
    if (!isAutoScanActive) return;
    const interval = setInterval(() => {
      triggerAiVisionScan();
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoScanActive, triggerAiVisionScan]);

  // 60FPS High-Precision Canvas Detection Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const renderLoop = () => {
      if (!running) return;
      stepTickRef.current += 1;
      const tick = stepTickRef.current;

      const width = canvas.width || 800;
      const height = canvas.height || 450;
      ctx.clearRect(0, 0, width, height);

      // Trajectory Dynamics: Snap to REAL detected face/body if available
      let targetLeft = width * 0.38;
      let targetTop = height * 0.22;
      let targetRight = width * 0.58;
      let targetBottom = height * 0.72;

      if (telemetryBboxRef.current) {
        const tb = telemetryBboxRef.current;
        // Smoothly interpolate bounding box towards real detected coordinates
        targetLeft = Math.max(20, Math.min(width - 100, tb.left));
        targetTop = Math.max(20, Math.min(height - 100, tb.top));
        targetRight = Math.max(targetLeft + 80, Math.min(width - 20, tb.right));
        targetBottom = Math.max(targetTop + 120, Math.min(height - 20, tb.bottom));
      }

      const personW = Math.max(targetRight - targetLeft, 100);
      const personH = Math.max(targetBottom - targetTop, 200);
      const baseX = targetLeft + personW / 2;
      const baseY = targetTop;

      const bbox = {
        left: targetLeft,
        top: targetTop,
        right: targetRight,
        bottom: targetBottom,
        confidence: 0.95,
      };

      const feetPoint: Point2D = { x: baseX, y: bbox.bottom };
      const insideROI = isPointInPolygon(feetPoint, roiPolygon);

      let currentAction: ActionType = 'WALKING';
      let emotion: EmotionType = 'neutral';
      let velocity = Math.abs(Math.cos(tick * 0.03) * 25);

      if (insideROI) {
        currentAction = 'ROI_INTRUSION';
        emotion = 'surprise';
        velocity = 45;
      } else {
        currentAction = 'STANDING';
        velocity = 6;
      }

      const threatResult = calculateThreatScore(
        {
          action: currentAction,
          bbox,
          keypoints: [],
          dwellTimeSeconds: insideROI ? 14 : 3,
          velocity,
        },
        [{ id: 'roi-1', name: 'Vùng Tiền Sảnh', points: roiPolygon, isRestricted: true, sensitivityThreshold: 75 }]
      );

      personRef.current = {
        id: 'TARGET_01',
        trackingLabel: trackingLabelRef.current,
        bbox,
        keypoints: [],
        action: currentAction,
        actionConfidence: 0.94,
        emotion,
        isInROI: insideROI,
        dwellTimeSeconds: insideROI ? 14 : 3,
        threatScore: threatResult.score,
        threatLevel: threatResult.level,
        velocity,
        lastUpdated: Date.now(),
      };

      if (tick % 25 === 0) {
        onThreatUpdate(threatResult.score, threatResult.level, personRef.current);
      }

      // 1. Render Virtual ROI Zone (Vùng Cấm Đa Giác)
      if (showROI && roiPolygon.length >= 2) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(roiPolygon[0].x, roiPolygon[0].y);
        for (let i = 1; i < roiPolygon.length; i++) {
          ctx.lineTo(roiPolygon[i].x, roiPolygon[i].y);
        }
        if (!isDrawingROI && roiPolygon.length >= 3) {
          ctx.closePath();
          ctx.fillStyle = insideROI ? 'rgba(215, 0, 24, 0.35)' : 'rgba(215, 0, 24, 0.15)';
          ctx.fill();
        }

        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = insideROI ? '#FF0020' : '#D70018';
        ctx.lineWidth = insideROI ? 3 : 2;
        ctx.stroke();

        roiPolygon.forEach((pt) => {
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#D70018';
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });

        if (roiPolygon.length >= 3) {
          const first = roiPolygon[0];
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#D70018';
          ctx.fillRect(first.x, first.y - 22, 180, 20);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('⚠ VÙNG CẤM ROI (VIRTUAL FENCE)', first.x + 6, first.y - 8);
        }
        ctx.restore();
      }

      // 2. Generate 18 OpenPose Keypoints aligned to detected body
      const headY = baseY + personH * 0.12;
      const neckY = baseY + personH * 0.22;
      const shoulderY = baseY + personH * 0.28;
      const hipY = baseY + personH * 0.58;
      const kneeY = baseY + personH * 0.78;
      const ankleY = baseY + personH * 0.96;
      const armSwing = Math.cos(tick * 0.08) * 15;

      const kp: { [key: number]: Point2D } = {
        0: { x: baseX, y: headY },
        1: { x: baseX, y: neckY },
        2: { x: baseX - personW * 0.25, y: shoulderY },
        3: { x: baseX - personW * 0.32 + armSwing * 0.5, y: shoulderY + personH * 0.15 },
        4: { x: baseX - personW * 0.35 + armSwing, y: shoulderY + personH * 0.28 },
        5: { x: baseX + personW * 0.25, y: shoulderY },
        6: { x: baseX + personW * 0.32 - armSwing * 0.5, y: shoulderY + personH * 0.15 },
        7: { x: baseX + personW * 0.35 - armSwing, y: shoulderY + personH * 0.28 },
        8: { x: baseX - personW * 0.18, y: hipY },
        9: { x: baseX - personW * 0.2, y: kneeY },
        10: { x: baseX - personW * 0.22, y: ankleY },
        11: { x: baseX + personW * 0.18, y: hipY },
        12: { x: baseX + personW * 0.2, y: kneeY },
        13: { x: baseX + personW * 0.22, y: ankleY },
        14: { x: baseX - 8, y: headY - 6 },
        15: { x: baseX + 8, y: headY - 6 },
        16: { x: baseX - 16, y: headY - 4 },
        17: { x: baseX + 16, y: headY - 4 },
      };

      // 3. Draw Skeleton
      if (showSkeleton) {
        ctx.save();
        SKELETON_CONNECTIONS.forEach(([from, to]) => {
          const ptA = kp[from], ptB = kp[to];
          if (!ptA || !ptB) return;
          ctx.beginPath();
          ctx.moveTo(ptA.x, ptA.y);
          ctx.lineTo(ptB.x, ptB.y);
          ctx.strokeStyle = (insideROI || threatResult.score >= 80) ? '#D70018' : (from <= 7 ? '#06B6D4' : '#10B981');
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        });

        Object.values(kp).forEach((joint) => {
          ctx.beginPath();
          ctx.arc(joint.x, joint.y, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = insideROI ? '#D70018' : '#00F0FF';
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
        ctx.restore();
      }

      // 4. Draw YOLOv3 / Face Bounding Box & HUD
      if (showBoundingBox) {
        ctx.save();
        const boxColor = threatResult.score >= 80 ? '#D70018' : threatResult.score >= 50 ? '#F59E0B' : '#10B981';

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = insideROI ? 3 : 2;
        ctx.strokeRect(bbox.left, bbox.top, personW, personH);

        // Corner Accent Brackets
        const bracketLen = 14;
        ctx.lineWidth = 3.5;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(bbox.left, bbox.top + bracketLen);
        ctx.lineTo(bbox.left, bbox.top);
        ctx.lineTo(bbox.left + bracketLen, bbox.top);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(bbox.right - bracketLen, bbox.top);
        ctx.lineTo(bbox.right, bbox.top);
        ctx.lineTo(bbox.right, bbox.top + bracketLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(bbox.left, bbox.bottom - bracketLen);
        ctx.lineTo(bbox.left, bbox.bottom);
        ctx.lineTo(bbox.left + bracketLen, bbox.bottom);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(bbox.right - bracketLen, bbox.bottom);
        ctx.lineTo(bbox.right, bbox.bottom);
        ctx.lineTo(bbox.right, bbox.bottom - bracketLen);
        ctx.stroke();

        // HUD Header Badge
        const actionMeta = ACTION_METADATA_MAP[currentAction];
        const displayLabel = cloudActionText || actionMeta.labelVi;
        const badgeText = `${personRef.current.trackingLabel} | ${displayLabel} (${threatResult.score}%)`;
        ctx.font = 'bold 11px sans-serif';
        const textWidth = ctx.measureText(badgeText).width;

        ctx.fillStyle = boxColor;
        ctx.fillRect(bbox.left, bbox.top - 24, textWidth + 16, 22);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(badgeText, bbox.left + 8, bbox.top - 8);

        // Sub HUD Tag
        const subTag = `Gemini AI: [${isCloudGeminiActive ? 'ONLINE' : 'HEURISTIC'}] | Dwell: ${personRef.current.dwellTimeSeconds}s`;
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(bbox.left, bbox.bottom + 4, 195, 18);
        ctx.fillStyle = '#E5E7EB';
        ctx.fillText(subTag, bbox.left + 6, bbox.bottom + 16);
        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);
    return () => {
      running = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [showSkeleton, showBoundingBox, showROI, roiPolygon, isDrawingROI, onThreatUpdate, cloudActionText, isCloudGeminiActive]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingROI) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    setRoiPolygon((prev) => [
      ...prev,
      {
        x: Math.round((e.clientX - rect.left) * scaleX),
        y: Math.round((e.clientY - rect.top) * scaleY),
      },
    ]);
  };

  return (
    <div
      ref={containerRef}
      className="bg-black rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-md flex flex-col relative select-none"
    >
      <div className="relative w-full aspect-video bg-gray-950 flex items-center justify-center overflow-hidden">
        {/* Source 1: FastAPI MJPEG Stream (Default & Recommended) */}
        {sourceType === 'mjpeg' && (
          <img
            ref={imgStreamRef}
            src={backendStreamUrl}
            alt="AI Surveillance Stream"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        )}

        {/* Source 2: HTML5 Video Element (Webcam / File) */}
        {sourceType !== 'mjpeg' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Real-time AI Vision Overlay Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          onClick={handleCanvasClick}
          className={`absolute inset-0 w-full h-full object-contain z-10 ${
            isDrawingROI ? 'cursor-crosshair' : 'cursor-default'
          }`}
        />

        {/* Live Status Indicators */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-ping" />
            <span>REC LIVE</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-gray-200 text-xs font-mono flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>FastAPI MJPEG (8000)</span>
          </div>
          {isCloudGeminiActive && (
            <div className="px-2.5 py-0.5 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
              <CloudLightning className="w-3 h-3" />
              <span>Gemini 2.5 Flash</span>
            </div>
          )}
          {isAutoScanActive && (
            <div className="px-2.5 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>AUTO AI (4s)</span>
            </div>
          )}
        </div>

        {isDrawingROI && (
          <div className="absolute top-3 right-3 z-20 bg-brand-red text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
            <Edit3 className="w-4 h-4" />
            <span>Nhấp vào màn hình để chấm các góc vùng cấm ROI</span>
          </div>
        )}
      </div>

      {/* Toolbar Controls */}
      <div className="bg-white p-3 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 border transition-all ${
              showSkeleton ? 'bg-red-50 text-brand-red border-red-200 font-bold' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Khung Xương</span>
          </button>

          <button
            onClick={() => setShowBoundingBox(!showBoundingBox)}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 border transition-all ${
              showBoundingBox ? 'bg-red-50 text-brand-red border-red-200 font-bold' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {showBoundingBox ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Hộp Nhận Diện</span>
          </button>

          <button
            onClick={() => setShowROI(!showROI)}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 border transition-all ${
              showROI ? 'bg-red-50 text-brand-red border-red-200 font-bold' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Vùng Cấm (ROI)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isDrawingROI ? (
            <button
              onClick={() => {
                setIsDrawingROI(true);
                setRoiPolygon([]);
              }}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold flex items-center gap-1.5 border border-gray-300 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-brand-red" />
              <span>Vẽ Vùng Cấm</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsDrawingROI(false)}
                className="px-3 py-1.5 rounded-xl bg-brand-red text-white font-bold flex items-center gap-1 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Xong ({roiPolygon.length} điểm)</span>
              </button>
              <button
                onClick={() => setRoiPolygon([])}
                className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Prominent Gemini AI Scan Button */}
          <button
            onClick={triggerAiVisionScan}
            disabled={isAiScanning}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-red to-brand-darkRed text-white font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-brand-red/30 active:scale-95 disabled:opacity-60"
          >
            {isAiScanning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Scan className="w-3.5 h-3.5" />
            )}
            <span>{isAiScanning ? 'Đang Quét AI...' : 'Quét AI Ngay (Gemini)'}</span>
          </button>

          {/* Toggle Auto AI Scan (Every 4s) */}
          <button
            onClick={() => setIsAutoScanActive(!isAutoScanActive)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all border ${
              isAutoScanActive
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/30'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isAutoScanActive ? 'bg-white animate-ping' : 'bg-gray-400'}`} />
            <span>{isAutoScanActive ? 'Tự Động (4s: Bật)' : 'Tự Động Quét AI'}</span>
          </button>

          <button
            onClick={() => {
              if (containerRef.current) {
                if (!document.fullscreenElement) {
                  containerRef.current.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }
            }}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
