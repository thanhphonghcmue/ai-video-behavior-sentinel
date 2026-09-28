import { Point2D, ROIZone, DetectedPerson, ThreatLevel } from '../types';
import { ACTION_METADATA_MAP } from './action-classifier';

/**
 * Ray-Casting Algorithm for 2D Point-in-Polygon check.
 * Evaluates whether a coordinate (e.g. feet position or center) is inside the ROI polygon.
 */
export function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  if (!polygon || polygon.length < 3) return false;

  let inside = false;
  const x = point.x;
  const y = point.y;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate multi-factor Threat Score (0 - 100%)
 * Mathematical Model:
 * S_final = clamp(W_act * S_act + W_roi * S_roi + W_dwell * S_dwell + W_vel * S_vel, 0, 100)
 */
export function calculateThreatScore(
  person: Pick<DetectedPerson, 'action' | 'bbox' | 'keypoints' | 'dwellTimeSeconds' | 'velocity'>,
  roiZones: ROIZone[]
): {
  score: number;
  level: ThreatLevel;
  isInROI: boolean;
  breakdown: {
    actionScore: number;
    roiBonus: number;
    dwellBonus: number;
    velocityBonus: number;
  };
} {
  const metadata = ACTION_METADATA_MAP[person.action] || ACTION_METADATA_MAP.STANDING;
  const baseActionScore = metadata.baseRisk;

  // Compute feet location (center bottom of bounding box)
  const feetPoint: Point2D = {
    x: (person.bbox.left + person.bbox.right) / 2,
    y: person.bbox.bottom,
  };

  // Check ROI zone collision
  let isInROI = false;
  for (const zone of roiZones) {
    if (zone.isRestricted && isPointInPolygon(feetPoint, zone.points)) {
      isInROI = true;
      break;
    }
  }

  // Weights
  const roiBonus = isInROI ? 40 : 0;
  const dwellBonus = isInROI ? Math.min(person.dwellTimeSeconds * 3.5, 30) : Math.min(person.dwellTimeSeconds * 0.8, 15);
  const velocityBonus = Math.min((person.velocity / 100) * 20, 20);

  // Raw score sum
  let rawScore = baseActionScore * 0.45 + roiBonus + dwellBonus * 0.25 + velocityBonus * 0.15;

  // Override: Violent actions or fall immediately cross critical thresholds
  if (person.action === 'PUNCHING_VIOLENCE' || person.action === 'FIGHTING' || person.action === 'SUDDEN_FALL') {
    rawScore = Math.max(rawScore, 88);
  }

  if (isInROI && rawScore < 82) {
    rawScore = 82; // ROI violation is inherently critical
  }

  const score = Math.round(Math.min(Math.max(rawScore, 0), 100));

  let level: ThreatLevel = 'LOW';
  if (score >= 80) {
    level = 'CRITICAL';
  } else if (score >= 50) {
    level = 'MEDIUM';
  } else {
    level = 'LOW';
  }

  return {
    score,
    level,
    isInROI,
    breakdown: {
      actionScore: Math.round(baseActionScore),
      roiBonus,
      dwellBonus: Math.round(dwellBonus),
      velocityBonus: Math.round(velocityBonus),
    },
  };
}

export function getThreatBadgeClass(level: ThreatLevel): {
  bg: string;
  text: string;
  border: string;
  dotBg: string;
  labelVi: string;
} {
  switch (level) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-50 text-brand-red',
        text: 'text-brand-red font-bold',
        border: 'border-brand-red/30',
        dotBg: 'bg-brand-red animate-ping',
        labelVi: 'NGUY CẤP (>80%)',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-amber-50 text-amber-700',
        text: 'text-amber-700 font-semibold',
        border: 'border-amber-300',
        dotBg: 'bg-amber-500',
        labelVi: 'CẢNH BÁO (50-80%)',
      };
    case 'LOW':
    default:
      return {
        bg: 'bg-emerald-50 text-emerald-700',
        text: 'text-emerald-700 font-medium',
        border: 'border-emerald-200',
        dotBg: 'bg-emerald-500',
        labelVi: 'AN TOÀN (<50%)',
      };
  }
}
