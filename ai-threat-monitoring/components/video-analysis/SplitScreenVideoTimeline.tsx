'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  UploadCloud, 
  FileVideo, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  User, 
  Filter, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Layers,
  ArrowUpRight,
  Flame,
  AlertOctagon,
  RefreshCw
} from 'lucide-react';

export interface VideoActionEvent {
  id?: string;
  event_id: string;
  character_id?: string;
  target_id: string;
  start_time: float;
  end_time: float;
  time_label?: string;
  timestamp_display: string;
  action?: string;
  action_description: string;
  risk_score: number;
  risk_level: 'NORMAL' | 'WARNING' | 'CRITICAL';
  is_danger: boolean;
  danger_summary?: string;
}

type float = number;

export const SplitScreenVideoTimeline: React.FC = () => {
  // Video Player state managed via useRef
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventCardsContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(32.5);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.8);

  // Upload & AI Analysis States
  const [videoSourceUrl, setVideoSourceUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('sample_security_footage.mp4');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [aiModelUsed, setAiModelUsed] = useState<string>('Google Gemini 2.5 Flash');
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Target & Danger Filters
  const [selectedTarget, setSelectedTarget] = useState<string>('ALL');
  const [dangerOnly, setDangerOnly] = useState<boolean>(false);
  const [activeEventId, setActiveEventId] = useState<string>('evt_001');

  // Events Feed Data (Initial High-Quality Preloaded Surveillance Case)
  const [events, setEvents] = useState<VideoActionEvent[]>([
    {
      event_id: 'evt_001',
      start_time: 2.4,
      end_time: 18.0,
      timestamp_display: '00:02 - 00:18',
      target_id: 'Person_A',
      action_description: 'Pacing back and forth near the server room door and inspecting security camera angles',
      risk_score: 35,
      risk_level: 'WARNING',
      is_danger: false,
      danger_summary: ''
    },
    {
      event_id: 'evt_002',
      start_time: 19.1,
      end_time: 32.5,
      timestamp_display: '00:19 - 00:32',
      target_id: 'Person_B',
      action_description: 'Attempting to climb over the security perimeter fence and tamper with the lock latch',
      risk_score: 95,
      risk_level: 'CRITICAL',
      is_danger: true,
      danger_summary: 'Intrusion detected: fence breaching attempt with high kinetic acceleration.'
    },
    {
      event_id: 'evt_003',
      start_time: 33.0,
      end_time: 46.2,
      timestamp_display: '00:33 - 00:46',
      target_id: 'Person_A',
      action_description: 'Running rapidly towards the emergency exit corridor after triggering alarm sensor',
      risk_score: 82,
      risk_level: 'CRITICAL',
      is_danger: true,
      danger_summary: 'Evasion behavior: suspect fleeing through unauthorized exit.'
    }
  ]);

  // Extract distinct target IDs for filtering (supports both character_id and target_id)
  const distinctTargets = Array.from(new Set(events.map((e) => e.character_id || e.target_id || 'Person_A')));

  // Playhead Sync: Listen to video timeupdate
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);

    // Find the active event whose time range encapsulates current playback time
    const matched = events.find((ev) => t >= ev.start_time && t <= ev.end_time);
    const matchedId = matched ? (matched.event_id || matched.id) : null;
    if (matchedId && matchedId !== activeEventId) {
      setActiveEventId(matchedId);

      // Auto-scroll the active card into view
      const cardEl = cardRefs.current[matchedId];
      if (cardEl && eventCardsContainerRef.current) {
        cardEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [events, activeEventId]);

  // Two-Way Interactive Sync: Seek on Click
  const handleJumpToEvent = (event: VideoActionEvent) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = event.start_time;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
    const eventId = event.event_id || event.id || '';
    setActiveEventId(eventId);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  // Upload Video File to Backend /api/upload-video
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(`Đang tải lên ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress('Đang gửi video đến Google AI Studio qua File API (Gemini 2.5 Flash)...');
      const res = await fetch('http://localhost:8000/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      setUploadedFileName(data.filename || file.name);
      setVideoSourceUrl(data.video_url);
      setDuration(data.duration || 30);
      setAiModelUsed(data.ai_model_used || 'Gemini 2.5 Flash');

      if (data.events && Array.isArray(data.events) && data.events.length > 0) {
        setEvents(data.events);
        const firstId = data.events[0].event_id || data.events[0].id || 'evt_001';
        setActiveEventId(firstId);
      }

      setUploadProgress('');
      setIsUploading(false);

      // Reset and play uploaded video
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.currentTime = 0;
      }
    } catch (err) {
      console.warn('Backend upload failed, generating client fallback preview:', err);
      // Fallback: create object URL so user can still preview video locally
      const localUrl = URL.createObjectURL(file);
      setVideoSourceUrl(localUrl);
      setUploadedFileName(file.name);
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const filteredEvents = events.filter((ev) => {
    const targetName = ev.character_id || ev.target_id || 'Person_A';
    if (selectedTarget !== 'ALL' && targetName !== selectedTarget) return false;
    if (dangerOnly && !ev.is_danger) return false;
    return true;
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
      {/* 1. Header Toolbar */}
      <div className="px-6 py-4 border-b border-[#E5E7EB] bg-gradient-to-r from-gray-50 via-white to-gray-50 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-brand-blue tracking-wider border border-blue-200">
              MODULE 1
            </span>
            <h2 className="text-base font-black text-gray-900 tracking-tight">
              Phân Tích Video Upload & Timeline Slicing Đa Phương Thức
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Dynamic Action Slicing (Gemini 1.5 Pro File API)
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Tự động phát hiện ranh giới hành vi tự nhiên (start_time đến end_time) theo từng giây thực tế, đồng bộ 2 chiều với trình phát video.
          </p>
        </div>

        {/* Upload Trigger Button */}
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/avi,video/quicktime"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-all flex items-center gap-2 shadow-sm shadow-blue-500/25 active:scale-95 disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? 'Đang Tải & Phân Tích...' : 'Tải Video Lên (MP4/WebM)'}</span>
          </button>
        </div>
      </div>

      {/* Upload Progress Notification */}
      {isUploading && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 flex items-center justify-between text-xs text-brand-blue animate-pulse">
          <div className="flex items-center gap-2 font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{uploadProgress || 'Đang kết nối Google AI Studio File API...'}</span>
          </div>
          <span className="font-mono text-[11px] font-bold">Xử lý đám mây...</span>
        </div>
      )}

      {/* 2. SPLIT-SCREEN WORKSPACE (50% LEFT - 50% RIGHT) */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT PANEL (50% Width): HTML5 Video Player & Cyber HUD    */}
        {/* ========================================================= */}
        <div className="w-1/2 border-r border-[#E5E7EB] bg-black flex flex-col justify-between relative select-none">
          {/* Main Video Viewport */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            {videoSourceUrl ? (
              <video
                ref={videoRef}
                src={videoSourceUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration);
                }}
                onEnded={() => setIsPlaying(false)}
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              /* High-tech Canvas Simulation when no video uploaded yet */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-8 text-center bg-radial from-slate-900 via-gray-950 to-black">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-brand-blue mb-3">
                  <FileVideo className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-white text-base font-bold">
                  Sẵn Sàng Tiếp Nhận Tệp Video Giám Sát
                </h3>
                <p className="text-gray-400 text-xs max-w-sm mt-1 mb-4">
                  Kéo thả tệp MP4 hoặc WebM vào đây, hệ thống sẽ tự động tải lên Google AI Studio và phân tích từng phân đoạn hành động.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-all"
                  >
                    Chọn Video Từ Máy Tính
                  </button>
                  <button
                    onClick={() => {
                      // Load built-in security demo stream
                      setVideoSourceUrl('http://localhost:8000/video_feed');
                      setUploadedFileName('live_surveillance_feed.mp4');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/10 text-gray-300 text-xs font-bold hover:bg-white/20 transition-all border border-white/20"
                  >
                    Xem Luồng Giám Sát Trực Tiếp
                  </button>
                </div>
              </div>
            )}

            {/* Over-video HUD Watermark */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-ping" />
                <span>SENTINEL VIDEO ENGINE</span>
              </span>
              <span className="px-2 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-gray-300 text-[10px] font-mono">
                {uploadedFileName}
              </span>
            </div>

            {/* Active Action Toast Overlay */}
            {activeEventId && (
              <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
                {(() => {
                  const ev = events.find((e) => (e.event_id || e.id) === activeEventId);
                  if (!ev) return null;
                  const targetName = ev.character_id || ev.target_id || 'Mục tiêu';
                  const timeDisplay = ev.timestamp_display || ev.time_label || `${ev.start_time}s - ${ev.end_time}s`;
                  const actionDesc = ev.action_description || ev.action || '';
                  return (
                    <div
                      className={`p-3 rounded-2xl backdrop-blur-md border transition-all ${
                        ev.is_danger
                          ? 'bg-orange-950/80 border-orange-500/60 text-white'
                          : 'bg-black/80 border-white/20 text-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${ev.is_danger ? 'bg-[#EA580C] animate-ping' : 'bg-emerald-400'}`} />
                          <span>Mục tiêu: {targetName}</span>
                          <span className="font-mono text-gray-400">({timeDisplay})</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${
                          ev.risk_level === 'CRITICAL' ? 'bg-[#EA580C] text-white' : 'bg-amber-500/80 text-white'
                        }`}>
                          {ev.risk_level} ({ev.risk_score}%)
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1 line-clamp-1">
                        {actionDesc}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Video Playback Controls Bar */}
          <div className="bg-gray-950 p-4 border-t border-gray-800 space-y-2.5">
            {/* Timeline Seekbar with Danger Markers */}
            <div className="relative w-full">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              {/* Event Markers on Timeline */}
              <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none flex">
                {events.map((ev) => {
                  const evId = ev.event_id || ev.id || `${ev.start_time}`;
                  const leftPercent = (ev.start_time / (duration || 1)) * 100;
                  const widthPercent = ((ev.end_time - ev.start_time) / (duration || 1)) * 100;
                  const targetName = ev.character_id || ev.target_id || 'Mục tiêu';
                  const timeDisplay = ev.timestamp_display || ev.time_label || '';
                  return (
                    <div
                      key={evId}
                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                      className={`absolute top-0 h-2 rounded-xs opacity-60 ${
                        ev.is_danger ? 'bg-[#EA580C] animate-pulse' : 'bg-amber-400'
                      }`}
                      title={`${targetName}: ${timeDisplay}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bottom Button Row */}
            <div className="flex items-center justify-between text-xs text-gray-300">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center hover:bg-[#1D4ED8] transition-colors shadow-sm"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      setCurrentTime(0);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
                  title="Tua về đầu"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="font-mono text-xs text-gray-400">
                  <span className="text-white font-bold">{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = !isMuted;
                      setIsMuted(!isMuted);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 font-mono text-[10px]">
                  {aiModelUsed}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL (50% Width): Scrollable Chronological Action Feed */}
        {/* ========================================================= */}
        <div className="w-1/2 flex flex-col bg-gray-50/70 h-full">
          {/* Feed Header with Target & Risk Filter Pills */}
          <div className="p-4 border-b border-[#E5E7EB] bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-blue" />
                <h3 className="text-xs font-black uppercase text-gray-900 tracking-wider">
                  Dòng Sự Kiện Hành Động (Action Feed)
                </h3>
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {filteredEvents.length} sự kiện phát hiện
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                <Filter className="w-3 h-3" /> Đối tượng:
              </span>
              <button
                onClick={() => setSelectedTarget('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedTarget === 'ALL'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tất cả
              </button>
              {distinctTargets.map((target) => (
                <button
                  key={target}
                  onClick={() => setSelectedTarget(target)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedTarget === target
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {target}
                </button>
              ))}

              <button
                onClick={() => setDangerOnly(!dangerOnly)}
                className={`ml-auto px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  dangerOnly
                    ? 'bg-[#EA580C] text-white shadow-xs'
                    : 'bg-orange-50 text-[#EA580C] border border-orange-200 hover:bg-orange-100'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Chỉ Nguy Hiểm</span>
              </button>
            </div>
          </div>

          {/* Scrollable Event Cards Container */}
          <div
            ref={eventCardsContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-3"
          >
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                Không tìm thấy sự kiện nào khớp với bộ lọc hiện thời.
              </div>
            ) : (
              filteredEvents.map((ev) => {
                const evId = ev.event_id || ev.id || `${ev.start_time}`;
                const isActive = activeEventId === evId;
                const isCritical = ev.risk_level === 'CRITICAL' || ev.is_danger;
                const durationLength = roundNumber(ev.end_time - ev.start_time, 1);
                const targetName = ev.character_id || ev.target_id || 'Person_A';
                const timeDisplay = ev.timestamp_display || ev.time_label || `${ev.start_time}s - ${ev.end_time}s`;
                const actionDesc = ev.action_description || ev.action || '';

                return (
                  <div
                    key={evId}
                    ref={(el) => { cardRefs.current[evId] = el; }}
                    onClick={() => handleJumpToEvent(ev)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group relative ${
                      isActive
                        ? 'bg-white border-[#2563EB] shadow-lg ring-2 ring-blue-500/20 scale-[1.01]'
                        : isCritical
                        ? 'bg-white hover:bg-orange-50/40 border-orange-200 hover:border-[#EA580C]'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    {/* Active Pulsing Indicator */}
                    {isActive && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-extrabold text-brand-blue uppercase">
                        <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
                        <span>Đang Phát</span>
                      </div>
                    )}

                    {/* Card Header: Target Badge + Timestamp */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black tracking-wide uppercase ${
                        targetName.includes('B')
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {targetName}
                      </span>

                      <span className="text-xs font-mono font-bold text-gray-700 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-gray-500" />
                        {timeDisplay}
                      </span>

                      <span className="text-[10px] text-gray-400 font-mono">
                        ({durationLength}s)
                      </span>

                      {/* Threat Score Badge */}
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        ev.risk_level === 'CRITICAL'
                          ? 'bg-orange-50 text-[#EA580C] border-orange-200'
                          : ev.risk_level === 'WARNING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {ev.risk_score}% ({ev.risk_level})
                      </span>
                    </div>

                    {/* Action Description */}
                    <p className="text-xs font-semibold text-gray-900 group-hover:text-brand-blue transition-colors leading-relaxed">
                      {actionDesc}
                    </p>

                    {/* Danger Alert Summary Banner */}
                    {ev.is_danger && ev.danger_summary && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-2 text-[11px] text-[#EA580C] font-medium">
                        <AlertOctagon className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#EA580C]" />
                        <span>{ev.danger_summary}</span>
                      </div>
                    )}

                    {/* Footer Jump Prompt */}
                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 group-hover:text-brand-blue transition-colors">
                      <span className="font-mono text-[10px]">
                        ID: {evId}
                      </span>
                      <span className="flex items-center gap-1 font-bold">
                        <span>Nhảy tới mốc {roundNumber(ev.start_time, 1)}s</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function roundNumber(num: number, dec: number = 1): number {
  const factor = Math.pow(10, dec);
  return Math.round(num * factor) / factor;
}
