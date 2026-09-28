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
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#111827] flex flex-col font-sans">
      {/* Left Navigation Sidebar */}
      <SidebarNav />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <TopHeader
          currentThreatLevel={currentThreatLevel}
          onOpenSirenModal={() => setIsSirenActive(true)}
        />

        {/* Main Content Pane */}
        <main className="ml-64 flex-1 p-5 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Emergency Siren Modal Overlay */}
      {isSirenActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border-2 border-brand-red shadow-2xl overflow-hidden">
            <div className="bg-brand-red p-6 text-white text-center relative">
              <button
                onClick={() => setIsSirenActive(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3 animate-bounce">
                <Volume2 className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-wide">
                KÍCH HOẠT CÒI BÁO ĐỘNG KHẨN CẤP
              </h2>
              <p className="text-xs text-white/80 mt-1">
                Tín hiệu còi báo âm lượng cao & đèn cảnh báo đỏ tại điểm giám sát
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-brand-red flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>
                  Hành động này sẽ gửi tín hiệu ưu tiên cao nhất tới toàn bộ nhân viên an ninh hiện trường và tự động lưu đoạn video bằng chứng.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Lý do kích hoạt nhanh:</label>
                <select className="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-brand-red font-medium">
                  <option>Xâm nhập vùng cấm chưa được cấp phép</option>
                  <option>Phát hiện ẩu đả / Vung tay bạo lực nguy hiểm</option>
                  <option>Đối tượng khả nghi lục lọi tủ tiền / quầy hàng</option>
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
                    alert("CÒI BÁO ĐỘNG ĐÃ ĐƯỢC PHÁT! Đèn báo động khu vực đang chớp đỏ.");
                    setIsSirenActive(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-brand-red text-white text-xs font-bold hover:bg-brand-darkRed transition-colors shadow-md shadow-brand-red/30 active:scale-95"
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
