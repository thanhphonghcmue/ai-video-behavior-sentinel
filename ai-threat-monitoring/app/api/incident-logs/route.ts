import { NextRequest, NextResponse } from 'next/server';
import { IncidentEvent } from '@/lib/types';

// In-memory incidents store
let mockIncidents: IncidentEvent[] = [
  {
    id: 'inc-001',
    timestamp: '14:02:15',
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
    id: 'inc-002',
    timestamp: '14:03:40',
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
    id: 'inc-003',
    timestamp: '14:04:10',
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
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level');

  let results = [...mockIncidents];
  if (level && level !== 'ALL') {
    results = results.filter((inc) => inc.threatLevel === level);
  }

  return NextResponse.json({
    total: results.length,
    incidents: results,
  });
}

export async function POST(req: NextRequest) {
  try {
    const newInc: IncidentEvent = await req.json();
    mockIncidents.unshift(newInc);
    return NextResponse.json({ success: true, item: newInc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
