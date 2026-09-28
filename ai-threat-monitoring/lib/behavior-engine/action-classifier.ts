import { ActionType, ActionCategory, ThreatLevel } from '../types';

export interface ActionMetadata {
  type: ActionType;
  category: ActionCategory;
  labelVi: string;
  baseRisk: number; // 0 to 100
  color: string;
  description: string;
  iconName: string;
}

export const ACTION_METADATA_MAP: Record<ActionType, ActionMetadata> = {
  STANDING: {
    type: 'STANDING',
    category: 'NORMAL',
    labelVi: 'Đứng bình thường',
    baseRisk: 12,
    color: '#10B981',
    description: 'Đối tượng đứng ổn định, không có dấu hiệu kích động',
    iconName: 'UserCheck',
  },
  WALKING: {
    type: 'WALKING',
    category: 'NORMAL',
    labelVi: 'Đi bộ bình thường',
    baseRisk: 15,
    color: '#10B981',
    description: 'Tốc độ di chuyển tiêu chuẩn trong hành lang cho phép',
    iconName: 'Footprints',
  },
  SITTING: {
    type: 'SITTING',
    category: 'NORMAL',
    labelVi: 'Ngồi quan sát',
    baseRisk: 10,
    color: '#10B981',
    description: 'Đối tượng ngồi tại khu vực chờ/làm việc',
    iconName: 'Armchair',
  },
  BENDING_LOITERING: {
    type: 'BENDING_LOITERING',
    category: 'SUSPICIOUS',
    labelVi: 'Cúi người lục lọi',
    baseRisk: 62,
    color: '#F59E0B',
    description: 'Tư thế cúi thấp người bất thường gần tài sản hoặc tủ khóa',
    iconName: 'Search',
  },
  SNEAKING: {
    type: 'SNEAKING',
    category: 'SUSPICIOUS',
    labelVi: 'Lén lút di chuyển',
    baseRisk: 68,
    color: '#F59E0B',
    description: 'Di chuyển chậm sát tường, né tránh góc quét camera',
    iconName: 'EyeOff',
  },
  SUSPICIOUS_LOITERING: {
    type: 'SUSPICIOUS_LOITERING',
    category: 'SUSPICIOUS',
    labelVi: 'Lảng vảng điểm nhạy cảm',
    baseRisk: 58,
    color: '#F59E0B',
    description: 'Thời gian dừng lại (dwell time) vượt quá giới hạn an toàn',
    iconName: 'ClockAlert',
  },
  PUNCHING_VIOLENCE: {
    type: 'PUNCHING_VIOLENCE',
    category: 'DANGER',
    labelVi: 'Vung tay bạo lực',
    baseRisk: 92,
    color: '#D70018',
    description: 'Gia tốc khớp cổ tay cao đột ngột, cử chỉ tấn công',
    iconName: 'Flame',
  },
  FIGHTING: {
    type: 'FIGHTING',
    category: 'DANGER',
    labelVi: 'Xô xát hỗn chiến',
    baseRisk: 95,
    color: '#D70018',
    description: 'Tương tác va chạm mạnh nhiều người với dao động khớp lớn',
    iconName: 'AlertTriangle',
  },
  ROI_INTRUSION: {
    type: 'ROI_INTRUSION',
    category: 'DANGER',
    labelVi: 'Xâm nhập Vùng Cấm (ROI)',
    baseRisk: 88,
    color: '#D70018',
    description: 'Đối tượng bước vào ranh giới ảo được thiết lập bảo vệ',
    iconName: 'ShieldAlert',
  },
  SUDDEN_FALL: {
    type: 'SUDDEN_FALL',
    category: 'DANGER',
    labelVi: 'Té ngã bất thường',
    baseRisk: 90,
    color: '#D70018',
    description: 'Góc nghiêng thân trên sụp đổ đột ngột về mặt sàn',
    iconName: 'ActivitySquare',
  },
};

/**
 * Mapping from HumanRecognitionBehaviorAnalysis 2s-AGCN (NTU 60 classes)
 * or openpose keypoint features to internal ActionType.
 */
export function classifyFromPoseDynamics(
  rawActionLabel: string,
  isInsideROI: boolean,
  torsoAngleDeg: number,
  wristVelocity: number,
  dwellTimeSec: number
): ActionType {
  // If intruder crosses virtual fence
  if (isInsideROI) {
    if (wristVelocity > 80) return 'PUNCHING_VIOLENCE';
    return 'ROI_INTRUSION';
  }

  // Fall detection: torso angle collapses horizontal (< 30 deg to ground)
  if (torsoAngleDeg < 35 && torsoAngleDeg > -35) {
    return 'SUDDEN_FALL';
  }

  // Violent punch or strike gesture
  if (wristVelocity > 95) {
    return 'PUNCHING_VIOLENCE';
  }

  // Loitering inside critical zone for long time
  if (dwellTimeSec > 15) {
    return 'SUSPICIOUS_LOITERING';
  }

  // Bending detection
  if (torsoAngleDeg > 45 && torsoAngleDeg < 70) {
    return 'BENDING_LOITERING';
  }

  // Default translation from model prediction string
  const normalized = rawActionLabel.toUpperCase();
  if (normalized.includes('PUNCH') || normalized.includes('HIT')) return 'PUNCHING_VIOLENCE';
  if (normalized.includes('FIGHT')) return 'FIGHTING';
  if (normalized.includes('FALL')) return 'SUDDEN_FALL';
  if (normalized.includes('WALK')) return 'WALKING';
  if (normalized.includes('SIT')) return 'SITTING';

  return 'STANDING';
}

export function getActionMetadata(action: ActionType): ActionMetadata {
  return ACTION_METADATA_MAP[action] || ACTION_METADATA_MAP.STANDING;
}
