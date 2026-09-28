'use client';

import React, { useState } from 'react';
import { AlertTriangle, Clock, Search, Filter, Download, CheckCircle2, ShieldAlert } from 'lucide-react';
import { IncidentEvent } from '@/lib/types';

export default function IncidentLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');

  const [incidents, setIncidents] = useState<IncidentEvent[]>([
    {
      id: 'INC-2026-001',
      timestamp: '14:02:15 - 26/09/2026',
      relativeTimeSec: 25,
      action: 'ROI_INTRUSION',
      actionLabelVi: 'Xâm nhập Vùng Cấm (ROI)',
      threatScore: 89,
      threatLevel: 'CRITICAL',
      personId: 'SUBJ-001',
      personLabel: 'Huỳnh Tấn (Dlib #01)',
      location: 'Cửa Kho Bảo Mật A2',
      description: 'Đối tượng vượt qua ranh giới ảo đã thiết lập bằng vạch đỏ',
      acknowledged: false,
    },
    {
      id: 'INC-2026-002',
      timestamp: '14:03:40 - 26/09/2026',
      relativeTimeSec: 85,
      action: 'PUNCHING_VIOLENCE',
      actionLabelVi: 'Vung tay bạo lực (Gia tốc cao)',
      threatScore: 94,
      threatLevel: 'CRITICAL',
      personId: 'SUBJ-001',
      personLabel: 'Huỳnh Tấn (Dlib #01)',
      location: 'Hành Lang Tiền Sảnh',
      description: 'Cử chỉ vung tay tấn công với gia tốc cổ tay 112 px/s',
      acknowledged: true,
    },
    {
      id: 'INC-2026-003',
      timestamp: '14:04:10 - 26/09/2026',
      relativeTimeSec: 130,
      action: 'BENDING_LOITERING',
      actionLabelVi: 'Cúi người lục lọi tủ đồ',
      threatScore: 68,
      threatLevel: 'MEDIUM',
      personId: 'SUBJ-001',
      personLabel: 'Huỳnh Tấn (Dlib #01)',
      location: 'Khu Vực Quầy Giao Dịch Trung Tâm',
      description: 'Góc nghiêng thân trên gập 55 độ gần khu vực linh kiện giá trị',
      acknowledged: true,
    },
    {
      id: 'INC-2026-004',
      timestamp: '13:48:22 - 26/09/2026',
      relativeTimeSec: 210,
      action: 'SUDDEN_FALL',
      actionLabelVi: 'Té ngã bất thường',
      threatScore: 91,
      threatLevel: 'CRITICAL',
      personId: 'SUBJ-004',
      personLabel: 'Khách hàng nữ #04',
      location: 'Cầu Thang Tầng 1',
      description: 'Trục thẳng đứng thân người ngã song song mặt sàn trong 0.4s',
      acknowledged: true,
    },
  ]);

  const filtered = incidents.filter((inc) => {
    const matchesSearch = inc.actionLabelVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.personLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'ALL' || inc.threatLevel === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200">
        <div>
          <h1 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-brand-red" />
            Nhật Ký Sự Cố Cảnh Báo An Ninh (Incident Audit Log)
          </h1>
          <p className="text-xs text-gray-500">
            Lịch sử toàn diện các hành vi nguy cơ được trích xuất từ mạng 2s-AGCN và sự cố xâm phạm ROI
          </p>
        </div>

        <button
          onClick={() => alert('Xuất file nhật ký Excel thành công!')}
          className="px-4 py-2 rounded-xl bg-brand-red text-white text-xs font-bold hover:bg-brand-darkRed flex items-center gap-2 shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Báo Cáo Excel</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sự cố theo hành vi, đối tượng, khu vực..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-red focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-gray-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Lọc cấp độ:
          </span>
          {['ALL', 'CRITICAL', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                filterLevel === lvl
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {lvl === 'ALL' ? 'Tất cả' : lvl === 'CRITICAL' ? 'Nguy cấp (>80%)' : lvl === 'MEDIUM' ? 'Cảnh báo (50-80%)' : 'An toàn'}
            </button>
          ))}
        </div>
      </div>

      {/* Incident Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
            <tr>
              <th className="p-3.5">Mã Sự Cố</th>
              <th className="p-3.5">Thời Gian</th>
              <th className="p-3.5">Hành Vi Nhận Diện (AI)</th>
              <th className="p-3.5">Mức Độ Nguy Cơ</th>
              <th className="p-3.5">Đối Tượng Nhận Dạng</th>
              <th className="p-3.5">Vị Trí Camera</th>
              <th className="p-3.5">Trạng Thái Xử Lý</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((item) => {
              const isCrit = item.threatLevel === 'CRITICAL';
              return (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-gray-800">{item.id}</td>
                  <td className="p-3.5 text-gray-500 font-mono">{item.timestamp}</td>
                  <td className="p-3.5 font-bold text-gray-900">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isCrit ? 'bg-brand-red animate-ping' : 'bg-amber-500'}`} />
                      {item.actionLabelVi}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                      isCrit ? 'bg-red-50 text-brand-red border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.threatScore}% ({item.threatLevel})
                    </span>
                  </td>
                  <td className="p-3.5 font-medium text-gray-700">{item.personLabel}</td>
                  <td className="p-3.5 text-gray-600">{item.location}</td>
                  <td className="p-3.5">
                    {item.acknowledged ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác nhận
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-brand-red font-bold text-[11px] bg-red-50 px-2 py-0.5 rounded-full border border-red-200 animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5" /> Chưa xử lý
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
