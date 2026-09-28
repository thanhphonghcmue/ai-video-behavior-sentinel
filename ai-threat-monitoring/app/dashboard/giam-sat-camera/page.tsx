'use client';

import React, { useState } from 'react';
import { VideoPlayerWithOverlay } from '@/components/camera/VideoPlayerWithOverlay';
import { Camera, Grid, Sliders, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { ThreatLevel, DetectedPerson } from '@/lib/types';

export default function CameraMonitoringDeepPage() {
  const [activeCam, setActiveCam] = useState('CAM-01 (Tiền sảnh chính)');
  const [threatScore, setThreatScore] = useState(35);
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>('LOW');

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200">
        <div>
          <h1 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand-red" />
            Màn Hình Chuyên Sâu Phân Tích Camera AI (4K Multi-Stream)
          </h1>
          <p className="text-xs text-gray-500">
            Xem chi tiết 18 khớp OpenPose, ma trận góc thân và bộ đếm gia tốc chuyển động thời gian thực
          </p>
        </div>

        {/* Cam Selector */}
        <div className="flex items-center gap-2">
          {['CAM-01 (Tiền sảnh chính)', 'CAM-02 (Kho linh kiện)', 'CAM-03 (Bãi đỗ xe)'].map((cam) => (
            <button
              key={cam}
              onClick={() => setActiveCam(cam)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                activeCam === cam
                  ? 'bg-brand-red text-white border-brand-red shadow-xs'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cam}
            </button>
          ))}
        </div>
      </div>

      {/* Main Big Canvas Stream */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <VideoPlayerWithOverlay
            sourceType="webcam"
            onThreatUpdate={(score, level) => {
              setThreatScore(score);
              setThreatLevel(level);
            }}
            onSnapshotCaptured={() => {}}
          />
        </div>

        {/* Right Details: Joint Coordinates & AI Model Metrics */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-brand-red" />
              Thông Số Động Học Khớp (Skeleton Telemetry)
            </span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              30.2 FPS
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-500">Mô hình trích xuất khớp:</span>
              <span className="font-bold text-gray-900 font-mono">Lightweight OpenPose</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-500">Mạng nơ-ron hành động:</span>
              <span className="font-bold text-gray-900 font-mono">2s-AGCN (Spatial-Temporal)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-500">Số điểm khớp theo dõi:</span>
              <span className="font-bold text-brand-red font-mono">18 Keypoints (COCO Format)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-500">Định dạng luồng đầu vào:</span>
              <span className="font-bold text-gray-700">RGB 1280x720 24bpp</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-gray-500">Thời gian xử lý khung:</span>
              <span className="font-bold text-emerald-600 font-mono">14.2 ms / frame</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-700 mb-2">Trọng số 18 Khớp Xương:</h4>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-gray-600 max-h-44 overflow-y-auto pr-1">
              <div className="bg-gray-50 p-1.5 rounded border">0: Mũi (Nose) - 0.98</div>
              <div className="bg-gray-50 p-1.5 rounded border">1: Cổ (Neck) - 0.96</div>
              <div className="bg-gray-50 p-1.5 rounded border">2: Vai Phải (R_Sho) - 0.93</div>
              <div className="bg-gray-50 p-1.5 rounded border">3: Khuỷu Phải (R_Elb) - 0.91</div>
              <div className="bg-gray-50 p-1.5 rounded border">4: Cổ tay Phải (R_Wri) - 0.89</div>
              <div className="bg-gray-50 p-1.5 rounded border">5: Vai Trái (L_Sho) - 0.94</div>
              <div className="bg-gray-50 p-1.5 rounded border">6: Khuỷu Trái (L_Elb) - 0.90</div>
              <div className="bg-gray-50 p-1.5 rounded border">7: Cổ tay Trái (L_Wri) - 0.88</div>
              <div className="bg-gray-50 p-1.5 rounded border">8: Hông Phải (R_Hip) - 0.95</div>
              <div className="bg-gray-50 p-1.5 rounded border">9: Gối Phải (R_Kne) - 0.92</div>
              <div className="bg-gray-50 p-1.5 rounded border">10: Cổ chân Phải - 0.87</div>
              <div className="bg-gray-50 p-1.5 rounded border">11: Hông Trái (L_Hip) - 0.94</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
