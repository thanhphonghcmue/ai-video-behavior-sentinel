'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldAlert, 
  Camera, 
  AlertTriangle, 
  Settings2, 
  Cpu, 
  Layers, 
  Activity, 
  CheckCircle2, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface SidebarNavProps {
  criticalCount?: number;
  warningCount?: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ 
  criticalCount = 3, 
  warningCount = 5 
}) => {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Tổng Quan Giám Sát',
      href: '/dashboard',
      icon: Activity,
      badge: 'Live',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      name: 'Phân Tích Camera AI',
      href: '/dashboard/giam-sat-camera',
      icon: Camera,
      badge: '4K Stream',
      badgeColor: 'bg-red-50 text-brand-red border-red-200',
    },
    {
      name: 'Nhật Ký Cảnh Báo',
      href: '/dashboard/nhat-ky-canh-bao',
      icon: AlertTriangle,
      badge: `${criticalCount + warningCount}`,
      badgeColor: 'bg-brand-red text-white border-transparent',
    },
    {
      name: 'Cấu Hình Nguy Cơ & ROI',
      href: '/dashboard/cau-hinh-nguy-co',
      icon: Settings2,
      badge: 'AI Config',
      badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col h-screen fixed left-0 top-0 z-40 select-none">
      {/* Brand Header: SENTINEL AI Security */}
      <div className="h-16 px-5 border-b border-[#E5E7EB] flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red to-brand-darkRed flex items-center justify-center text-white shadow-md shadow-brand-red/25 transition-transform group-hover:scale-105">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-[#0F172A]">
                SENTINEL <span className="text-brand-red">AI</span>
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-red-100 text-brand-red tracking-wider">
                VISION
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase">AI Threat Surveillance</p>
          </div>
        </Link>
      </div>

      {/* Navigation Menu (Pill-badge design) */}
      <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Phân Hệ Giám Sát
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-brand-red text-white shadow-sm shadow-brand-red/30'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-[#111827]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-brand-red'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isActive ? 'bg-white/20 text-white border-white/20' : item.badgeColor
                }`}
              >
                {item.badge}
              </span>
            </Link>
          );
        })}

        {/* Core AI Module Info */}
        <div className="pt-6 px-3">
          <div className="p-3.5 rounded-2xl bg-[#F4F6F8] border border-gray-200/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-red" />
                Cốt lõi AI Engine
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed font-mono truncate">
              Sentinel Vision Core // 2.5
            </p>
            <div className="text-[10px] text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>• YOLOv3 / OpenCV:</span>
                <span className="font-semibold text-emerald-600">Sẵn sàng (30 FPS)</span>
              </div>
              <div className="flex justify-between">
                <span>• Lightweight OpenPose:</span>
                <span className="font-semibold text-emerald-600">18 Khớp xương</span>
              </div>
              <div className="flex justify-between">
                <span>• Gemini 2.5 Flash:</span>
                <span className="font-semibold text-emerald-600">Multimodal AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Resource Footer */}
      <div className="p-4 border-t border-[#E5E7EB] bg-gray-50/50">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span className="flex items-center gap-1.5 font-medium">
            <Cpu className="w-3.5 h-3.5 text-gray-500" /> Tải phần cứng
          </span>
          <span className="text-[11px] font-bold text-brand-red">GPU RTX 4090: 42%</span>
        </div>
        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-brand-red h-full rounded-full w-[42%] transition-all duration-500"></div>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400">
          <span>Phiên bản v2.4.0-PRO</span>
          <span className="text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 30 FPS
          </span>
        </div>
      </div>
    </aside>
  );
};
