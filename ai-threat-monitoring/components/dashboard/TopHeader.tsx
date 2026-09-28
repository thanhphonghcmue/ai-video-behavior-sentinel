'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Search, 
  Radio, 
  User, 
  ChevronDown, 
  Volume2,
  KeyRound,
  Sparkles,
  X,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { ThreatLevel } from '@/lib/types';

interface TopHeaderProps {
  currentThreatLevel?: ThreatLevel;
  onOpenSirenModal?: () => void;
  unreadNotifications?: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentThreatLevel = 'LOW',
  onOpenSirenModal,
  unreadNotifications = 3,
}) => {
  const [timeString, setTimeString] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isSavingKey, setIsSavingKey] = useState<boolean>(false);
  const [keySaveSuccess, setKeySaveSuccess] = useState<boolean>(false);
  const [isGeminiOnline, setIsGeminiOnline] = useState<boolean>(false);

  // Poll system status for Gemini connection
  useEffect(() => {
    const checkStatus = async () => {
      try {
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
    const interval = setInterval(checkStatus, 5000);
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
        setIsGeminiOnline(true);
        setKeySaveSuccess(true);
        setTimeout(() => {
          setKeySaveSuccess(false);
          setShowKeyModal(false);
          setApiKeyInput('');
        }, 1500);
      } else {
        alert('Không thể kích hoạt API Key. Vui lòng kiểm tra lại tính hợp lệ.');
      }
    } catch (err) {
      alert('Không thể kết nối đến backend trên cổng 8000.');
    } finally {
      setIsSavingKey(false);
    }
  };

  const isCritical = currentThreatLevel === 'CRITICAL';

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between sticky top-0 z-30 ml-64 shadow-xs">
      {/* Breadcrumb & Live Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/dashboard" className="hover:text-brand-red transition-colors font-medium">
            SENTINEL HQ
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800">Trung Tâm Chỉ Huy Giám Sát</span>
        </div>

        {/* Global System Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            isCritical
              ? 'bg-red-50 text-brand-red border-red-300 animate-pulse'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isCritical ? 'bg-brand-red' : 'bg-emerald-500'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isCritical ? 'bg-brand-red' : 'bg-emerald-600'
              }`}
            ></span>
          </span>
          {isCritical ? 'PHÁT HIỆN NGUY CƠ CAO (>80%)' : 'HỆ THỐNG AN TOÀN'}
        </div>
      </div>

      {/* Center/Right Controls: Time, API Key, Siren, Notification & Role Badge */}
      <div className="flex items-center gap-3">
        {/* Real-time Clock */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span>{timeString || 'Đang đồng bộ...'}</span>
        </div>

        {/* Gemini API Key Trigger Button */}
        <button
          onClick={() => setShowKeyModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-xs ${
            isGeminiOnline
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 text-blue-600" />
          <span>{isGeminiOnline ? 'Gemini 2.5: ONLINE' : 'Cài Gemini API Key'}</span>
        </button>

        {/* Siren Trigger */}
        <button
          onClick={onOpenSirenModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-brand-red border border-red-200 hover:bg-brand-red hover:text-white transition-all shadow-xs active:scale-95"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Còi Khẩn Cấp</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 relative transition-colors">
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand-red ring-2 ring-white"></span>
            )}
          </button>
        </div>

        {/* User Role Badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center font-bold text-xs shadow-sm">
            AD
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-[#111827]">Võ Hoàng Nam</div>
            <div className="text-[10px] text-brand-red font-semibold uppercase">
              Chỉ Huy Trực Ban (Commander Admin)
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      {/* GEMINI API KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-200 shadow-2xl overflow-hidden">
            <div className="bg-brand-red p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-extrabold">CẤU HÌNH GOOGLE AI STUDIO API KEY</h3>
                  <p className="text-[11px] text-white/80">Kích hoạt Gemini 2.5 Flash Multimodal Vision & Copilot</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveApiKey} className="p-6 space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                Để kích hoạt chức năng <strong>Dynamic Action Event Slicing qua File API</strong> và phân tích thị giác trực tiếp từ camera, hãy dán API Key của Google AI Studio vào đây:
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Google AI Studio API Key:</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full text-xs font-mono p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                <span>Chưa có API Key? Nhận miễn phí tại:</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-red font-bold flex items-center gap-1 hover:underline"
                >
                  <span>Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {keySaveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Kích hoạt Gemini 2.5 Flash thành công!</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSavingKey}
                  className="flex-1 py-2.5 rounded-xl bg-brand-red text-white text-xs font-bold hover:bg-brand-darkRed transition-all shadow-md shadow-brand-red/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSavingKey ? 'Đang Kiểm Tra & Lưu...' : 'Lưu & Kích Hoạt Ngay'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
