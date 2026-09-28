'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Volume2, 
  FileDown, 
  Activity, 
  ShieldAlert, 
  UserCheck, 
  RotateCcw,
  CheckCircle2,
  Sparkles,
  CloudLightning
} from 'lucide-react';
import { ChatMessage, ThreatLevel, DetectedPerson } from '@/lib/types';
import { QuickPromptChips } from './QuickPromptChips';
import { ACTION_METADATA_MAP } from '@/lib/behavior-engine/action-classifier';

interface AICopilotPanelProps {
  currentPerson?: DetectedPerson | null;
  activePersonsCount?: number;
  threatScore: number;
  threatLevel: ThreatLevel;
  onTriggerEmergencySiren: () => void;
  onExportReport: () => void;
}

export const AICopilotPanel: React.FC<AICopilotPanelProps> = ({
  currentPerson,
  activePersonsCount = 1,
  threatScore,
  threatLevel,
  onTriggerEmergencySiren,
  onExportReport,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'ai',
      text: 'Xin chào Quản trị viên! Tôi là AI Copilot kết nối Google Gemini 2.5 Flash đa phương thức. Tôi đang liên tục phân tích hành vi và sẵn sàng trả lời các thắc mắc an ninh về luồng camera.',
      timestamp: '14:00:00',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [modelLabel, setModelLabel] = useState('Gemini 2.5 Flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      // 1. Call Backend FastAPI /api/chat powered by Gemini 2.5 Flash
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          history: messages.slice(-4).map(m => ({ role: m.sender, content: m.text }))
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.model_used) setModelLabel(data.model_used);
        
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.answer || 'Đã phân tích thông tin.',
          timestamp: data.timestamp || new Date().toLocaleTimeString('vi-VN', { hour12: false }),
          metadata: {
            threatLevel: threatScore >= 80 ? 'CRITICAL' : threatScore >= 50 ? 'MEDIUM' : 'LOW',
          },
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('Backend chat unreachable, using local fallback:', err);
    }

    // 2. Intelligent Fallback if FastAPI is not yet running on port 8000
    setTimeout(() => {
      let replyText = '';
      const actMeta = currentPerson ? ACTION_METADATA_MAP[currentPerson.action] : null;

      if (query.includes('5 phút') || query.includes('Tóm tắt')) {
        replyText = `Trong 5 phút qua, hệ thống ghi nhận đối tượng ID ${currentPerson?.trackingLabel || '#01'} có hành vi chủ đạo: "${actMeta?.labelVi || 'Di chuyển bình thường'}". Điểm nguy cơ trung bình ở mức ${threatScore}%.`;
      } else if (query.includes('vùng cấm') || query.includes('ROI')) {
        if (currentPerson?.isInROI) {
          replyText = `CẢNH BÁO KHẨN CẤP! Đối tượng ${currentPerson.trackingLabel} đang vi phạm ranh giới Vùng Cấm (ROI). Đã ghi nhận lúc ${new Date().toLocaleTimeString('vi-VN')}.`;
        } else {
          replyText = `Hiện tại không có đối tượng nào xâm phạm vùng cấm ROI. Ranh giới ảo được bảo vệ an toàn.`;
        }
      } else {
        replyText = `Ghi nhận truy vấn về "${query}". Dữ liệu camera trực tiếp cho thấy hành vi hiện thời là "${actMeta?.labelVi || 'Bình thường'}" với mức đe dọa ${threatScore}%.`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
        metadata: {
          threatLevel: threatScore >= 80 ? 'CRITICAL' : threatScore >= 50 ? 'MEDIUM' : 'LOW',
        },
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  const actionMeta = currentPerson ? ACTION_METADATA_MAP[currentPerson.action] : null;

  return (
    <div className="w-[360px] flex flex-col h-full bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
      {/* 1. Panel Header */}
      <div className="p-4 border-b border-[#E5E7EB] bg-gradient-to-r from-red-50/50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-red flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
              AI Copilot Giám Sát
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h3>
            <p className="text-[10px] text-gray-500 flex items-center gap-1">
              <CloudLightning className="w-3 h-3 text-blue-600" />
              <span>{modelLabel}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setMessages([
              {
                id: 'msg-reset',
                sender: 'ai',
                text: 'Hội thoại đã được làm mới. Dữ liệu camera đang tiếp tục cập nhật theo thời gian thực.',
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
              },
            ]);
          }}
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          title="Làm mới hội thoại"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Live Activity Summary Telemetry Feed */}
      <div className="p-3 bg-gray-50/80 border-b border-[#E5E7EB] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-brand-red" />
            Tóm Tắt Hành Vi Trực Tiếp (Live Feed)
          </span>
          <span className="text-[10px] font-mono text-gray-500 font-normal">
            Gemini 2.5 Flash
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-white p-2 rounded-xl border border-gray-200">
            <span className="text-gray-500 block text-[10px]">Đối tượng trong khung:</span>
            <span className="font-bold text-gray-900 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              {activePersonsCount} Người theo dõi
            </span>
          </div>

          <div className="bg-white p-2 rounded-xl border border-gray-200">
            <span className="text-gray-500 block text-[10px]">Hành vi nhận diện:</span>
            <span className="font-bold truncate block" style={{ color: actionMeta?.color || '#10B981' }}>
              {actionMeta?.labelVi || 'Đang nhận diện...'}
            </span>
          </div>

          <div className="bg-white p-2 rounded-xl border border-gray-200">
            <span className="text-gray-500 block text-[10px]">Điểm nguy cơ tức thì:</span>
            <span
              className={`font-black font-mono text-xs flex items-center gap-1 ${
                threatScore >= 80 ? 'text-brand-red animate-pulse' : threatScore >= 50 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {threatScore}% ({threatLevel})
            </span>
          </div>

          <div className="bg-white p-2 rounded-xl border border-gray-200">
            <span className="text-gray-500 block text-[10px]">Ranh giới Vùng Cấm:</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                currentPerson?.isInROI ? 'text-brand-red animate-bounce' : 'text-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {currentPerson?.isInROI ? 'ĐANG XÂM PHẠM!' : 'An toàn tuyệt đối'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Chat Message Stream */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-white">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          const isCrit = msg.metadata?.threatLevel === 'CRITICAL';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'} animate-in fade-in duration-300`}
            >
              {isAi && (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold ${
                    isCrit ? 'bg-brand-red ring-2 ring-red-300' : 'bg-brand-red'
                  }`}
                >
                  AI
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  isAi
                    ? isCrit
                      ? 'bg-red-50 text-gray-900 border border-red-300 shadow-xs'
                      : 'bg-gray-100 text-gray-800 border border-gray-200/80'
                    : 'bg-brand-red text-white shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                <div className={`text-[9px] mt-1 text-right font-mono ${isAi ? 'text-gray-400' : 'text-red-100'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-2 items-center text-xs text-gray-400 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-brand-red text-white flex items-center justify-center text-[10px]">
              AI
            </div>
            <div className="bg-gray-100 px-3 py-2 rounded-2xl border border-gray-200 text-gray-500 text-[11px]">
              Gemini AI đang phân tích dữ liệu và sinh câu trả lời...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Prompt Chips */}
      <div className="p-3 bg-gray-50 border-t border-[#E5E7EB]">
        <QuickPromptChips onSelectPrompt={(p) => handleSendMessage(p)} disabled={isTyping} />
      </div>

      {/* 5. Chat Input */}
      <div className="p-3 bg-white border-t border-[#E5E7EB]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Hỏi Gemini AI về hành vi đối tượng..."
            className="flex-1 text-xs px-3.5 py-2.5 bg-gray-100 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-red focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="w-9 h-9 rounded-xl bg-brand-red text-white flex items-center justify-center hover:bg-brand-darkRed transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 6. Emergency Controls Footer */}
      <div className="p-3 bg-gray-100/80 border-t border-[#E5E7EB] space-y-2">
        <button
          onClick={onTriggerEmergencySiren}
          className="w-full py-2.5 px-4 rounded-xl bg-brand-red hover:bg-brand-darkRed text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-md shadow-brand-red/30 transition-all active:scale-98 animate-pulse"
        >
          <Volume2 className="w-4 h-4 animate-bounce" />
          <span>CÒI BÁO ĐỘNG KHẨN CẤP</span>
        </button>

        <button
          onClick={onExportReport}
          className="w-full py-2 px-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs active:scale-98"
        >
          <FileDown className="w-3.5 h-3.5 text-gray-500" />
          <span>Xuất Biên Bản Sự Cố (PDF / Excel)</span>
        </button>
      </div>
    </div>
  );
};
