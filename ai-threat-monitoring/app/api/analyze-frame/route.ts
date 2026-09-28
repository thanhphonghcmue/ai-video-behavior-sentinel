import { NextRequest, NextResponse } from 'next/server';
import { calculateThreatScore } from '@/lib/behavior-engine/threat-scoring';
import { classifyFromPoseDynamics, ACTION_METADATA_MAP } from '@/lib/behavior-engine/action-classifier';
import { ROIZone, ActionType } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      rawAction = 'WALKING', 
      isInsideROI = false, 
      torsoAngleDeg = 90, 
      wristVelocity = 20, 
      dwellTimeSec = 5,
      bbox = { left: 400, top: 150, right: 540, bottom: 420, confidence: 0.93 },
      roiZones = [] as ROIZone[]
    } = body;

    // 1. Determine action from dynamics
    const classifiedAction: ActionType = classifyFromPoseDynamics(
      rawAction,
      isInsideROI,
      torsoAngleDeg,
      wristVelocity,
      dwellTimeSec
    );

    // 2. Compute Threat Score
    const threatResult = calculateThreatScore(
      {
        action: classifiedAction,
        bbox,
        keypoints: [],
        dwellTimeSeconds: dwellTimeSec,
        velocity: wristVelocity,
      },
      roiZones
    );

    const metadata = ACTION_METADATA_MAP[classifiedAction];

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: classifiedAction,
      actionMetadata: metadata,
      threatScore: threatResult.score,
      threatLevel: threatResult.level,
      isInROI: threatResult.isInROI,
      breakdown: threatResult.breakdown,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Frame analysis failed' },
      { status: 500 }
    );
  }
}
