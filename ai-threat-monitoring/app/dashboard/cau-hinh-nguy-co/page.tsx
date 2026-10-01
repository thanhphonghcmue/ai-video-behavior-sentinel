'use client';

import React, { useState } from 'react';
import { Settings2, Save, RotateCcw, Sliders, ShieldAlert, Cpu } from 'lucide-react';

export default function ThreatConfigPage() {
  const [criticalThreshold, setCriticalThreshold] = useState(80);
  const [warningThreshold, setWarningThreshold] = useState(50);
  const [roiSensitivity, setRoiSensitivity] = useState(85);
  const [dwellLimitSec, setDwellLimitSec] = useState(10);
  const [enableAutoSnapshot, setEnableAutoSnapshot] = useState(true);
  const [enableSoundSiren, setEnableSoundSiren] = useState(true);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-brand-blue" />
            Cấu Hình Ngưỡng Nguy Cơ & Vùng Cấm ROI (AI Security Engine)
          </h1>
          <p className="text-xs text-gray-500">
            Điều chỉnh trọng số thuật toán Threat Scoring và quy tắc kích hoạt cảnh báo tức thời
          </p>
        </div>

        <button
          onClick={() => alert('Đã lưu cấu hình ngưỡng AI thành công!')}
          className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] flex items-center gap-2 shadow-xs transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Lưu Thiết Lập</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* 1. Ngưỡng Rủi Ro Cảnh Báo */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-blue" />
            Ngưỡng Thang Đo Nguy Cơ (Threat Thresholds)
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Ngưỡng Báo Động Nguy Cấp:</span>
                <span className="font-mono text-[#EA580C] font-bold">&gt;= {criticalThreshold}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                className="w-full accent-orange-600"
              />
              <span className="text-[10px] text-gray-400">
                Khi điểm nguy cơ vượt ngưỡng này, còi báo động và đèn nhấp nháy sẽ được kích hoạt.
              </span>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Ngưỡng Cảnh Báo Đáng Ngờ (Vàng):</span>
                <span className="font-mono text-amber-600 font-bold">&gt;= {warningThreshold}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="60"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-gray-400">
                Ghi nhận vào nhật ký sự cố và gửi thông báo cho nhân viên tuần tra.
              </span>
            </div>
          </div>
        </div>

        {/* 2. Cài Đặt Vùng Cấm ROI & Dwell Time */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-brand-blue" />
            Quy Chuẩn Vùng Cấm Ảo (ROI Settings)
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Độ nhạy va chạm đường biên ROI:</span>
                <span className="font-mono text-[#EA580C] font-bold">{roiSensitivity}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={roiSensitivity}
                onChange={(e) => setRoiSensitivity(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="text-[10px] text-gray-400">
                Thuật toán Ray-Casting đa giác kiểm tra tọa độ hai bàn chân đối tượng.
              </span>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Thời gian lảng vảng tối đa (Dwell Time):</span>
                <span className="font-mono text-gray-800 font-bold">{dwellLimitSec} giây</span>
              </div>
              <input
                type="range"
                min="3"
                max="30"
                value={dwellLimitSec}
                onChange={(e) => setDwellLimitSec(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="text-[10px] text-gray-400">
                Nếu đối tượng dừng lại quá thời gian này trong vùng nhạy cảm, điểm đe dọa sẽ tăng thêm 35%.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tùy Chọn Tự Động Hóa */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          Tùy Chọn Tự Động Hóa Phản Ứng Khẩn Cấp
        </h3>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={enableAutoSnapshot}
              onChange={(e) => setEnableAutoSnapshot(e.target.checked)}
              className="rounded text-brand-blue focus:ring-brand-blue w-4 h-4"
            />
            <div>
              <span className="font-bold text-gray-800 block">Tự động chụp Snapshot vi phạm</span>
              <span className="text-[11px] text-gray-500">Trích xuất khung hình độ nét cao khi nguy cơ &gt; 80%</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={enableSoundSiren}
              onChange={(e) => setEnableSoundSiren(e.target.checked)}
              className="rounded text-brand-blue focus:ring-brand-blue w-4 h-4"
            />
            <div>
              <span className="font-bold text-gray-800 block">Bật còi hú âm lượng cao</span>
              <span className="text-[11px] text-gray-500">Phát âm cảnh báo an ninh tại trạm điều khiển</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
