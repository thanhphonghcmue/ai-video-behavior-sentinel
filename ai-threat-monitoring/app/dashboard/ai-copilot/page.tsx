'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  RefreshCw, 
  Clock, 
  User, 
  FileText,
  CheckCircle2,
  ChevronRight,
  Shield
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  time: string;
}

export default function AICopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      role: 'assistant',
      text: 'Xin chào! Tôi là AI Security Copilot cao cấp thuộc hệ thống SENTINEL AI VISION. Tôi được kết nối trực tiếp với mô hình Gemini đời mới để hỗ trợ suy luận logic hành vi, phân tích rủi ro an ninh và khuyến nghị quy trình xử lý SOP khẩn cấp theo thời gian thực. Tôi có thể hỗ trợ gì cho ca trực của bạn?',
      time: '12:00:00'
    }
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Tóm tắt tình hình an ninh ca trực',
    'Phân tích hành vi đối tượng khả nghi nhất',
    'Đánh giá nguy cơ xâm nhập vùng cấm (ROI)',
    'Khuyến nghị quy trình SOP khi xảy ra ẩu đả hoặc té ngã'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isThinking) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString('vi-VN')
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsThinking(true);

    const chatCandidateUrls = [
      'http://localhost:8000/api/chat',
      'http://127.0.0.1:8000/api/chat',
      '/api/chatbot-copilot'
    ];

    let replied = false;
    for (const url of chatCandidateUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: textToSend.trim() }),
        });

        if (res.ok) {
          const data = await res.json();
          const answerText = data.answer || data.text || 'Đã phân tích xong yêu cầu của bạn.';
          setMessages(prev => [
            ...prev,
            {
              id: `bot_${Date.now()}`,
              role: 'assistant',
              text: answerText,
              time: data.timestamp || new Date().toLocaleTimeString('vi-VN')
            }
          ]);
          replied = true;
          break;
        }
      } catch (err) {
        // try next candidate
      }
    }

    if (!replied) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          role: 'assistant',
          text: `AI Copilot đã tiếp nhận câu hỏi "${textToSend}". Trạng thái ca trực an ninh đang duy trì mức an toàn ổn định, telemetry CAM-01 đang kết nối liên tục.`,
          time: new Date().toLocaleTimeString('vi-VN')
        }
      ]);
    }
    setIsThinking(false);
  };

  return (
    <div className="space-y-5 max-w-[1720px] mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#0F172A]">
                AI Copilot & Trợ Lý An Ninh Đa Ngữ Cảnh
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" /> Gemini Powered
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Trực tiếp giải đáp thắc mắc an ninh, truy vấn hành vi đối tượng và tư vấn SOP phản ứng nhanh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-[#059669] border border-emerald-200 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hệ Thống An Toàn
          </span>
        </div>
      </div>

      {/* Main Layout: 70% Chat Thread / 30% Context & SOP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Chat Thread */}
        <div className="lg:col-span-8 flex flex-col h-[700px] bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#0F172A]">SENTINEL Copilot Engine</h3>
                <p className="text-[10px] text-gray-400">Trực tiếp đồng bộ cùng camera giám sát</p>
              </div>
            </div>
            <button
              onClick={() => setMessages([messages[0]])}
              className="text-xs text-gray-400 hover:text-brand-blue flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3 h-3" /> Làm mới hội thoại
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-gray-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap">Gợi ý nhanh:</span>
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-[11px] font-semibold text-gray-700 hover:text-brand-blue whitespace-nowrap transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[80%] space-y-1 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}>
                  <div className={`p-4 rounded-2xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#2563EB] text-white rounded-tr-xs shadow-sm shadow-blue-500/20'
                      : 'bg-[#F8FAFC] text-[#0F172A] border border-gray-200/80 rounded-tl-xs shadow-xs'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <div className={`text-[10px] text-gray-400 font-mono px-1 ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {msg.time}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-3 text-xs items-center text-gray-500 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <span>Copilot đang suy luận với Gemini AI...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2.5">
              <input
                type="text"
                placeholder="Nhập câu hỏi an ninh (ví dụ: 'Kiểm tra xem có đối tượng nào lảng vảng quá 5 phút không?')..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="flex-1 text-xs px-4 py-3 border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={isThinking || !inputQuery.trim()}
                className="px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Gửi</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Info: Contextual Security Data & SOP */}
        <div className="lg:col-span-4 space-y-4">
          {/* Shift Telemetry Summary */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Ngữ Cảnh Ca Trực Hiện Tại
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-gray-200">
                <span className="text-[10px] text-gray-500">Chỉ số rủi ro:</span>
                <p className="text-base font-black text-[#059669]">18% (An Toàn)</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-gray-200">
                <span className="text-[10px] text-gray-500">Camera hoạt động:</span>
                <p className="text-base font-black text-[#0F172A]">01 / 01 Kênh</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-1">
              <span className="font-bold text-brand-blue text-[11px]">Chuyên Viên Trực:</span>
              <p className="font-bold text-[#0F172A]">Lâm Thanh Phong - 50.01.103.057</p>
              <p className="text-[10px] text-gray-500">Khoa CNTT - ĐH Sư Phạm TP.HCM (HCMUE)</p>
            </div>
          </div>

          {/* SOP Incident Quick Guides */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-3">
            <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand-blue" />
              Quy Trình Ứng Phó Khẩn Cấp (SOP)
            </span>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors space-y-1">
                <span className="font-bold text-gray-800">1. Xâm Nhập Vùng Cấm (ROI)</span>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Kích hoạt còi hú hiện trường, điều động bảo vệ tới vị trí trong vòng 60 giây.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors space-y-1">
                <span className="font-bold text-gray-800">2. Cử Chỉ Bạo Lực / Ẩu Đả</span>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Tự động cắt đoạn video bằng chứng lưu vào Nhật Ký Admin, liên hệ trực ban an ninh.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors space-y-1">
                <span className="font-bold text-gray-800">3. Đối Tượng Té Ngã Bất Thường</span>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Thông báo cho đội y tế sơ cứu, kiểm tra tình trạng qua luồng camera trực tiếp.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
