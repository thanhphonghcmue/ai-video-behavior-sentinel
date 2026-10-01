'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  UploadCloud, 
  Film, 
  Camera, 
  Sparkles, 
  Clock, 
  Filter, 
  AlertTriangle, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  ChevronRight, 
  Bot, 
  Maximize2,
  Users,
  Eye,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface TimeInterval {
  start_time: number;
  end_time: number;
  time_label?: string;
  action_description: string;
  risk_score: number;
  risk_level: string;
  is_danger?: boolean;
  danger_summary?: string;
}

export interface SubjectTrack {
  target_id: string;
  subject_class?: string;
  class?: string;
  bounding_box_normalized: number[]; // [ymin, xmin, ymax, xmax] 0-1000
  time_intervals: TimeInterval[];
}

export interface VideoActionEvent {
  id: string;
  event_id?: string;
  character_id: string;
  target_id: string;
  subject_class?: string;
  start_time: number;
  end_time: number;
  time_label: string;
  timestamp_display?: string;
  action: string;
  action_description?: string;
  risk_score: number;
  risk_level: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  is_danger: boolean;
  danger_notes?: string;
  danger_summary?: string;
  bounding_box_normalized?: number[];
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  time: string;
}

export default function VideoAnalysisDashboardPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(28.0);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Video Source & Upload
  const [videoSourceUrl, setVideoSourceUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('sample_surveillance.mp4');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [aiModelUsed, setAiModelUsed] = useState<string>('Gemini 2.5 Flash');

  // Multi-Subject & Event States
  const [subjects, setSubjects] = useState<SubjectTrack[]>([
    {
      target_id: 'Target_01',
      subject_class: 'Person',
      bounding_box_normalized: [180, 160, 680, 360],
      time_intervals: [
        {
          start_time: 0.0,
          end_time: 14.0,
          time_label: '00:00 - 00:14',
          action_description: 'Chủ thể di chuyển đều bước dọc lối đi quan sát không gian xung quanh',
          risk_score: 18,
          risk_level: 'LOW',
          is_danger: false,
        }
      ]
    },
    {
      target_id: 'Target_02',
      subject_class: 'Motorbike',
      bounding_box_normalized: [240, 420, 640, 640],
      time_intervals: [
        {
          start_time: 8.0,
          end_time: 25.0,
          time_label: '00:08 - 00:25',
          action_description: 'Phương tiện lưu thông cùng chiều, duy trì cự ly an toàn chuẩn quy chuẩn',
          risk_score: 25,
          risk_level: 'LOW',
          is_danger: false,
        }
      ]
    },
    {
      target_id: 'Target_03',
      subject_class: 'Pedestrian',
      bounding_box_normalized: [150, 680, 580, 860],
      time_intervals: [
        {
          start_time: 0.0,
          end_time: 10.0,
          time_label: '00:00 - 00:10',
          action_description: 'Người đi bộ sát lề an toàn, chú ý quan sát đèn tín hiệu',
          risk_score: 15,
          risk_level: 'LOW',
          is_danger: false,
        },
        {
          start_time: 18.0,
          end_time: 28.0,
          time_label: '00:18 - 00:28',
          action_description: 'Dừng chân tạm thời tại điểm chờ vạch qua đường',
          risk_score: 20,
          risk_level: 'LOW',
          is_danger: false,
        }
      ]
    }
  ]);

  const [events, setEvents] = useState<VideoActionEvent[]>([
    {
      id: 'evt_1',
      character_id: 'Target_01',
      target_id: 'Target_01',
      subject_class: 'Person',
      start_time: 0.0,
      end_time: 14.0,
      time_label: '00:00 - 00:14',
      action: 'Chủ thể di chuyển đều bước dọc lối đi quan sát không gian xung quanh',
      risk_score: 18,
      risk_level: 'NORMAL',
      is_danger: false,
      bounding_box_normalized: [180, 160, 680, 360]
    },
    {
      id: 'evt_2',
      character_id: 'Target_03',
      target_id: 'Target_03',
      subject_class: 'Pedestrian',
      start_time: 0.0,
      end_time: 10.0,
      time_label: '00:00 - 00:10',
      action: 'Người đi bộ sát lề an toàn, chú ý quan sát đèn tín hiệu',
      risk_score: 15,
      risk_level: 'NORMAL',
      is_danger: false,
      bounding_box_normalized: [150, 680, 580, 860]
    },
    {
      id: 'evt_3',
      character_id: 'Target_02',
      target_id: 'Target_02',
      subject_class: 'Motorbike',
      start_time: 8.0,
      end_time: 25.0,
      time_label: '00:08 - 00:25',
      action: 'Phương tiện lưu thông cùng chiều, duy trì cự ly an toàn chuẩn quy chuẩn',
      risk_score: 25,
      risk_level: 'NORMAL',
      is_danger: false,
      bounding_box_normalized: [240, 420, 640, 640]
    },
    {
      id: 'evt_4',
      character_id: 'Target_03',
      target_id: 'Target_03',
      subject_class: 'Pedestrian',
      start_time: 18.0,
      end_time: 28.0,
      time_label: '00:18 - 00:28',
      action: 'Dừng chân tạm thời tại điểm chờ vạch qua đường',
      risk_score: 20,
      risk_level: 'NORMAL',
      is_danger: false,
      bounding_box_normalized: [150, 680, 580, 860]
    }
  ]);

  // Filters & Active Selection
  const [selectedTarget, setSelectedTarget] = useState<string>('ALL');
  const [dangerOnly, setDangerOnly] = useState<boolean>(false);
  const [activeEventId, setActiveEventId] = useState<string>('evt_1');
  const [activeTargetId, setActiveTargetId] = useState<string>('Target_01');

  // Copilot mini chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      role: 'assistant',
      text: 'Xin chào! Tôi là AI Copilot an ninh. Video đã được phân tích đa đối tượng với bounding box chuẩn hóa. Bạn có thể bấm vào từng nhân vật hoặc dòng thời gian để định vị nhanh.',
      time: 'Vừa xong'
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isCopilotThinking, setIsCopilotThinking] = useState<boolean>(false);

  // Synchronize Playback Time
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Auto-detect active event
    const activeEvt = events.find(e => cur >= e.start_time && cur <= e.end_time);
    if (activeEvt && activeEvt.id !== activeEventId) {
      setActiveEventId(activeEvt.id);
      setActiveTargetId(activeEvt.target_id || activeEvt.character_id);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Jump to specific event
  const jumpToEvent = useCallback((event: VideoActionEvent) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = event.start_time;
    setCurrentTime(event.start_time);
    setActiveEventId(event.id);
    setActiveTargetId(event.target_id || event.character_id);
    if (!isPlaying) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  // Jump to specific target
  const jumpToTarget = useCallback((targetId: string) => {
    setActiveTargetId(targetId);
    const firstEvt = events.find(e => (e.target_id === targetId || e.character_id === targetId));
    if (firstEvt) {
      jumpToEvent(firstEvt);
    }
  }, [events, jumpToEvent]);

  // Handle Video Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      if (data.video_url) {
        setVideoSourceUrl(data.video_url);
      }
      if (data.duration) {
        setDuration(data.duration);
      }
      if (data.ai_model_used) {
        setAiModelUsed(data.ai_model_used);
      }

      if (data.subjects && data.subjects.length > 0) {
        setSubjects(data.subjects);
      }

      if (data.events && data.events.length > 0) {
        setEvents(data.events);
        setActiveEventId(data.events[0].id || 'evt_1');
        setActiveTargetId(data.events[0].target_id || 'Target_01');
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          text: `Đã phân tích xong video "${file.name}" bằng ${data.ai_model_used}. Nhận diện tổng cộng ${data.total_subjects_detected || data.characters_detected?.length || 0} đối tượng với ${data.events?.length || 0} phân đoạn hành vi động.`,
          time: 'Vừa xong'
        }
      ]);
    } catch (err) {
      console.error(err);
      alert('Tải video lên backend thất bại. Vui lòng kiểm tra cổng 8000.');
    } finally {
      setIsUploading(false);
    }
  };

  // Chat Copilot Submission
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isCopilotThinking) return;

    const query = chatInput.trim();
    setChatInput('');
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: query,
      time: 'Vừa xong'
    };
    setChatMessages(prev => [...prev, userMsg]);
    setIsCopilotThinking(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            role: 'assistant',
            text: data.answer || 'Đã ghi nhận yêu cầu an ninh.',
            time: 'Vừa xong'
          }
        ]);
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          role: 'assistant',
          text: `AI Copilot ghi nhận: ${query}. Hệ thống đang giám sát các đối tượng ${distinctTargetIds.join(', ')} trong video.`,
          time: 'Vừa xong'
        }
      ]);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  // Distinct targets for filter
  const distinctTargetIds = Array.from(new Set(events.map(e => e.target_id || e.character_id)));

  // Filtered Events
  const filteredEvents = events.filter(e => {
    const tgt = e.target_id || e.character_id;
    if (selectedTarget !== 'ALL' && tgt !== selectedTarget) return false;
    if (dangerOnly && !e.is_danger && e.risk_score < 70) return false;
    return true;
  });

  // Calculate current active event & risk
  const currentActiveEvent = events.find(e => e.id === activeEventId) || events[0];
  const isCurrentDangerous = (currentActiveEvent?.risk_score ?? 0) >= 70;

  return (
    <div className="space-y-5 max-w-[1720px] mx-auto pb-12">
      {/* Top Banner & File Upload Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-blue">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#0F172A]">
                Phân Tích Video Upload & Dòng Thời Gian Đa Đối Tượng
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-brand-blue font-mono">
                {aiModelUsed}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Nhận diện ranh giới hành vi tự nhiên (Dynamic Timestamps) & Bounding Box chuẩn hóa 0-1000 cho mọi nhân vật
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? 'AI Đang Quét Video...' : 'Tải Lên Video Mới (MP4 / WebM)'}</span>
          </button>
        </div>
      </div>

      {/* Main Split-Screen Grid: 60% Left / 40% Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN (60%): VIDEO PLAYER WITH CANVAS BOUNDING BOXES OVERLAY */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
            {/* Video Header bar */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                <Eye className="w-4 h-4 text-brand-blue" />
                <span className="truncate max-w-[280px]">{uploadedFileName}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500 font-mono text-[11px]">
                <span>
                  {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
                  {Math.floor(currentTime % 60).toString().padStart(2, '0')} / 
                  {Math.floor(duration / 60).toString().padStart(2, '0')}:
                  {Math.floor(duration % 60).toString().padStart(2, '0')}
                </span>
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold">
                  {distinctTargetIds.length} Chủ thể
                </span>
              </div>
            </div>

            {/* Video Player + Bounding Box Canvas Container */}
            <div className="relative bg-slate-950 aspect-video flex items-center justify-center overflow-hidden group select-none">
              <video
                ref={videoRef}
                src={videoSourceUrl || undefined}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                muted={isMuted}
                playsInline
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
              >
                {/* Fallback sample if no url */}
                <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
              </video>

              {/* DYNAMIC BOUNDING BOX OVERLAYS FOR ALL DETECTED TARGETS */}
              {/* Formula: top: ymin/10 %, left: xmin/10 %, height: (ymax-ymin)/10 %, width: (xmax-xmin)/10 % */}
              {subjects.map((subj) => {
                const bbox = subj.bounding_box_normalized || [150, 200, 750, 450];
                const ymin = bbox[0] ?? 150;
                const xmin = bbox[1] ?? 200;
                const ymax = bbox[2] ?? 750;
                const xmax = bbox[3] ?? 450;

                const topPct = (ymin / 10).toFixed(1);
                const leftPct = (xmin / 10).toFixed(1);
                const heightPct = Math.max(8, ((ymax - ymin) / 10)).toFixed(1);
                const widthPct = Math.max(8, ((xmax - xmin) / 10)).toFixed(1);

                const isActive = (subj.target_id === activeTargetId);
                const activeInterval = subj.time_intervals.find(
                  iv => currentTime >= iv.start_time && currentTime <= iv.end_time
                );
                const isIntervalActive = Boolean(activeInterval);
                const isDanger = (activeInterval?.risk_score ?? 0) >= 70;

                return (
                  <div
                    key={subj.target_id}
                    onClick={() => jumpToTarget(subj.target_id)}
                    style={{
                      top: `${topPct}%`,
                      left: `${leftPct}%`,
                      height: `${heightPct}%`,
                      width: `${widthPct}%`,
                    }}
                    className={`absolute border-2 transition-all duration-200 cursor-pointer pointer-events-auto rounded-lg ${
                      isDanger
                        ? 'border-[#EA580C] bg-orange-500/15 shadow-lg shadow-orange-500/30'
                        : isActive
                        ? 'border-[#2563EB] bg-blue-500/15 ring-2 ring-blue-400/50'
                        : isIntervalActive
                        ? 'border-emerald-400 bg-emerald-500/10'
                        : 'border-white/40 hover:border-blue-300'
                    }`}
                  >
                    {/* Bounding Box Label Badge */}
                    <div className="absolute -top-7 left-0 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-md flex items-center gap-1 ${
                        isDanger
                          ? 'bg-[#EA580C] text-white'
                          : isActive
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-slate-900/90 text-white'
                      }`}>
                        <span>{subj.target_id}</span>
                        <span className="text-[9px] opacity-75">({subj.subject_class || 'Person'})</span>
                        {activeInterval && (
                          <span className="font-mono text-[9px] bg-black/30 px-1 rounded">
                            {activeInterval.risk_score}%
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Corner Reticle Accents */}
                    <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-inherit"></span>
                    <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-inherit"></span>
                    <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-inherit"></span>
                    <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-inherit"></span>
                  </div>
                );
              })}

              {/* Big Play Button Overlay on Hover/Paused */}
              {!isPlaying && (
                <div 
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-xl transition-transform hover:scale-110">
                    <Play className="w-7 h-7 ml-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Playback Controls & Timeline Slider */}
            <div className="p-4 bg-white space-y-3">
              {/* Scrubbing Bar */}
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value);
                    if (videoRef.current) videoRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-brand-blue flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime = 0;
                      setCurrentTime(0);
                    }}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
                    title="Phát lại từ đầu"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-xs font-mono text-gray-600">
                    {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
                    {Math.floor(currentTime % 60).toString().padStart(2, '0')} / 
                    {Math.floor(duration / 60).toString().padStart(2, '0')}:
                    {Math.floor(duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Target jump badges */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <span className="text-gray-400 font-semibold text-[11px]">Định vị nhanh:</span>
                  {distinctTargetIds.map((tid) => (
                    <button
                      key={tid}
                      onClick={() => jumpToTarget(tid)}
                      className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        activeTargetId === tid
                          ? 'bg-[#2563EB] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-brand-blue'
                      }`}
                    >
                      {tid}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SOP Emergency Incident Recommendation Panel (if active event is risky) */}
          {isCurrentDangerous && (
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-[#EA580C] space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-sm text-[#EA580C]">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>CẢNH BÁO NGUY CƠ CAO ({currentActiveEvent.risk_score}%) TẠI {currentActiveEvent.time_label}</span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {currentActiveEvent.action_description || currentActiveEvent.action}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => alert("Đã lưu clip bằng chứng và gửi thông báo khẩn cấp đến phòng an ninh.")}
                  className="px-3 py-1.5 rounded-xl bg-[#EA580C] hover:bg-orange-700 text-white font-bold transition-all shadow-xs"
                >
                  Lưu Bằng Chứng & Điều Đội Cơ Động
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (40%): DYNAMIC TIMELINE & ACTION EVENT SLICING */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col h-[680px]">
            {/* Header & Filter Controls */}
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A]">
                  <Clock className="w-4 h-4 text-brand-blue" />
                  <span>Dòng Thời Gian Hành Vi Tự Nhiên</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue border border-blue-200">
                  {filteredEvents.length} Sự Kiện
                </span>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center justify-between gap-2 text-xs">
                {/* Subject Selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <button
                    onClick={() => setSelectedTarget('ALL')}
                    className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all ${
                      selectedTarget === 'ALL'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tất cả
                  </button>
                  {distinctTargetIds.map((tid) => (
                    <button
                      key={tid}
                      onClick={() => setSelectedTarget(tid)}
                      className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all whitespace-nowrap ${
                        selectedTarget === tid
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tid}
                    </button>
                  ))}
                </div>

                {/* Threat Only Toggle */}
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={dangerOnly}
                    onChange={(e) => setDangerOnly(e.target.checked)}
                    className="rounded border-gray-300 text-brand-blue focus:ring-0"
                  />
                  <span>Nguy cơ cao</span>
                </label>
              </div>
            </div>

            {/* Scrollable Events List (Synchronized with Playhead) */}
            <div 
              ref={timelineContainerRef}
              className="flex-1 p-4 overflow-y-auto space-y-3"
            >
              {filteredEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-6 space-y-2">
                  <Filter className="w-8 h-8 text-gray-300" />
                  <p className="text-xs font-semibold">Không có sự kiện nào phù hợp với bộ lọc</p>
                </div>
              ) : (
                filteredEvents.map((evt) => {
                  const isActive = (evt.id === activeEventId);
                  const isDanger = evt.risk_score >= 70;
                  const isWarning = evt.risk_score >= 40 && evt.risk_score < 70;

                  return (
                    <div
                      key={evt.id}
                      ref={(el) => { cardRefs.current[evt.id] = el; }}
                      onClick={() => jumpToEvent(evt)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                        isActive
                          ? 'border-[#2563EB] bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                          : 'border-gray-200 hover:border-blue-200 bg-white hover:bg-gray-50/70'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#0F172A]">
                            {evt.target_id || evt.character_id}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                            {evt.subject_class || 'Person'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-gray-500">
                            {evt.time_label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isDanger
                              ? 'bg-orange-50 text-[#EA580C] border-orange-200'
                              : isWarning
                              ? 'bg-amber-50 text-[#D97706] border-amber-200'
                              : 'bg-emerald-50 text-[#059669] border-emerald-200'
                          }`}>
                            {evt.risk_score}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        {evt.action_description || evt.action}
                      </p>

                      {/* Interactive seek prompt */}
                      <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                        <span className="flex items-center gap-1 font-medium">
                          {isActive ? (
                            <span className="text-brand-blue font-bold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                              Đang xem đoạn này
                            </span>
                          ) : (
                            'Bấm để nhảy tới mốc thời gian'
                          )}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Quick Copilot Prompt Box */}
            <div className="p-3 border-t border-gray-100 bg-[#F8FAFC]">
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Hỏi AI Copilot về hành vi đối tượng trong video..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-brand-blue"
                />
                <button
                  type="submit"
                  disabled={isCopilotThinking}
                  className="px-3 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
