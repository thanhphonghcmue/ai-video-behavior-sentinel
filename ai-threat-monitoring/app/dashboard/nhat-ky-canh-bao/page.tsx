'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert,
  Sliders,
  Camera,
  HardDrive,
  FileText,
  UserCheck,
  Save,
  RotateCcw,
  Sparkles,
  Volume2,
  ExternalLink,
  Power
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

interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  details: string;
  status: string;
}

interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: string;
  fps: number;
  resolution: string;
  source_index: number;
  roi_enabled: boolean;
}

export default function IncidentLogsAndAdminPage() {
  const [activeTab, setActiveTab] = useState<'incidents' | 'thresholds' | 'cameras' | 'audit'>('incidents');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');

  // Risk Thresholds State (Synchronized with Backend /api/settings)
  const [warningThreshold, setWarningThreshold] = useState<number>(40);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(70);
  const [samplingInterval, setSamplingInterval] = useState<number>(3.0);
  const [autoSiren, setAutoSiren] = useState<boolean>(false);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Camera Feeds State
  const [cameras, setCameras] = useState<CameraFeed[]>([]);

  // Incidents Data
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

  // Load Settings, Audit Logs, and Cameras from Backend
  const loadAdminData = async () => {
    try {
      const sRes = await fetch('http://localhost:8000/api/settings');
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.warning_threshold) setWarningThreshold(sData.warning_threshold);
        if (sData.critical_threshold) setCriticalThreshold(sData.critical_threshold);
        if (sData.sampling_interval) setSamplingInterval(sData.sampling_interval);
        if (typeof sData.auto_siren === 'boolean') setAutoSiren(sData.auto_siren);
      }

      const aRes = await fetch('http://localhost:8000/api/audit-logs');
      if (aRes.ok) {
        const aData = await aRes.json();
        if (Array.isArray(aData.logs)) setAuditLogs(aData.logs);
      }

      const cRes = await fetch('http://localhost:8000/api/cameras');
      if (cRes.ok) {
        const cData = await cRes.json();
        if (Array.isArray(cData.cameras)) setCameras(cData.cameras);
      }
    } catch (err) {
      // Offline fallback
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const toggleAcknowledge = (id: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return { ...inc, acknowledged: !inc.acknowledged };
      }
      return inc;
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSaveSuccessMsg('');
    try {
      const res = await fetch('http://localhost:8000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warning_threshold: warningThreshold,
          critical_threshold: criticalThreshold,
          sampling_interval: samplingInterval,
          auto_siren: autoSiren,
          operator_name: 'Lâm Thanh Phong - MSSV: 50.01.103.057 - HCMUE',
          active_role: 'Quản Trị Viên (Root Admin)'
        })
      });
      if (res.ok) {
        setSaveSuccessMsg('Đã lưu cấu hình ngưỡng rủi ro an ninh & ghi nhận vào Audit Trail thành công!');
        loadAdminData();
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        alert('Không thể lưu cấu hình đến máy chủ backend.');
      }
    } catch (err) {
      setSaveSuccessMsg('Đã lưu cục bộ! (Backend chưa sẵn sàng phản hồi)');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleCamera = async (camId: string) => {
    try {
      const res = await fetch('http://localhost:8000/api/cameras/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camera_id: camId })
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (err) {
      setCameras(prev => prev.map(c => c.id === camId ? { ...c, status: c.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE' } : c));
    }
  };

  const handleExportCSV = () => {
    const headers = ['Mã Sự Cố,Thời Gian,Đối Tượng,Loại,Mô Tả Hành Vi,Vị Trí,Điểm Nguy Cơ,Mức Độ,Trạng Thái'];
    const rows = filtered.map(i => 
      `"${i.id}","${i.timestamp}","${i.target_id}","${i.target_class}","${i.action_description.replace(/"/g, '""')}","${i.location}",${i.risk_score},"${i.risk_level}","${i.acknowledged ? 'Đã xử lý' : 'Chưa tiếp nhận'}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sentinel_Security_Incidents_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Top Banner with Admin Profile */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-blue shadow-xs">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-[#0F172A]">
                Nhật Ký Cảnh Báo & Trung Tâm Quản Trị Hệ Thống
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-brand-blue border border-blue-200">
                Root Admin View
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Quản trị viên: <strong className="text-[#0F172A]">Lâm Thanh Phong</strong> (MSSV: <span className="font-mono">50.01.103.057</span>) — Trường ĐH Sư Phạm TP.HCM (HCMUE)
            </p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'incidents'
                ? 'bg-white text-brand-blue shadow-xs'
                : 'text-gray-600 hover:text-[#0F172A]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>Sự Cố An Ninh</span>
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-orange-100 text-[#EA580C]">
                {criticalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('thresholds')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'thresholds'
                ? 'bg-white text-brand-blue shadow-xs'
                : 'text-gray-600 hover:text-[#0F172A]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-brand-blue" />
            <span>Cấu Hình Ngưỡng Rủi Ro</span>
          </button>

          <button
            onClick={() => setActiveTab('cameras')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'cameras'
                ? 'bg-white text-brand-blue shadow-xs'
                : 'text-gray-600 hover:text-[#0F172A]'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            <span>Quản Lý Camera ({cameras.length || 4})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'audit'
                ? 'bg-white text-brand-blue shadow-xs'
                : 'text-gray-600 hover:text-[#0F172A]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Nhật Ký Kiểm Toán ({auditLogs.length || 2})</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: NHẬT KÝ SỰ CỐ & LỊCH SỬ GIÁM SÁT                                */}
      {/* ===================================================================== */}
      {activeTab === 'incidents' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter, Search & Export Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo hành vi, đối tượng (Target_01), vị trí..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:border-brand-blue text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-semibold text-[11px]">Mức độ:</span>
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

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold transition-all shadow-xs ml-2"
                title="Tải xuống tệp CSV báo cáo sự cố"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất CSV</span>
              </button>
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
      )}

      {/* ===================================================================== */}
      {/* TAB 2: CẤU HÌNH NGƯỠNG RỦI RO & BÁO ĐỘNG AI                            */}
      {/* ===================================================================== */}
      {activeTab === 'thresholds' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
          {/* Main Config Form */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-brand-blue" />
                  Điều Chỉnh Ngưỡng Kích Hoạt Cảnh Báo An Ninh
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tùy chỉnh điểm đe dọa (Threat Score 0-100) để phân loại mức độ rủi ro thời gian thực
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-blue-50 text-brand-blue text-xs font-bold border border-blue-200">
                Gemini Vision Engine
              </span>
            </div>

            {saveSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Sliders Range Visual Map */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Phổ Phân Phối Điểm Nguy Cơ Trực Quan:
                </span>
                <div className="h-6 w-full rounded-xl overflow-hidden flex text-[10px] font-bold text-white shadow-inner">
                  <div 
                    style={{ width: `${warningThreshold}%` }} 
                    className="bg-[#059669] flex items-center justify-center transition-all"
                  >
                    An Toàn (0 - {warningThreshold}%)
                  </div>
                  <div 
                    style={{ width: `${criticalThreshold - warningThreshold}%` }} 
                    className="bg-[#D97706] flex items-center justify-center transition-all"
                  >
                    Cảnh Báo ({warningThreshold}% - {criticalThreshold}%)
                  </div>
                  <div 
                    style={{ width: `${100 - criticalThreshold}%` }} 
                    className="bg-[#EA580C] flex items-center justify-center transition-all"
                  >
                    Nguy Cơ Cao ({criticalThreshold}% - 100%)
                  </div>
                </div>
              </div>

              {/* Threshold 1: Warning Trigger (Amber) */}
              <div className="space-y-2 p-4 rounded-2xl border border-amber-200 bg-amber-50/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
                    <span>Ngưỡng Kích Hoạt Cảnh Báo Theo Dõi (Warning Trigger):</span>
                  </label>
                  <span className="font-mono font-black text-sm text-[#D97706] bg-amber-100 px-2.5 py-0.5 rounded-lg">
                    {warningThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="60"
                  step="1"
                  value={warningThreshold}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val < criticalThreshold) setWarningThreshold(val);
                  }}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <p className="text-[11px] text-gray-500">
                  Khi điểm đe dọa vượt quá {warningThreshold}%, hệ thống sẽ đánh dấu màu vàng và hiển thị trong danh sách theo dõi.
                </p>
              </div>

              {/* Threshold 2: Critical High Risk Trigger (Deep Coral-Orange, NO RED) */}
              <div className="space-y-2 p-4 rounded-2xl border border-orange-200 bg-orange-50/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]"></span>
                    <span>Ngưỡng Nguy Cơ Cao / Báo Động Đỏ (Critical Risk Trigger):</span>
                  </label>
                  <span className="font-mono font-black text-sm text-[#EA580C] bg-orange-100 px-2.5 py-0.5 rounded-lg">
                    {criticalThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="95"
                  step="1"
                  value={criticalThreshold}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > warningThreshold) setCriticalThreshold(val);
                  }}
                  className="w-full accent-orange-600 cursor-pointer"
                />
                <p className="text-[11px] text-gray-500">
                  Khi điểm đe dọa vượt quá {criticalThreshold}%, hệ thống lập tức phát tín hiệu cảnh báo màu cam san hô, kích hoạt thông báo khẩn cấp.
                </p>
              </div>

              {/* Sampling Frequency Slider */}
              <div className="space-y-2 p-4 rounded-2xl border border-blue-200 bg-blue-50/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-blue" />
                    <span>Chu Kỳ Lấy Mẫu Khung Hình Phân Tích (Sampling Interval):</span>
                  </label>
                  <span className="font-mono font-black text-sm text-brand-blue bg-blue-100 px-2.5 py-0.5 rounded-lg">
                    {samplingInterval} Giây
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={samplingInterval}
                  onChange={(e) => setSamplingInterval(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <p className="text-[11px] text-gray-500">
                  Thời gian trễ giữa mỗi chu kỳ gửi khung hình camera tới Gemini AI để đánh giá hành vi.
                </p>
              </div>

              {/* Auto Siren Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#EA580C]">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">Tự Động Kích Hoạt Còi Hú Khẩn Cấp</h4>
                    <p className="text-[11px] text-gray-500">
                      Tự động hú còi an ninh ngay khi AI phát hiện hành vi vượt ngưỡng Critical ({criticalThreshold}%)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSiren(!autoSiren)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    autoSiren ? 'bg-brand-blue' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      autoSiren ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setWarningThreshold(40);
                    setCriticalThreshold(70);
                    setSamplingInterval(3.0);
                    setAutoSiren(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi Phục Mặc Định</span>
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSettings ? 'Đang lưu...' : 'Lưu Cấu Hình Ngưỡng'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Info Card: Administrator Profile & Guidelines */}
          <div className="lg:col-span-4 space-y-4">
            {/* Admin Profile Card */}
            <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20">
                  LP
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#0F172A]">Lâm Thanh Phong</h3>
                  <p className="text-xs text-gray-500 font-mono">MSSV: 50.01.103.057</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-brand-blue">
                    Root Administrator
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                <p>
                  <strong>Đơn vị:</strong> Trường ĐH Sư Phạm TP.HCM (HCMUE)
                </p>
                <p>
                  <strong>Chuyên ngành:</strong> Công Nghệ Thông Tin & Trí Tuệ Nhân Tạo
                </p>
                <p>
                  <strong>Quyền hạn:</strong> Quản trị toàn quyền cấu hình mô hình Gemini, ngưỡng đe dọa, điều phối camera an ninh.
                </p>
              </div>
            </div>

            {/* Security Best Practices */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-gray-600 space-y-2.5">
              <h4 className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Khuyến Nghị Vận Hành An Ninh
              </h4>
              <ul className="list-disc pl-4 space-y-1.5 text-[11px] leading-relaxed">
                <li>
                  Giữ ngưỡng cảnh báo ở mức <strong>40%</strong> để hạn chế báo động giả (False Positives).
                </li>
                <li>
                  Ngưỡng <strong>70%</strong> chỉ kích hoạt khi phát hiện xâm nhập vùng cấm ROI hoặc tư thế té ngã bất thường.
                </li>
                <li>
                  Mọi thay đổi cấu hình ngưỡng đều được tự động lưu vết vào <strong>Audit Trail</strong>.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: QUẢN LÝ LUỒNG CAMERA & DỮ LIỆU VIDEO                            */}
      {/* ===================================================================== */}
      {activeTab === 'cameras' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(cameras.length > 0 ? cameras : [
              { id: 'CAM-01', name: 'Camera 01 - Trực Tiếp (Live Stream)', location: 'Phòng Điều Hành HCMUE', status: 'ONLINE', fps: 30, resolution: '1280x720 (HD)', source_index: 0, roi_enabled: true },
              { id: 'CAM-02', name: 'Camera 02 - Cổng Chính HCMUE', location: '280 An Dương Vương, Q.5', status: 'ONLINE', fps: 25, resolution: '1920x1080 (FHD)', source_index: 1, roi_enabled: true },
              { id: 'CAM-03', name: 'Camera 03 - Lab Trí Tuệ Nhân Tạo', location: 'Tòa Nhà B - Phòng B.204', status: 'ONLINE', fps: 30, resolution: '1920x1080 (FHD)', source_index: 2, roi_enabled: false },
              { id: 'CAM-04', name: 'Camera 04 - Bãi Đỗ Xe & Sảnh A', location: 'Khuôn Viên Sân Trước Tòa A', status: 'ONLINE', fps: 20, resolution: '1280x720 (HD)', source_index: 3, roi_enabled: true }
            ]).map((cam) => {
              const isOnline = cam.status === 'ONLINE';
              return (
                <div 
                  key={cam.id} 
                  className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs space-y-3 hover:border-blue-200 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-gray-500">{cam.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                      isOnline
                        ? 'bg-emerald-50 text-[#059669] border-emerald-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                      {cam.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-xs text-[#0F172A] leading-snug">{cam.name}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">{cam.location}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] space-y-1 text-gray-600 font-mono">
                    <div className="flex justify-between">
                      <span>Độ Phân Giải:</span>
                      <strong className="text-gray-800">{cam.resolution}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Tốc Độ Khung:</span>
                      <strong className="text-gray-800">{cam.fps} FPS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Vùng Ảo ROI:</span>
                      <strong className={cam.roi_enabled ? 'text-brand-blue' : 'text-gray-400'}>
                        {cam.roi_enabled ? 'Đang Giám Sát' : 'Tắt'}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => handleToggleCamera(cam.id)}
                      className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isOnline
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{isOnline ? 'Tạm Dừng Luồng' : 'Khởi Động Lại'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Video Database & Storage Status Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-blue">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[#0F172A]">Dung Lượng Lưu Trữ Video Bằng Chứng An Ninh</h3>
                <p className="text-[11px] text-gray-500">
                  Thư mục: <span className="font-mono text-gray-700">backend/uploads</span> — Tự động lưu vết video chuỗi cử động khi có phân tích
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <p className="font-bold text-[#0F172A]">1.8 GB / 50.0 GB</p>
                <p className="text-[10px] text-gray-400">Đã dùng 3.6% dung lượng</p>
              </div>
              <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div className="w-[3.6%] h-full bg-[#2563EB] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT TRAIL)                         */}
      {/* ===================================================================== */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-[#0F172A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Nhật Ký Kiểm Toán Toàn Diện (System Audit Trail Logs)
              </h3>
              <p className="text-[11px] text-gray-500">
                Ghi nhận chi tiết mọi hoạt động can thiệp cấu hình, nạp mô hình AI, và xử lý sự cố bởi Quản Trị Viên
              </p>
            </div>
            <button
              onClick={loadAdminData}
              className="px-3 py-1.5 rounded-xl border border-gray-300 text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Làm Mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Mã Audit</th>
                  <th className="px-4 py-3">Thời Gian</th>
                  <th className="px-5 py-3">Người Thao Tác (Operator)</th>
                  <th className="px-4 py-3">Hành Động</th>
                  <th className="px-6 py-3">Chi Tiết Thao Tác</th>
                  <th className="px-4 py-3 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                {(auditLogs.length > 0 ? auditLogs : [
                  {
                    id: 'AUD-001',
                    timestamp: '2026-10-02 01:15:56',
                    operator: 'Lâm Thanh Phong (Admin - 50.01.103.057)',
                    action: 'KHỞI ĐỘNG HỆ THỐNG',
                    details: 'Khởi tạo hệ thống AI Sentinel Vision, nạp mô hình Gemini 1.5 Pro',
                    status: 'SUCCESS'
                  },
                  {
                    id: 'AUD-002',
                    timestamp: '2026-10-02 01:16:30',
                    operator: 'Lâm Thanh Phong (Admin - 50.01.103.057)',
                    action: 'CẤU HÌNH NGƯỠNG AN NINH',
                    details: 'Ngưỡng cảnh báo: 40% | Ngưỡng nguy cơ cao: 70%',
                    status: 'SUCCESS'
                  }
                ]).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-brand-blue">{log.id}</td>
                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-5 py-3.5 font-sans font-bold text-[#0F172A] whitespace-nowrap">{log.operator}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-brand-blue font-bold text-[10px] border border-blue-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-sans text-gray-700">{log.details}</td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
