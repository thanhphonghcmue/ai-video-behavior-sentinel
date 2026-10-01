'use client';

import React, { useState } from 'react';
import { SidebarNav } from './SidebarNav';
import { TopHeader } from './TopHeader';
import { ThreatLevel } from '@/lib/types';
import { AlertCircle, Volume2, X } from 'lucide-react';

interface DashboardShellProps {
  children: React.ReactNode;
  currentThreatLevel?: ThreatLevel;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
  currentThreatLevel = 'LOW',
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const [activeModel, setActiveModel] = useState<string>('gemini-2.5-flash');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      {/* Left Collapsible Navigation Sidebar */}
      <SidebarNav
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeModel={activeModel}
      />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <TopHeader
          currentThreatLevel={currentThreatLevel}
          onOpenSirenModal={() => setIsSirenActive(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activeModel={activeModel}
          onModelChange={(m) => setActiveModel(m)}
        />

        {/* Main Content Pane */}
        <main 
          className={`flex-1 p-5 overflow-y-auto transition-all duration-300 ${
            isSidebarCollapsed ? 'ml-18' : 'ml-64'
          }`}
        >
          {children}
        </main>
      </div>

      {/* Emergency Siren Modal Overlay (Uses Deep Coral-Orange, NO RED) */}
      {isSirenActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-orange-200 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-white text-center relative">
              <button
                onClick={() => setIsSirenActive(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/20 flex items-center justify-center mb-3 animate-bounce">
                <Volume2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-wide">
                KÍCH HOẠT CÒI BÁO ĐỘNG HIỆN TRƯỜNG
              </h2>
              <p className="text-xs text-orange-100 mt-1">
                Tín hiệu còi báo âm lượng cao & đèn cảnh báo tại điểm giám sát
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-xs text-[#EA580C] flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  Hành động này sẽ gửi tín hiệu cảnh báo ưu tiên cao nhất tới nhân viên an ninh và tự động lưu video bằng chứng vào nhật ký.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Lý do kích hoạt nhanh:</label>
                <select className="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-brand-blue font-medium">
                  <option>Xâm nhập vùng cấm / Khu vực nhạy cảm</option>
                  <option>Phát hiện ẩu đả / Cử chỉ nguy hiểm bạo lực</option>
                  <option>Đối tượng lén lút lảng vảng quá lâu</option>
                  <option>Người té ngã bất thường cần trợ giúp y tế</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsSirenActive(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  onClick={() => {
                    alert("CÒI BÁO ĐỘNG ĐÃ ĐƯỢC PHÁT! Đèn báo động khu vực đang chớp sáng.");
                    setIsSirenActive(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#EA580C] text-white text-xs font-bold hover:bg-orange-700 transition-colors shadow-md shadow-orange-500/30 active:scale-95"
                >
                  BẬT CÒI HÚ NGAY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
