'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert,
  FileSpreadsheet,
  Check,
  Eye,
  Trash2
} from 'lucide-react';

interface IncidentRecord {
  id: string;
  timestamp: string;
  target_id: string;
  target_class: string;
  action_description: string;
  location: string;
  risk_score: number;
  risk_level: 'CRITICAL' | 'WARNING' | 'NORMAL';
  acknowledged: boolean;
}

export default function IncidentLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');

  const [incidents, setIncidents] = useState<IncidentRecord[]>([
    {
      id: 'INC-2026-001',
      timestamp: '14:25:10 - Hôm nay',
      target_id: 'Target_01',
      target_class: 'Person',
      action_description: 'Xâm nhập khu vực kiểm soát an ninh chưa được xác thực quyền',
      location: 'Cửa Kho Giám Sát A1',
      risk_score: 85,
      risk_level: 'CRITICAL',
      acknowledged: false,
    },
    {
      id: 'INC-2026-002',
      timestamp: '14:18:42 - Hôm nay',
      target_id: 'Target_02',
      target_class: 'Motorbike',
      action_description: 'Phương tiện lấn làn tốc độ cao gần khu vực dành cho người đi bộ',
      location: 'Lối Vào Cổng 2',
      risk_score: 74,
      risk_level: 'CRITICAL',
      acknowledged: true,
    },
    {
      id: 'INC-2026-003',
      timestamp: '13:52:15 - Hôm nay',
      target_id: 'Target_03',
      target_class: 'Person',
      action_description: 'Cúi người lảng vảng quan sát vị trí tủ tài liệu nhạy cảm',
      location: 'Hành Lang Tầng 1',
      risk_score: 55,
      risk_level: 'WARNING',
      acknowledged: true,
    },
    {
      id: 'INC-2026-004',
      timestamp: '13:10:04 - Hôm nay',
      target_id: 'Target_01',
      target_class: 'Person',
      action_description: 'Chủ thể té ngã bất thường cần hỗ trợ y tế',
      location: 'Khu Vực Chờ Sảnh Chính',
      risk_score: 92,
      risk_level: 'CRITICAL',
      acknowledged: true,
    },
    {
      id: 'INC-2026-005',
      timestamp: '12:40:22 - Hôm nay',
      target_id: 'Target_04',
      target_class: 'Pedestrian',
      action_description: 'Dừng chân quan sát biển hiệu, lưu thông thông thường',
      location: 'Lối Đi Bộ Phía Đông',
      risk_score: 22,
      risk_level: 'NORMAL',
      acknowledged: true,
    }
  ]);

  const toggleAcknowledge = (id: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return { ...inc, acknowledged: !inc.acknowledged };
      }
      return inc;
    }));
  };

  const filtered = incidents.filter((inc) => {
    const matchesSearch = inc.action_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.target_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'ALL' || inc.risk_level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const criticalCount = incidents.filter(i => i.risk_level === 'CRITICAL' && !i.acknowledged).length;

  return (
    <div className="space-y-5 max-w-[1720px] mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#EA580C]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#0F172A]">
                Nhật Ký Cảnh Báo An Ninh & Sự Cố Admin
              </h1>
              {criticalCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#EA580C] animate-pulse">
                  {criticalCount} Sự cố chưa xử lý
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Hệ thống lưu vết kiểm toán toàn diện các hành vi nguy cơ được phát hiện bởi Gemini AI Vision
            </p>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={() => alert('Xuất báo cáo nhật ký sự cố an ninh (CSV/Excel) thành công!')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Báo Cáo Sự Cố (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo hành vi, đối tượng (Target_01), vị trí..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:border-brand-blue"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-semibold text-[11px]">Mức độ đe dọa:</span>
          {['ALL', 'CRITICAL', 'WARNING', 'NORMAL'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                filterLevel === lvl
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lvl === 'ALL' ? 'Tất cả' : lvl === 'CRITICAL' ? 'Nguy cơ cao' : lvl === 'WARNING' ? 'Cảnh báo' : 'Bình thường'}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Mã Sự Cố</th>
                <th className="px-4 py-3.5">Thời Gian</th>
                <th className="px-4 py-3.5">Chủ Thể</th>
                <th className="px-5 py-3.5">Mô Tả Hành Vi Phát Hiện</th>
                <th className="px-4 py-3.5">Vị Trí</th>
                <th className="px-4 py-3.5">Nguy Cơ</th>
                <th className="px-4 py-3.5">Trạng Thái</th>
                <th className="px-4 py-3.5 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    Không tìm thấy sự cố nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => {
                  const isCritical = inc.risk_level === 'CRITICAL';
                  const isWarning = inc.risk_level === 'WARNING';

                  return (
                    <tr 
                      key={inc.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        !inc.acknowledged && isCritical ? 'bg-orange-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-[#0F172A]">
                        {inc.id}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                        {inc.timestamp}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-[#0F172A]">{inc.target_id}</span>
                        <span className="block text-[10px] text-gray-400 font-medium">({inc.target_class})</span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-800 max-w-[320px]">
                        {inc.action_description}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap font-medium">
                        {inc.location}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isCritical
                            ? 'bg-orange-50 text-[#EA580C] border-orange-200'
                            : isWarning
                            ? 'bg-amber-50 text-[#D97706] border-amber-200'
                            : 'bg-emerald-50 text-[#059669] border-emerald-200'
                        }`}>
                          {inc.risk_score}% {isCritical ? 'CAO' : isWarning ? 'CẢNH BÁO' : 'AN TOÀN'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {inc.acknowledged ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã xử lý
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#EA580C]">
                            <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-ping"></span>
                            Chưa tiếp nhận
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => toggleAcknowledge(inc.id)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                            inc.acknowledged
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs'
                          }`}
                        >
                          {inc.acknowledged ? 'Đánh dấu chưa xử lý' : 'Xác nhận xử lý'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
