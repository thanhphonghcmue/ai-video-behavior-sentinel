'use client';

import React from 'react';
import { IncidentEvent } from '@/lib/types';
import { Clock } from 'lucide-react';

interface TimelineIncidentMarkerProps {
  durationSec: number;
  currentTimeSec: number;
  incidents: IncidentEvent[];
  onSeek: (timeSec: number) => void;
}

export const TimelineIncidentMarker: React.FC<TimelineIncidentMarkerProps> = ({
  durationSec = 120,
  currentTimeSec = 45,
  incidents = [],
  onSeek,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min((currentTimeSec / durationSec) * 100, 100);

  return (
    <div className="w-full bg-white rounded-2xl border border-[#E5E7EB] p-3 shadow-xs space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1.5 font-bold text-gray-800">
          <Clock className="w-3.5 h-3.5 text-brand-red" />
          <span>Timeline Sự Cố Video</span>
        </div>
        <div className="font-mono text-[11px] text-gray-500">
          <span className="font-bold text-brand-red">{formatTime(currentTimeSec)}</span> /{' '}
          {formatTime(durationSec)}
        </div>
      </div>

      {/* Progress Track & Marker Flags */}
      <div
        className="relative h-6 bg-gray-100 rounded-lg cursor-pointer flex items-center group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = clickX / rect.width;
          onSeek(ratio * durationSec);
        }}
      >
        {/* Played Bar */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-brand-red/20 rounded-lg transition-all"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Current Head */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-brand-red rounded-full ring-2 ring-white shadow-md z-20 pointer-events-none transition-all"
          style={{ left: `calc(${progressPercent}% - 7px)` }}
        />

        {/* Red / Amber Incident Markers */}
        {incidents.map((inc) => {
          const posPercent = (inc.relativeTimeSec / durationSec) * 100;
          const isCrit = inc.threatLevel === 'CRITICAL';
          return (
            <div
              key={inc.id}
              className="absolute top-0 bottom-0 w-2 flex flex-col items-center justify-center z-10 group/marker"
              style={{ left: `calc(${posPercent}% - 4px)` }}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(inc.relativeTimeSec);
              }}
            >
              <div
                className={`w-1.5 h-4 rounded-full ${
                  isCrit ? 'bg-brand-red animate-pulse' : 'bg-amber-500'
                }`}
              />

              {/* Hover Tooltip */}
              <div className="absolute bottom-7 hidden group-hover/marker:flex flex-col items-center bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none">
                <span className="font-bold">{inc.actionLabelVi}</span>
                <span className="text-gray-400 font-mono">
                  {formatTime(inc.relativeTimeSec)} - Nguy cơ: {inc.threatScore}%
                </span>
                <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mb-1 mt-0.5"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 px-1 pt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-red"></span> Vạch Đỏ: Nguy cơ cao (&gt;80%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Vạch Vàng: Đáng ngờ (50-80%)
          </span>
        </div>
        <span className="italic">Nhấp vào vạch đỏ để chuyển nhanh tới sự cố</span>
      </div>
    </div>
  );
};
