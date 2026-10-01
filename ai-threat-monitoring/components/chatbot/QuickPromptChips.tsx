'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface QuickPromptChipsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickPromptChips: React.FC<QuickPromptChipsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  const suggestions = [
    { label: '🔍 Tóm tắt 5 phút qua', query: 'Tóm tắt các hành vi của đối tượng trong 5 phút vừa qua' },
    { label: '🚨 Ai vừa vượt vùng cấm?', query: 'Có đối tượng nào vừa vượt qua ranh giới vùng cấm ROI không?' },
    { label: '📊 Phân tích tư thế bạo lực', query: 'Phân tích các cử chỉ vung tay bạo lực và gia tốc khớp' },
    { label: '👤 Kiểm tra hồ sơ đối tượng', query: 'Trích xuất mã đối tượng đang theo dõi và mức nguy cơ' },
    { label: '📋 Lập biên bản sự cố', query: 'Tạo bản tóm tắt sự cố để xuất file báo cáo ngay' },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
        <Sparkles className="w-3 h-3 text-brand-blue" />
        <span>Câu Hỏi Gợi Ý Nhanh:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((item, index) => (
          <button
            key={index}
            disabled={disabled}
            onClick={() => onSelectPrompt(item.query)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50/50 transition-all shadow-2xs disabled:opacity-50 active:scale-95"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
