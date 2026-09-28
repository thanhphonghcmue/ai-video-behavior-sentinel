import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query = '', context = {} } = await req.json();

    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    let responseText = '';

    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('tóm tắt') || lowerQuery.includes('5 phút')) {
      responseText = `TỔNG HỢP AN NINH (5 phút qua): Hệ thống phát hiện đối tượng ID #01 (Huỳnh Tấn) có 2 lần thay đổi trạng thái nguy cơ. Lúc 14:02 ghi nhận vi phạm rào ảo ROI (89%), sau đó xuất hiện cử chỉ gia tốc cao (94%). Hiện đối tượng đang ở trạng thái di chuyển chậm (68%).`;
    } else if (lowerQuery.includes('vùng cấm') || lowerQuery.includes('roi')) {
      responseText = `HỆ THỐNG VÙNG CẤP ROI: Vùng bảo vệ "Cửa Kho Bảo Mật A2" đã bị xâm phạm 1 lần. Thuật toán Ray-Casting xác định tọa độ chân đối tượng chạm qua đường biên lúc 14:02:15. Hệ thống đã tự động chụp snapshot lưu bằng chứng.`;
    } else if (lowerQuery.includes('bạo lực') || lowerQuery.includes('đấm') || lowerQuery.includes('xô xát')) {
      responseText = `PHÂN TÍCH KHUNG XƯƠNG (OpenPose): Ghi nhận 1 sự kiện gia tốc bất thường ở khớp cổ tay (Wrist joint #4 & #7) vượt ngưỡng 100 px/s, khớp với nhãn NTU A024 (Punching/Slapping). Đề xuất kiểm tra trực tiếp hiện trường.`;
    } else {
      responseText = `AI Copilot đã ghi nhận yêu cầu: "${query}". Dữ liệu thị giác máy tính từ module HumanRecognitionBehaviorAnalysis cho thấy hệ thống đang vận hành ổn định tại 30 FPS, tỷ lệ nhận dạng khuôn mặt 94.6%.`;
    }

    return NextResponse.json({
      success: true,
      sender: 'ai',
      text: responseText,
      timestamp,
      metadata: {
        threatLevel: context.threatScore >= 80 ? 'CRITICAL' : context.threatScore >= 50 ? 'MEDIUM' : 'LOW',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
