'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  Film, 
  Camera, 
  Bot, 
  AlertTriangle, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  ChevronRight,
  User,
  Sparkles,
  Settings2,
  Menu,
  MoreVertical
} from 'lucide-react';

interface SidebarNavProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  criticalCount?: number;
  activeModel?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ 
  isCollapsed,
  onToggleCollapse,
  criticalCount = 2,
  activeModel = 'gemini-2.5-flash'
}) => {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Phân Tích Video Upload',
      shortName: 'Video',
      href: '/dashboard',
      icon: Film,
      badge: 'Split 60/40',
      badgeColor: 'bg-blue-50 text-brand-blue border-blue-200',
    },
    {
      name: 'Quét Camera Trực Tiếp',
      shortName: 'Camera',
      href: '/dashboard/quet-camera-truc-tiep',
      icon: Camera,
      badge: 'Live AI',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      name: 'AI Copilot & Chatbot',
      shortName: 'Copilot',
      href: '/dashboard/ai-copilot',
      icon: Bot,
      badge: 'Gemini 2.5',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      name: 'Nhật Ký Cảnh Báo Admin',
      shortName: 'Cảnh Báo',
      href: '/dashboard/nhat-ky-canh-bao',
      icon: AlertTriangle,
      badge: `${criticalCount}`,
      badgeColor: criticalCount > 0 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-gray-100 text-gray-700 border-gray-200',
    },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-white border-r border-[#E2E8F0] z-40 flex flex-col transition-all duration-300 select-none ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <Link 
          href="/dashboard" 
          className={`flex items-center gap-3 group overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0 transition-transform group-hover:scale-105">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-[#0F172A]">
                  AI SENTINEL
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-blue-100 text-brand-blue tracking-wider">
                  2.5 PRO
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase truncate">
                Multi-Subject Vision AI
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-5 px-2.5 space-y-1.5 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Phân Hệ Giám Sát (4 Trang)
          </div>
        )}

        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center rounded-xl text-xs font-semibold transition-all group ${
                isCollapsed 
                  ? 'justify-center py-3 px-2' 
                  : 'justify-between px-3.5 py-2.5'
              } ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/30'
                  : 'text-[#1E293B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-brand-blue'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </div>

              {!isCollapsed && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isActive ? 'bg-white/20 text-white border-white/20' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* User Profile Card (Mandated: Lâm Thanh Phong - Student ID: 50.01.103.057) */}
        {!isCollapsed && (
          <div className="pt-6 px-1">
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] border border-blue-100 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0 ring-2 ring-white">
                  LP
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#0F172A] truncate">
                    Lâm Thanh Phong
                  </h4>
                  <p className="text-[10px] font-mono text-blue-700 font-semibold truncate">
                    MSSV: 50.01.103.057
                  </p>
                  <p className="text-[9px] text-gray-500 truncate">
                    ĐH Sư Phạm TP.HCM (HCMUE)
                  </p>
                </div>
              </div>
              <div className="pt-1 border-t border-gray-200/70 flex items-center justify-between text-[10px]">
                <span className="text-gray-500 font-medium">Vai trò:</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  AI Vision Lead
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Core AI Engine Spec */}
        {!isCollapsed && (
          <div className="pt-2 px-1">
            <div className="p-3 rounded-xl bg-white border border-gray-200 text-[10px] space-y-1.5">
              <div className="flex items-center justify-between font-bold text-gray-700">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-brand-blue" /> Model AI Hiện Tại
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="font-mono text-brand-blue font-bold truncate">
                {activeModel}
              </p>
              <div className="flex justify-between text-gray-500">
                <span>Multi-Target BBox:</span>
                <span className="text-emerald-600 font-bold">Chuẩn hóa 0-1000</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Slicing:</span>
                <span className="text-emerald-600 font-bold">Dynamic Float (s)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Toggle & Hardware stats */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        {isCollapsed ? (
          <button
            onClick={onToggleCollapse}
            title="Mở rộng menu (☰)"
            className="w-full py-2 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-brand-blue hover:border-blue-200 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-600">
              <span className="flex items-center gap-1 font-semibold">
                <Cpu className="w-3.5 h-3.5 text-gray-400" /> Tải hệ thống
              </span>
              <span className="font-bold text-brand-blue">Edge CV: 28 FPS</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Sentinel v2.5.0-PRO</span>
              <button 
                onClick={onToggleCollapse}
                className="text-gray-500 hover:text-brand-blue font-semibold flex items-center gap-0.5"
              >
                Thu gọn ◀
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
