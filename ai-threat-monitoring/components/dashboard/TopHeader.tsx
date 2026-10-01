'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Sparkles, 
  KeyRound, 
  Volume2, 
  Menu, 
  MoreVertical, 
  X, 
  CheckCircle2, 
  ExternalLink,
  Cpu,
  Layers,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { ThreatLevel } from '@/lib/types';

interface TopHeaderProps {
  currentThreatLevel?: ThreatLevel;
  onOpenSirenModal?: () => void;
  unreadNotifications?: number;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  activeModel?: string;
  onModelChange?: (model: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentThreatLevel = 'LOW',
  onOpenSirenModal,
  unreadNotifications = 2,
  isSidebarCollapsed,
  onToggleSidebar,
  activeModel = 'gemini-2.5-flash',
  onModelChange,
}) => {
  const [timeString, setTimeString] = useState<string>('');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(activeModel);
  const [customModelInput, setCustomModelInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isGeminiOnline, setIsGeminiOnline] = useState<boolean>(false);
  const [currentBackendModel, setCurrentBackendModel] = useState<string>(activeModel);

  // Poll backend status
  const checkStatus = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/status');
      if (res.ok) {
        const data = await res.json();
        setIsGeminiOnline(Boolean(data.gemini_active));
        if (data.model) {
          setCurrentBackendModel(data.model);
        }
      }
    } catch (err) {
      // Backend offline
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' - ' + now.toLocaleDateString('vi-VN')
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const chosenModel = selectedModel === 'custom' ? customModelInput.trim() : selectedModel;

    try {
      // If API key is provided, save API key + model
      if (apiKeyInput.trim()) {
        const res = await fetch('http://localhost:8000/api/set-api-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            api_key: apiKeyInput.trim(),
            model: chosenModel 
          }),
        });
        if (res.ok) {
          setIsGeminiOnline(true);
          setCurrentBackendModel(chosenModel);
          if (onModelChange) onModelChange(chosenModel);
          setSaveSuccess(true);
        } else {
          alert('Không thể kích hoạt API Key. Vui lòng kiểm tra lại mã key.');
        }
      } else {
        // Just switch model
        const res = await fetch('http://localhost:8000/api/set-model', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: chosenModel }),
        });
        if (res.ok) {
          setCurrentBackendModel(chosenModel);
          if (onModelChange) onModelChange(chosenModel);
          setSaveSuccess(true);
        } else {
          alert('Không thể chuyển đổi mô hình.');
        }
      }

      if (saveSuccess || true) {
        setTimeout(() => {
          setSaveSuccess(false);
          setShowConfigModal(false);
          setApiKeyInput('');
        }, 1200);
      }
    } catch (err) {
      alert('Không thể kết nối đến backend trên cổng 8000.');
    } finally {
      setIsSaving(false);
    }
  };

  const isHighRisk = currentThreatLevel === 'CRITICAL';
  const isMediumRisk = currentThreatLevel === 'MEDIUM';

  return (
    <header 
      className={`h-16 bg-white border-b border-[#E2E8F0] px-5 flex items-center justify-between sticky top-0 z-30 transition-all duration-300 shadow-xs ${
        isSidebarCollapsed ? 'ml-18' : 'ml-64'
      }`}
    >
      {/* Left: Sidebar Toggle + Title */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? "Mở rộng thanh điều hướng (☰)" : "Thu gọn thanh điều hướng (⋮)"}
          className="w-9 h-9 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-brand-blue flex items-center justify-center transition-all"
        >
          {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <MoreVertical className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2 text-xs">
          <Link href="/dashboard" className="font-bold text-[#0F172A] hover:text-brand-blue transition-colors flex items-center gap-1.5">
            <span className="hidden sm:inline font-black text-sm text-[#0F172A]">AI SENTINEL</span>
            <span className="hidden sm:inline text-gray-300">/</span>
            <span className="text-gray-600 font-semibold">Giám Sát Hành Vi & An Ninh</span>
          </Link>
        </div>

        {/* Global Threat Status Pill (NO RED: Uses Coral-Orange for High Risk, Amber for Warning, Emerald for Safe) */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            isHighRisk
              ? 'bg-orange-50 text-[#EA580C] border-orange-300 animate-pulse'
              : isMediumRisk
              ? 'bg-amber-50 text-[#D97706] border-amber-300'
              : 'bg-emerald-50 text-[#059669] border-emerald-200'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isHighRisk ? 'bg-[#EA580C]' : isMediumRisk ? 'bg-[#D97706]' : 'bg-[#059669]'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isHighRisk ? 'bg-[#EA580C]' : isMediumRisk ? 'bg-[#D97706]' : 'bg-[#059669]'
              }`}
            ></span>
          </span>
          <span className="text-[11px]">
            {isHighRisk ? 'NGUY CƠ CAO (>70%)' : isMediumRisk ? 'CẢNH BÁO THEO DÕI' : 'AN TOÀN'}
          </span>
        </div>
      </div>

      {/* Right: Real-time Clock, Model & API Key Switcher, Siren, User Badge */}
      <div className="flex items-center gap-2.5">
        {/* Real-time Clock */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-mono bg-[#F8FAFC] text-gray-600 px-3 py-1.5 rounded-xl border border-gray-200">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>{timeString || 'Đang đồng bộ...'}</span>
        </div>

        {/* Gemini Model & API Key Button */}
        <button
          onClick={() => setShowConfigModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-xs ${
            isGeminiOnline
              ? 'bg-blue-50 text-brand-blue border-blue-200 hover:bg-blue-100'
              : 'bg-amber-50 text-[#D97706] border-amber-300 hover:bg-amber-100 animate-pulse'
          }`}
          title="Bấm để cấu hình Gemini API Key hoặc đổi mô hình (Gemini 2.5 Flash / Pro)"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
          <span className="font-mono text-[11px] truncate max-w-[130px]">
            {isGeminiOnline ? currentBackendModel : 'Kết Nối Gemini'}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${isGeminiOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
        </button>

        {/* Siren Emergency Button (Uses Coral-Orange, NO RED) */}
        <button
          onClick={onOpenSirenModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 text-[#EA580C] border border-orange-200 hover:bg-[#EA580C] hover:text-white transition-all shadow-xs active:scale-95"
          title="Kích hoạt còi hú cảnh báo khẩn cấp hiện trường"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Còi Báo Động</span>
        </button>

        {/* User Profile Pill in Topbar */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-100 shadow-xs">
            LP
          </div>
          <div className="text-left text-[11px]">
            <p className="font-bold text-[#0F172A] leading-tight">Lâm Thanh Phong</p>
            <p className="text-[10px] text-gray-500 font-mono">50.01.103.057</p>
          </div>
        </div>
      </div>

      {/* Model & API Key Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-200 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Cấu Hình Mô Hình & API Key Gemini</h3>
                  <p className="text-xs text-blue-100">
                    Kết nối Google AI Studio (Gemini 2.5 Flash, 2.5 Pro, 1.5 Pro)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
              {/* Select Gemini Model */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>Chọn Thế Hệ Mô Hình Gemini (Đời Mới Nhất):</span>
                  <span className="text-[10px] text-brand-blue font-semibold">Tự động thích ứng</span>
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Mặc định - Siêu tốc độ & Bounding Box' },
                    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Suy luận an ninh chuyên sâu nhất' },
                    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Context 2M tokens cực lớn' },
                    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp', desc: 'Thử nghiệm thế hệ 2.0' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedModel === m.id
                          ? 'border-brand-blue bg-blue-50/80 ring-2 ring-blue-500/20 text-[#0F172A]'
                          : 'border-gray-200 hover:border-blue-200 bg-white text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{m.name}</span>
                        {selectedModel === m.id && <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue" />}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>Nhập Google AI Studio API Key (Tùy chọn nếu muốn đổi Key):</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-brand-blue hover:underline flex items-center gap-1 font-semibold"
                  >
                    Lấy Key miễn phí <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Dán AIzaSy... (để trống nếu chỉ muốn đổi mô hình)"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50/60 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Note / Info */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                💡 <strong>Đặc quyền kiến trúc mới:</strong> Bạn có thể sử dụng bất kỳ API Key Google AI Studio mới nào hoặc chuyển sang <strong>Gemini 2.5 Pro</strong> để AI suy luận an ninh sâu sắc hơn, tự động trích xuất chính xác thời gian và bounding box của từng nhân vật!
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <span>Đang lưu...</span>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Đã Lưu Thành Công!</span>
                    </>
                  ) : (
                    <span>Áp Dụng Cấu Hình</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
