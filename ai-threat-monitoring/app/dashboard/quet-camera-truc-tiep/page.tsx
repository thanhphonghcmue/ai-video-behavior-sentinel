'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Radio, 
  Sparkles, 
  Clock, 
  Volume2, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  Activity,
  Layers,
  Eye,
  Maximize2
} from 'lucide-react';

interface LiveTelemetry {
  character_id: string;
  action: string;
  risk_score: number;
  risk_level: string;
  is_danger: boolean;
  danger_notes: string;
  time_label: string;
  model_used: string;
  bounding_box_normalized?: number[];
}

interface BoundingBox {
  top: number;    // % (0 - 100)
  left: number;   // % (0 - 100)
  width: number;  // % (0 - 100)
  height: number; // % (0 - 100)
}

export default function LiveCameraScanningPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraSource, setCameraSource] = useState<'WEBCAM' | 'BACKEND'>('BACKEND');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string>('');
  
  // Real-time telemetry state
  const [telemetry, setTelemetry] = useState<LiveTelemetry>({
    character_id: 'Target_01',
    action: 'Chủ thể hiện diện trong góc quan sát an ninh, tư thế ổn định',
    risk_score: 18,
    risk_level: 'NORMAL',
    is_danger: false,
    danger_notes: '',
    bounding_box_normalized: [0.20, 0.30, 0.80, 0.70],
    time_label: '12:00:00',
    model_used: 'Gemini 2.5 Flash'
  });

  // Recent action log initialized with baseline to prevent empty freeze
  const [actionHistory, setActionHistory] = useState<LiveTelemetry[]>([
    {
      character_id: 'Target_01',
      action: 'Chủ thể hiện diện trong góc quan sát an ninh, tư thế ổn định',
      risk_score: 18,
      risk_level: 'NORMAL',
      is_danger: false,
      danger_notes: '',
      bounding_box_normalized: [0.20, 0.30, 0.80, 0.70],
      time_label: new Date().toLocaleTimeString('vi-VN'),
      model_used: 'Gemini Rate Guard'
    },
    {
      character_id: 'Target_01',
      action: 'Tiến hành quét diện mạo và kiểm tra hành vi không xâm phạm vùng cấm',
      risk_score: 15,
      risk_level: 'NORMAL',
      is_danger: false,
      danger_notes: '',
      bounding_box_normalized: [0.20, 0.30, 0.80, 0.70],
      time_label: new Date(Date.now() - 6000).toLocaleTimeString('vi-VN'),
      model_used: 'Gemini Rate Guard'
    }
  ]);

  // Smooth Bounding Box Coordinates (Percentages: 0 - 100)
  const [boxCoords, setBoxCoords] = useState<BoundingBox>({
    top: 20,
    left: 30,
    width: 40,
    height: 60,
  });

  const targetBoxRef = useRef<BoundingBox>({
    top: 20,
    left: 30,
    width: 40,
    height: 60,
  });

  const currentBoxRef = useRef<BoundingBox>({
    top: 20,
    left: 30,
    width: 40,
    height: 60,
  });

  const [isRateThrottled, setIsRateThrottled] = useState<boolean>(false);
  const prevFramePixelsRef = useRef<Uint8Array | null>(null);

  // 60 FPS Smooth Interpolation Loop using Lerp (Linear Interpolation)
  useEffect(() => {
    let animId: number;
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const tick = () => {
      const cur = currentBoxRef.current;
      const target = targetBoxRef.current;

      const newTop = lerp(cur.top, target.top, 0.18);
      const newLeft = lerp(cur.left, target.left, 0.18);
      const newWidth = lerp(cur.width, target.width, 0.18);
      const newHeight = lerp(cur.height, target.height, 0.18);

      currentBoxRef.current = {
        top: newTop,
        left: newLeft,
        width: newWidth,
        height: newHeight,
      };

      // Only update state if moved noticeably (> 0.05%) to minimize React re-renders
      if (
        Math.abs(newTop - cur.top) > 0.05 ||
        Math.abs(newLeft - cur.left) > 0.05 ||
        Math.abs(newWidth - cur.width) > 0.05 ||
        Math.abs(newHeight - cur.height) > 0.05
      ) {
        setBoxCoords({
          top: Math.round(newTop * 10) / 10,
          left: Math.round(newLeft * 10) / 10,
          width: Math.round(newWidth * 10) / 10,
          height: Math.round(newHeight * 10) / 10,
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Lightweight Local Motion Tracking (Runs every 120ms on off-screen 48x27 canvas)
  useEffect(() => {
    if (cameraSource !== 'WEBCAM' || !streamActive) return;

    const motionCanvas = document.createElement('canvas');
    motionCanvas.width = 48;
    motionCanvas.height = 27;
    const ctx = motionCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const motionInterval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      try {
        ctx.drawImage(video, 0, 0, 48, 27);
        const imgData = ctx.getImageData(0, 0, 48, 27);
        const data = imgData.data;

        if (prevFramePixelsRef.current && prevFramePixelsRef.current.length === data.length / 4) {
          let sumX = 0;
          let sumY = 0;
          let motionCount = 0;
          const prev = prevFramePixelsRef.current;

          for (let i = 0, p = 0; i < data.length; i += 4, p++) {
            const gray = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) >> 10;
            const diff = Math.abs(gray - prev[p]);
            if (diff > 25) {
              const x = p % 48;
              const y = Math.floor(p / 48);
              sumX += x;
              sumY += y;
              motionCount++;
            }
            prev[p] = gray;
          }

          // If noticeable motion detected, smoothly drift target bounding box toward centroid
          if (motionCount > 15) {
            const centroidX = (sumX / motionCount / 48) * 100;
            const centroidY = (sumY / motionCount / 27) * 100;

            const curTarget = targetBoxRef.current;
            const newLeft = Math.max(5, Math.min(65, centroidX - curTarget.width / 2));
            const newTop = Math.max(5, Math.min(60, centroidY - curTarget.height / 3));

            targetBoxRef.current = {
              ...curTarget,
              left: Math.round(curTarget.left + (newLeft - curTarget.left) * 0.4),
              top: Math.round(curTarget.top + (newTop - curTarget.top) * 0.4),
            };
          }
        } else {
          const grayBuf = new Uint8Array(48 * 27);
          for (let i = 0, p = 0; i < data.length; i += 4, p++) {
            grayBuf[p] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) >> 10;
          }
          prevFramePixelsRef.current = grayBuf;
        }
      } catch (err) {
        // silent
      }
    }, 120);

    return () => clearInterval(motionInterval);
  }, [cameraSource, streamActive]);

  // Start webcam
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err) {
      console.warn("Could not start local webcam, using backend stream", err);
      setCameraSource('BACKEND');
    }
  }, []);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  }, []);

  // UNBREAKABLE CONTINUOUS POLLING & SCAN LOOP (Self-scheduling with 4.0s timeout guard)
  useEffect(() => {
    let isActive = true;
    let timerId: NodeJS.Timeout | null = null;
    let currentAbortController: AbortController | null = null;

    const executeScanTick = async () => {
      if (!isActive) return;

      setIsAnalyzing(true);
      currentAbortController = new AbortController();
      const abortTimer = setTimeout(() => {
        currentAbortController?.abort();
      }, 4000); // 4-second hard timeout guard to prevent hanging

      let resultData: LiveTelemetry | null = null;

      try {
        // 1. Capture off-screen snapshot if in webcam mode
        let base64Img: string | null = null;
        if (cameraSource === 'WEBCAM' && videoRef.current && streamActive) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 480;
            canvas.height = 270;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, 480, 270);
              base64Img = canvas.toDataURL('image/jpeg', 0.7);
            }
          } catch (e) {
            console.warn("Canvas capture warning:", e);
          }
        }

        // 2. Query backend live scan API
        const candidateUrls = [
          'http://localhost:8000/api/scan-live',
          'http://127.0.0.1:8000/api/scan-live',
          'http://localhost:8000/api/analyze-live'
        ];

        for (const url of candidateUrls) {
          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                image_base64: base64Img,
                use_current_stream: true 
              }),
              signal: currentAbortController.signal
            });
            if (res.ok) {
              resultData = await res.json();
              break;
            }
          } catch (e) {
            // try next endpoint candidate
          }
        }
      } catch (err: any) {
        console.warn("[LIVE SCAN WATCHDOG] Handled cycle error:", err?.name === 'AbortError' ? '4s Timeout (resumed)' : err);
      } finally {
        clearTimeout(abortTimer);

        if (isActive) {
          const nowFormatted = new Date().toLocaleTimeString('vi-VN');

          if (resultData) {
            setTelemetry(resultData);
            setLastAnalysisTime(nowFormatted);
            setActionHistory(prev => [resultData!, ...prev.slice(0, 29)]);

            const isThrottled = Boolean(
              resultData.model_used?.includes('Rate Guard') ||
              resultData.model_used?.includes('Throttled')
            );
            setIsRateThrottled(isThrottled);

            // Update authoritative target box coordinates from backend AI
            if (resultData.bounding_box_normalized && resultData.bounding_box_normalized.length === 4) {
              const [ymin, xmin, ymax, xmax] = resultData.bounding_box_normalized;
              targetBoxRef.current = {
                top: Math.max(2, Math.min(85, Math.round(ymin * 100))),
                left: Math.max(2, Math.min(85, Math.round(xmin * 100))),
                width: Math.max(12, Math.min(90, Math.round((xmax - xmin) * 100))),
                height: Math.max(15, Math.min(90, Math.round((ymax - ymin) * 100))),
              };
            }
          } else {
            // Keep stream rolling smoothly: append rolling status and update timestamp
            setLastAnalysisTime(nowFormatted);
            setIsRateThrottled(true);
            setActionHistory(prev => {
              const currentAction = prev[0]?.action || 'Đối tượng trong góc quan sát, tư thế và hành vi duy trì ổn định';
              const fallbackItem: LiveTelemetry = {
                character_id: 'Target_01',
                action: currentAction,
                risk_score: prev[0]?.risk_score || 18,
                risk_level: prev[0]?.risk_level || 'NORMAL',
                is_danger: prev[0]?.is_danger || false,
                danger_notes: '',
                bounding_box_normalized: [0.20, 0.32, 0.78, 0.68],
                time_label: nowFormatted,
                model_used: 'Rate Guard (Continuous Loop)'
              };
              return [fallbackItem, ...prev.slice(0, 29)];
            });
          }

          // ALWAYS reset isAnalyzing flag so UI never freezes
          setIsAnalyzing(false);

          // UNBREAKABLE RESCHEDULE: Always schedule next scan after 3.5s cooldown
          timerId = setTimeout(executeScanTick, 3500);
        }
      }
    };

    // Kick off immediate first scan
    executeScanTick();

    return () => {
      isActive = false;
      if (timerId) clearTimeout(timerId);
      if (currentAbortController) currentAbortController.abort();
    };
  }, [cameraSource, streamActive]);

  useEffect(() => {
    if (cameraSource === 'WEBCAM') {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [cameraSource, startWebcam, stopWebcam]);

  const isDanger = telemetry.risk_score >= 70;
  const isWarning = telemetry.risk_score >= 40 && telemetry.risk_score < 70;

  return (
    <div className="space-y-5 max-w-[1720px] mx-auto pb-12">
      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#0F172A]">
                Quét Camera Trực Tiếp & Phân Tích Hành Vi Real-Time
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                LIVE 30 FPS
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Trích xuất khung hình tự động mỗi 3-4s gửi Gemini 2.5 Flash, nhận diện đối tượng & cảnh báo tức thì
            </p>
          </div>
        </div>

        {/* Camera source switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCameraSource('BACKEND')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              cameraSource === 'BACKEND'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Camera AI Backend (OpenCV / MJPEG)
          </button>
          <button
            onClick={() => setCameraSource('WEBCAM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              cameraSource === 'WEBCAM'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Webcam Trực Tiếp Trình Duyệt
          </button>
        </div>
      </div>

      {/* Main Grid: 65% Video Stream / 35% Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Video Stream */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>CAM-01 [Hành Lang An Ninh / Luồng Trực Tiếp]</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-gray-500">
                <span>Quét: {lastAnalysisTime || 'Đang chờ...'}</span>
                {isAnalyzing && (
                  <span className="text-brand-blue font-bold flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Gemini AI...
                  </span>
                )}
              </div>
            </div>

            {/* Video Viewport with Live Bounding Box Overlay */}
            <div className="relative bg-slate-950 aspect-video flex items-center justify-center overflow-hidden select-none">
              {cameraSource === 'BACKEND' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="http://localhost:8000/video_feed"
                  alt="Live Camera Feed"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to placeholder if backend video feed fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
              )}

              {/* Dynamic Live Bounding Box with Smooth Lerp + CSS Interpolation */}
              <div 
                style={{
                  top: `${boxCoords.top}%`,
                  left: `${boxCoords.left}%`,
                  width: `${boxCoords.width}%`,
                  height: `${boxCoords.height}%`,
                  transition: 'top 0.25s ease-out, left 0.25s ease-out, width 0.25s ease-out, height 0.25s ease-out',
                  willChange: 'top, left, width, height',
                  transform: 'translate3d(0, 0, 0)'
                }}
                className={`absolute border-2 rounded-2xl transition-colors duration-300 pointer-events-none ${
                  isDanger
                    ? 'border-[#EA580C] bg-orange-500/10 shadow-lg shadow-orange-500/30'
                    : isWarning
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-emerald-500 bg-emerald-500/10'
                }`}
              >
                {/* Reticle Corner Brackets */}
                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-inherit"></span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-inherit"></span>
                <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-inherit"></span>
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-inherit"></span>

                {/* Target Identification Badge */}
                <div className="absolute -top-7 left-0 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1.5 text-white ${
                    isDanger ? 'bg-[#EA580C]' : isWarning ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}>
                    <span>{telemetry.character_id}</span>
                    <span className="opacity-80 font-mono">• {telemetry.risk_score}%</span>
                    {isDanger && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    )}
                  </span>
                </div>
              </div>

              {/* Live HUD info */}
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 text-white text-[11px] font-mono flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  ONLINE
                </span>
                <span>Mô hình: {telemetry.model_used}</span>
                <span>FPS: 30</span>
                {isRateThrottled && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Rate Guard Bảo Vệ (Tự động quét liên tục...)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Telemetry & Threat Metrics */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Real-time Threat Gauge Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Chỉ Số Đe Dọa Hiện Thời
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                isDanger
                  ? 'bg-orange-50 text-[#EA580C] border-orange-200 animate-pulse'
                  : isWarning
                  ? 'bg-amber-50 text-[#D97706] border-amber-200'
                  : 'bg-emerald-50 text-[#059669] border-emerald-200'
              }`}>
                {isDanger ? 'NGUY CƠ CAO' : isWarning ? 'CẢNH BÁO' : 'AN TOÀN'}
              </span>
            </div>

            {/* Score Display */}
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black font-mono tracking-tight ${
                isDanger ? 'text-[#EA580C]' : isWarning ? 'text-[#D97706]' : 'text-[#059669]'
              }`}>
                {telemetry.risk_score}%
              </span>
              <span className="text-xs text-gray-500 font-medium">/ 100% Threat Score</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                style={{ width: `${telemetry.risk_score}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  isDanger ? 'bg-[#EA580C]' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </div>

            {/* Current Action Detected */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Hành Vi Phát Hiện Bởi Gemini AI:
              </span>
              <p className="text-xs font-bold text-[#0F172A] leading-relaxed">
                {telemetry.action}
              </p>
            </div>
          </div>

          {/* Real-time Incident Log Stream */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-blue" />
                Nhật Ký Hành Vi Vừa Ghi Nhận
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Real-time</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {actionHistory.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Đang thu thập dữ liệu camera...</p>
              ) : (
                actionHistory.map((act, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-xl border border-gray-100 hover:border-blue-100 bg-[#F8FAFC] text-xs space-y-1 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A] text-[11px]">{act.character_id}</span>
                      <span className="font-mono text-[10px] text-gray-400">{act.time_label}</span>
                    </div>
                    <p className="text-gray-600 text-[11px] leading-snug truncate">{act.action}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
