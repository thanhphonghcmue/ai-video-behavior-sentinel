'use client';

import React from 'react';
import { ThreatLevel } from '@/lib/types';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ThreatMeterGaugeProps {
  score: number; // 0 to 100
  level: ThreatLevel;
}

export const ThreatMeterGauge: React.FC<ThreatMeterGaugeProps> = ({ score, level }) => {
  // Clamped score
  const safeScore = Math.min(Math.max(score, 0), 100);

  // SVG Gauge calculations: semi-circle from 180 deg to 0 deg
  const radius = 70;
  const strokeWidth = 14;
  const center = 90;
  const circumference = Math.PI * radius; // Half-circle arc length
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  // Needle angle (-90 deg at 0% to +90 deg at 100%)
  const needleRotation = -90 + (safeScore / 100) * 180;

  // Color mapping
  const getColor = () => {
    if (safeScore >= 80) return '#EA580C'; // Deep Coral-Orange (High Risk)
    if (safeScore >= 50) return '#F59E0B'; // Amber
    return '#10B981'; // Emerald
  };

  const currentColor = getColor();

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col items-center justify-between shadow-xs relative overflow-hidden">
      {/* Background glow when critical */}
      {safeScore >= 80 && (
        <div className="absolute inset-0 bg-orange-500/5 pointer-events-none animate-pulse" />
      )}

      {/* Header */}
      <div className="w-full flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
          {safeScore >= 80 ? (
            <ShieldAlert className="w-4 h-4 text-[#EA580C] animate-bounce" />
          ) : safeScore >= 50 ? (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          )}
          Đồng Hồ Nguy Cơ (Threat Meter)
        </span>
        <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
          Real-time AI
        </span>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative w-44 h-28 flex items-end justify-center">
        <svg className="w-44 h-28 overflow-visible" viewBox="0 0 180 110">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>

          {/* Background track arc */}
          <path
            d="M 20 95 A 70 70 0 0 1 160 95"
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active progress arc */}
          <path
            d="M 20 95 A 70 70 0 0 1 160 95"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Needle Indicator */}
          <g
            transform={`translate(${center}, 95) rotate(${needleRotation})`}
            className="transition-transform duration-500 ease-out"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-58"
              stroke="#111827"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="0" cy="0" r="6" fill="#111827" />
            <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
          </g>
        </svg>

        {/* Center Digital Readout */}
        <div className="absolute bottom-0 flex flex-col items-center">
          <div
            className="text-2xl font-black tracking-tight transition-colors duration-500 font-mono"
            style={{ color: currentColor }}
          >
            {safeScore}%
          </div>
        </div>
      </div>

      {/* Status Pill Badge */}
      <div className="mt-2 w-full flex items-center justify-between text-xs pt-2 border-t border-gray-100">
        <span className="text-[11px] text-gray-500">Mức độ an ninh:</span>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${
            level === 'CRITICAL'
              ? 'bg-orange-50 text-[#EA580C] border-orange-300 animate-pulse'
              : level === 'MEDIUM'
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {level === 'CRITICAL' ? 'NGUY CẤP' : level === 'MEDIUM' ? 'ĐÁNG NGỜ' : 'AN TOÀN'}
        </span>
      </div>
    </div>
  );
};
