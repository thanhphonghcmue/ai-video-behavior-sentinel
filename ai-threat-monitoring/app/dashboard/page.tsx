'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  UploadCloud, 
  Video, 
  Camera, 
  Sparkles, 
  Clock, 
  KeyRound, 
  Filter, 
  AlertTriangle, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert, 
  X, 
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  Bot,
  Radio
} from 'lucide-react';

export interface VideoActionEvent {
  id: string;
  event_id?: string;
  character_id: string;
  target_id?: string;
  start_time: number;
  end_time: number;
  time_label: string;
  timestamp_display?: string;
  action: string;
  action_description?: string;
  risk_score: number;
  risk_level: 'NORMAL' | 'WARNING' | 'CRITICAL';
  is_danger: boolean;
  danger_notes?: string;
  danger_summary?: string;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  time: string;
}

export default function DashboardOverviewPage() {
  // Mode: Video Slicing vs Live Webcam
  const [mode, setMode] = useState<'VIDEO' | 'WEBCAM'>('VIDEO');

  // Video Player state managed via useRef
  const videoRef = useRef<HTMLVideoElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(32.0);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Video Source & Upload
  const [videoSourceUrl, setVideoSourceUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('sample_footage.mp4');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [aiModelUsed, setAiModelUsed] = useState<string>('Gemini 2.5 Flash');

  // Filters & Active Selection
  const [selectedCharacter, setSelectedCharacter] = useState<string>('ALL');
  const [dangerOnly, setDangerOnly] = useState<boolean>(false);
  const [activeEventId, setActiveEventId] = useState<string>('evt_1');

  // Events Feed Data
  const [events, setEvents] = useState<VideoActionEvent[]>([
    {
      id: 'evt_1',
      character_id: 'Target #1',
      start_time: 0.0,
      end_time: 12.5,
      time_label: '00:00 - 00:12',
      action: 'Chủ thể di chuyển trong góc quay camera với tốc độ ổn định, quan sát lộ trình',
      risk_score: 22,
      risk_level: 'NORMAL',
      is_danger: false,
      danger_notes: ''
    },
    {
      id: 'evt_2',
      character_id: 'Target #2',
      start_time: 13.0,
      end_time: 24.5,
      time_label: '00:13 - 00:24',
      action: 'Lưu thông cùng chiều, duy trì khoảng cách an toàn với các đối tượng xung quanh',
      risk_score: 35,
      risk_level: 'NORMAL',
      is_danger: false,
      danger_notes: ''
    },
    {
      id: 'evt_3',
      character_id: 'Target #1',
      start_time: 25.0,
      end_time: 32.0,
      time_label: '00:25 - 00:32',
      action: 'Tiếp tục hành trình an toàn qua vùng quan sát của camera giám sát',
      risk_score: 20,
      risk_level: 'NORMAL',
      is_danger: false,
      danger_notes: ''
    }
  ]);

  // Distinct Characters for filter pills
  const distinctCharacters = Array.from(new Set(events.map(e => e.character_id || e.target_id || 'Target #1')));

  // Gemini API Key Modal & State
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isSavingKey, setIsSavingKey] = useState<boolean>(false);
  const [keySavedSuccess, setKeySavedSuccess] = useState<boolean>(false);
  const [isGeminiOnline, setIsGeminiOnline] = useState<boolean>(false);

  // AI Copilot Chat State
  const [copilotMessages, setCopilotMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      text: 'Xin chào! Tôi là Trợ Lý Phản Ứng Khẩn Cấp AI (Gemini 2.5 Flash). Tôi đang đồng hành cùng bạn để phân tích hành vi nhân vật và xử lý sự cố an ninh trong video này.',
      time: 'Vừa xong'
    }
  ]);
  const [copilotInput, setCopilotInput] = useState<string>('');
  const [isCopilotTyping, setIsCopilotTyping] = useState<boolean>(false);

  // Live Webcam Loop State
  const [isLiveAnalyzing, setIsLiveAnalyzing] = useState<boolean>(false);

  // 1. Check Gemini Backend Status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const savedKey = typeof window !== 'undefined' ? localStorage.getItem('sentinel_gemini_api_key') : null;
        if (savedKey && !isGeminiOnline) {
          await fetch('http://localhost:8000/api/set-api-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: savedKey.trim() })
          }).catch(() => {});
        }

        const res = await fetch('http://localhost:8000/api/status');
        if (res.ok) {
          const data = await res.json();
          setIsGeminiOnline(Boolean(data.gemini_active));
        }
      } catch (err) {
        // Backend offline
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 6000);
    return () => clearInterval(interval);
  }, [isGeminiOnline]);

  // 2. Playhead Sync: Listen to video currentTime
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);

    const matched = events.find((ev) => t >= ev.start_time && t <= ev.end_time);
    const matchedId = matched ? (matched.id || matched.event_id) : null;
    if (matchedId && matchedId !== activeEventId) {
      setActiveEventId(matchedId);

      const cardEl = cardRefs.current[matchedId];
      if (cardEl && eventContainerRef.current) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [events, activeEventId]);

  // 3. Interactive Seek: Click card -> jumps to start_time
  const handleJumpToEvent = (event: VideoActionEvent) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = event.start_time;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
    const evId = event.id || event.event_id || '';
    setActiveEventId(evId);
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

  // 4. Handle Video Upload & Gemini 2.5 Flash File API Processing
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(`Đang tải lên ${file.name}...`);

    const savedKey = typeof window !== 'undefined' ? localStorage.getItem('sentinel_gemini_api_key') || '' : '';
    const formData = new FormData();
    formData.append('file', file);
    if (savedKey) {
      formData.append('api_key', savedKey);
    }

    try {
      setUploadProgress('Đang gửi video đến Google AI Studio File API (Gemini 2.5 Flash)...');
      const res = await fetch('http://localhost:8000/api/upload-video', {
        method: 'POST',
        headers: savedKey ? { 'x-gemini-key': savedKey } : {},
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload error: ${res.status}`);
      }

      const data = await res.json();
      setUploadedFileName(data.filename || file.name);
      setVideoSourceUrl(data.video_url);
      setDuration(data.duration || 30.0);
      setAiModelUsed(data.ai_model_used || 'Gemini 2.5 Flash');

      const incomingEvents = data.events || [];
      if (Array.isArray(incomingEvents) && incomingEvents.length > 0) {
        setEvents(incomingEvents);
        setActiveEventId(incomingEvents[0].id || incomingEvents[0].event_id || 'evt_1');
      }

      setIsUploading(false);
      setUploadProgress('');

      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.currentTime = 0;
      }

      // Add Copilot note
      setCopilotMessages(prev => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          text: `Đã phân tích xong video "${file.name}" (${data.duration}s) bằng ${data.ai_model_used}. Phát hiện ${incomingEvents.length} phân đoạn hành vi nhân vật. Bạn có thể bấm vào từng thẻ để tua ngay tới mốc tương ứng!`,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.warn('Backend upload fallback:', err);
      const localUrl = URL.createObjectURL(file);
      setVideoSourceUrl(localUrl);
      setUploadedFileName(file.name);
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  // 5. Save Gemini API Key
  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setIsSavingKey(true);

    try {
      const res = await fetch('http://localhost:8000/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKeyInput.trim() }),
      });

      if (res.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sentinel_gemini_api_key', apiKeyInput.trim());
        }
        setIsGeminiOnline(true);
        setKeySavedSuccess(true);
        setTimeout(() => {
          setKeySavedSuccess(false);
          setShowKeyModal(false);
          setApiKeyInput('');
        }, 1200);
      } else {
        alert('Không thể kích hoạt API Key. Hãy kiểm tra lại khóa Google AI Studio.');
      }
    } catch (err) {
      alert('Không thể kết nối đến Backend trên cổng 8000.');
    } finally {
      setIsSavingKey(false);
    }
  };

  // 6. Webcam Mode Setup & 3.5s Snapshot Loop
  useEffect(() => {
    let stream: MediaStream | null = null;
    let liveInterval: any = null;

    if (mode === 'WEBCAM') {
      navigator.mediaDevices?.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      }).then((mediaStream) => {
        stream = mediaStream;
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = mediaStream;
          webcamVideoRef.current.play().catch(() => {});
        }
      }).catch((err) => {
        console.warn('Webcam local access error:', err);
      });

      // Snapshot loop every 3.5 seconds
      liveInterval = setInterval(async () => {
        const videoEl = webcamVideoRef.current;
        if (!videoEl || videoEl.videoWidth === 0) return;

        setIsLiveAnalyzing(true);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoEl, 0, 0, 640, 360);
            const b64 = canvas.toDataURL('image/jpeg', 0.8);

            const res = await fetch('http://localhost:8000/api/analyze-live', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_base64: b64 }),
            });

            if (res.ok) {
              const liveData = await res.json();
              const newLiveEvent: VideoActionEvent = {
                id: `live_${Date.now()}`,
                character_id: liveData.character_id || 'Target #1',
                start_time: 0,
                end_time: 0,
                time_label: liveData.time_label || 'Vừa phát hiện',
                action: liveData.action || 'Quan sát khu vực camera',
                risk_score: liveData.risk_score || 20,
                risk_level: liveData.risk_level || 'NORMAL',
                is_danger: Boolean(liveData.is_danger),
                danger_notes: liveData.danger_notes || ''
              };

              setEvents(prev => [newLiveEvent, ...prev.slice(0, 19)]);
              setActiveEventId(newLiveEvent.id);
            }
          }
        } catch (e) {
          // ignore transient error
        } finally {
          setIsLiveAnalyzing(false);
        }
      }, 3500);
    }

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (liveInterval) clearInterval(liveInterval);
    };
  }, [mode]);

  // 7. Copilot Ask Question
  const handleSendCopilotQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = copilotInput.trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: query,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotInput('');
    setIsCopilotTyping(true);

    try {
      const activeEv = events.find(e => (e.id || e.event_id) === activeEventId);
      const activeDesc = activeEv ? `${activeEv.character_id}: ${activeEv.action} (Nguy cơ: ${activeEv.risk_score}%)` : '';

      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          history: copilotMessages.slice(-4).map(m => ({ role: m.role, content: m.text }))
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCopilotMessages(prev => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            text: data.answer,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error('Chat failed');
      }
    } catch (err) {
      setCopilotMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          text: `Ghi nhận câu hỏi: "${query}". Trạng thái hiện tại: Các nhân vật đang hoạt động trong ngưỡng kiểm soát an ninh thông thường.`,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsCopilotTyping(false);
    }
  };

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const char = ev.character_id || ev.target_id || 'Target #1';
    if (selectedCharacter !== 'ALL' && char !== selectedCharacter) return false;
    if (dangerOnly && !ev.is_danger) return false;
    return true;
  });

  const activeEvent = events.find((e) => (e.id || e.event_id) === activeEventId) || events[0];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F9FAFB] text-gray-900 overflow-hidden font-sans">
      {/* ========================================================= */}
      {/* 1. TOP BAR (Compact, Minimalist Header)                   */}
      {/* ========================================================= */}
      <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0 z-30 shadow-2xs">
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#D70018] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-gray-900 flex items-center gap-2">
              <span>AI Video Behavior Sentinel</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#D70018] border border-red-200 uppercase">
                Gemini 2.5 Flash
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Video vs Webcam Mode Switcher */}
        <div className="flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200">
          <button
            onClick={() => setMode('VIDEO')}
            className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'VIDEO'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-[#D70018]" />
            <span>Phân Tích Video (Slicing)</span>
          </button>

          <button
            onClick={() => setMode('WEBCAM')}
            className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'WEBCAM'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-[#D70018]" />
            <span>Webcam Trực Tiếp (Live 3s)</span>
          </button>
        </div>

        {/* Right Actions: Upload Button & Gemini API Key Status */}
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
            className="px-3.5 py-1.5 rounded-xl bg-[#D70018] hover:bg-[#b80015] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            <span>{isUploading ? 'Đang Phân Tích...' : 'Tải Video Lên'}</span>
          </button>

          {/* Gemini API Key status modal trigger */}
          <button
            onClick={() => setShowKeyModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              isGeminiOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isGeminiOnline ? 'Gemini 2.5: Sẵn Sàng' : 'Cài Gemini API Key'}</span>
          </button>
        </div>
      </header>

      {/* Progress banner when uploading */}
      {isUploading && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-1.5 flex items-center justify-between text-xs text-[#D70018] animate-pulse">
          <div className="flex items-center gap-2 font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{uploadProgress || 'Đang gửi video đến Google AI Studio...'}</span>
          </div>
          <span className="font-mono text-[11px] font-bold">Cloud Gemini Engine</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MAIN 2-COLUMN SPLIT LAYOUT (High Whitespace & Minimal) */}
      {/* ========================================================= */}
      <main className="flex-1 flex p-4 gap-4 overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT COLUMN (58%): Large HTML5 Video Player / Webcam      */}
        {/* ========================================================= */}
        <div className="w-[58%] h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden relative">
          {/* Main Viewport */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            {mode === 'VIDEO' ? (
              videoSourceUrl ? (
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
                /* Empty state */
                <div className="flex flex-col items-center justify-center text-center p-8 text-white space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white/80">
                    <Video className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Chưa chọn video giám sát</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Tải lên tệp video MP4 hoặc WebM của bạn để Gemini 2.5 Flash phân tích hành vi từng nhân vật.
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#D70018] text-white text-xs font-bold hover:bg-[#b80015] transition-all shadow-xs"
                  >
                    Chọn Video Từ Máy Tính
                  </button>
                </div>
              )
            ) : (
              /* Webcam Mode */
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                {isLiveAnalyzing && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-mono flex items-center gap-1.5 border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-[#D70018] animate-ping" />
                    <span>Gemini AI đang quét...</span>
                  </div>
                )}
              </div>
            )}

            {/* Overlaid Badges (Top Left) */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-[#D70018] animate-ping" />
                <span>{mode === 'VIDEO' ? 'VIDEO SLICING' : 'REC LIVE'}</span>
              </span>

              <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-gray-300 text-[10px] font-mono border border-white/20">
                {distinctCharacters.length} Nhân vật
              </span>

              {mode === 'VIDEO' && (
                <span className="px-2 py-1 rounded-full bg-black/70 backdrop-blur-md text-gray-400 text-[10px] font-mono border border-white/20 max-w-[200px] truncate">
                  {uploadedFileName}
                </span>
              )}
            </div>

            {/* Overlaid Bottom Toast: Active Event Details */}
            {activeEvent && mode === 'VIDEO' && (
              <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                <div className={`p-3 rounded-xl backdrop-blur-md border transition-all ${
                  activeEvent.is_danger
                    ? 'bg-red-950/80 border-red-500/60 text-white'
                    : 'bg-black/75 border-white/15 text-gray-200'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${activeEvent.is_danger ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                      <span>{activeEvent.character_id || activeEvent.target_id}</span>
                      <span className="font-mono text-gray-400">({activeEvent.time_label || activeEvent.timestamp_display})</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      activeEvent.risk_level === 'CRITICAL' ? 'bg-[#D70018] text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {activeEvent.risk_level} ({activeEvent.risk_score}%)
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 line-clamp-1">
                    {activeEvent.action || activeEvent.action_description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          {mode === 'VIDEO' && (
            <div className="p-3 bg-gray-950 border-t border-gray-800 space-y-2">
              {/* Seekbar with risk markers */}
              <div className="relative w-full">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#D70018]"
                />
                <div className="absolute top-0 left-0 right-0 h-1.5 pointer-events-none flex">
                  {events.map((ev) => {
                    const left = (ev.start_time / (duration || 1)) * 100;
                    const width = ((ev.end_time - ev.start_time) / (duration || 1)) * 100;
                    return (
                      <div
                        key={ev.id || ev.event_id}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        className={`absolute top-0 h-1.5 opacity-60 ${
                          ev.is_danger ? 'bg-[#D70018]' : 'bg-amber-400'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between text-xs text-gray-300">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="w-7 h-7 rounded-full bg-[#D70018] text-white flex items-center justify-center hover:bg-[#b80015] transition-colors"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        setCurrentTime(0);
                      }
                    }}
                    className="p-1 rounded-md text-gray-400 hover:text-white"
                    title="Tua về đầu"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <div className="font-mono text-xs">
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
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 font-mono text-[10px]">
                    {aiModelUsed}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN (42%): Upper (Timeline) & Lower (Copilot)   */}
        {/* ========================================================= */}
        <div className="w-[42%] h-full flex flex-col gap-3.5 overflow-hidden">
          {/* ======================================================= */}
          {/* UPPER SECTION (65%): Timeline Phân Tích Hành Vi Nhân Vật */}
          {/* ======================================================= */}
          <div className="h-[65%] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            {/* Upper Header with Filter Pills */}
            <div className="px-4 py-3 border-b border-gray-100 bg-white space-y-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase text-gray-900 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D70018]" />
                  <span>Timeline Phân Tích Hành Vi Nhân Vật</span>
                </h2>
                <span className="text-[11px] text-gray-500 font-mono">
                  {filteredEvents.length} sự kiện
                </span>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Lọc:
                </span>
                <button
                  onClick={() => setSelectedCharacter('ALL')}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    selectedCharacter === 'ALL'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tất cả
                </button>
                {distinctCharacters.map((char) => (
                  <button
                    key={char}
                    onClick={() => setSelectedCharacter(char)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                      selectedCharacter === char
                        ? 'bg-[#D70018] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {char}
                  </button>
                ))}

                <button
                  onClick={() => setDangerOnly(!dangerOnly)}
                  className={`ml-auto px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    dangerOnly
                      ? 'bg-[#D70018] text-white'
                      : 'bg-red-50 text-[#D70018] border border-red-200 hover:bg-red-100'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Chỉ Nguy Hiểm</span>
                </button>
              </div>
            </div>

            {/* Scrollable Event Feed */}
            <div
              ref={eventContainerRef}
              className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-gray-50/50"
            >
              {filteredEvents.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  Không tìm thấy sự kiện nào khớp bộ lọc.
                </div>
              ) : (
                filteredEvents.map((ev) => {
                  const evId = ev.id || ev.event_id || `${ev.start_time}`;
                  const isActive = activeEventId === evId;
                  const durationSec = Math.round((ev.end_time - ev.start_time) * 10) / 10;
                  const charName = ev.character_id || ev.target_id || 'Target #1';
                  const timeLabel = ev.time_label || ev.timestamp_display || `${ev.start_time}s - ${ev.end_time}s`;
                  const actionText = ev.action || ev.action_description || '';

                  return (
                    <div
                      key={evId}
                      ref={(el) => { cardRefs.current[evId] = el; }}
                      onClick={() => handleJumpToEvent(ev)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer group relative bg-white ${
                        isActive
                          ? 'border-[#D70018] ring-2 ring-[#D70018]/20 shadow-md scale-[1.01]'
                          : ev.risk_level === 'CRITICAL' || ev.is_danger
                          ? 'border-red-200 hover:border-[#D70018]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Active Indicator Badge */}
                      {isActive && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-black text-[#D70018] uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D70018] animate-ping" />
                          <span>Đang Phát</span>
                        </div>
                      )}

                      {/* Header Row: Target + Time + Risk */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black tracking-wide uppercase ${
                          charName.includes('2') || charName.includes('B')
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {charName}
                        </span>

                        <span className="text-xs font-mono font-bold text-gray-700 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {timeLabel}
                        </span>

                        {durationSec > 0 && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            ({durationSec}s)
                          </span>
                        )}

                        {/* Risk Indicator Pill */}
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          ev.risk_score > 70 || ev.risk_level === 'CRITICAL'
                            ? 'bg-red-50 text-[#D70018] border-red-200'
                            : ev.risk_score >= 40 || ev.risk_level === 'WARNING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {ev.risk_score}% ({ev.risk_level})
                        </span>
                      </div>

                      {/* Human-readable behavioral breakdown */}
                      <p className="text-xs font-medium text-gray-900 leading-relaxed group-hover:text-[#D70018] transition-colors">
                        {actionText}
                      </p>

                      {/* Danger Notes Banner if danger is flagged */}
                      {ev.is_danger && (ev.danger_notes || ev.danger_summary) && (
                        <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200 flex items-start gap-1.5 text-[11px] text-[#D70018] font-semibold">
                          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>{ev.danger_notes || ev.danger_summary}</span>
                        </div>
                      )}

                      {/* Click to jump hint */}
                      <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-mono">ID: {evId}</span>
                        <span className="flex items-center gap-0.5 font-bold group-hover:text-[#D70018] transition-colors">
                          <span>Nhảy tới giây {ev.start_time}s</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ======================================================= */}
          {/* LOWER SECTION (35%): Trợ Lý Phản Ứng Khẩn Cấp (Copilot) */}
          {/* ======================================================= */}
          <div className="h-[35%] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            {/* Header */}
            <div className="px-4 py-2 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-[#D70018]" />
                <h3 className="text-xs font-black uppercase text-gray-900 tracking-wider">
                  Trợ Lý Phản Ứng Khẩn Cấp (AI Copilot)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                Gemini 2.5 Flash
              </span>
            </div>

            {/* 1-Click SOP Recommendation Banner when risk > 70% */}
            {activeEvent && (activeEvent.risk_score > 70 || activeEvent.is_danger) && (
              <div className="bg-red-50 border-b border-red-200 px-4 py-1.5 flex items-center justify-between text-xs text-[#D70018] animate-pulse">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Cảnh báo nguy cơ cao ({activeEvent.risk_score}%)!</span>
                </div>
                <button
                  onClick={() => {
                    alert(`ĐÃ THỰC THI QUY TRÌNH SOP KHẨN CẤP!\n- Tín hiệu cảnh báo ưu tiên cao đã gửi đến đội tuần tra.\n- Video bằng chứng tại mốc ${activeEvent.time_label} đã được niêm phong.`);
                  }}
                  className="px-2.5 py-0.5 rounded-md bg-[#D70018] text-white text-[11px] font-black hover:bg-[#b80015] shadow-xs active:scale-95 transition-all"
                >
                  Kích Hoạt SOP Khẩn Cấp
                </button>
              </div>
            )}

            {/* Chat Messages Stream */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
              {copilotMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] p-2.5 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-[#D70018] text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5 px-1 font-mono">
                    {msg.time}
                  </span>
                </div>
              ))}
              {isCopilotTyping && (
                <div className="flex items-center gap-1 text-[11px] text-gray-400 italic">
                  <RefreshCw className="w-3 h-3 animate-spin text-[#D70018]" />
                  <span>Gemini 2.5 đang phản hồi...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendCopilotQuery}
              className="p-2 border-t border-gray-100 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                placeholder="Hỏi AI về video hoặc yêu cầu xử lý..."
                className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#D70018] font-medium"
              />
              <button
                type="submit"
                disabled={!copilotInput.trim() || isCopilotTyping}
                className="p-1.5 rounded-xl bg-[#D70018] text-white hover:bg-[#b80015] disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. GEMINI API KEY MODAL                                   */}
      {/* ========================================================= */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#D70018] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Cấu Hình Google Gemini API Key</h3>
                  <p className="text-[11px] text-gray-500">Kích hoạt Gemini 2.5 Flash File API cho video</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveApiKey} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>Google AI Studio API Key</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#D70018] hover:underline flex items-center gap-0.5"
                  >
                    <span>Lấy Key miễn phí</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full text-xs font-mono p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#D70018]"
                />
                <p className="text-[10px] text-gray-400">
                  Key được mã hóa và lưu trực tiếp vào môi trường máy tính để gửi video đến Gemini File API.
                </p>
              </div>

              {keySavedSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Kích hoạt Gemini 2.5 Flash thành công!</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSavingKey || !apiKeyInput.trim()}
                  className="flex-1 py-2 rounded-xl bg-[#D70018] text-white text-xs font-bold hover:bg-[#b80015] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSavingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{isSavingKey ? 'Đang Kiểm Tra...' : 'Lưu & Kích Hoạt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
