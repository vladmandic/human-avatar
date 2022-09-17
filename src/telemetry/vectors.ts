/**
 * Submodule of telemetry class
 */

import { Arrow } from '../components/arrow';
import type { Telemetry } from './telemetry';

export function drawVectors(t: Telemetry) {
  if (!t.vectors.eyes) t.vectors.eyes = new Arrow('eyes', t.person, '#007878');
  if (!t.vectors.shoulders) t.vectors.shoulders = new Arrow('shoulders', t.person, '#FF2200');
  if (!t.vectors.hips) t.vectors.hips = new Arrow('hips', t.person, '#FFFF00');
  if (t.person.normalized.length === 0) return;
  t.vectors.eyes.updateFromCross(t.person.normalized[t.person.kinematics?.model.rightEye || 0], t.person.normalized[t.person.kinematics?.model.leftEye || 0]);
  t.vectors.shoulders.updateFromCross(t.person.normalized[t.person.kinematics?.model.rightShoulder || 0], t.person.normalized[t.person.kinematics?.model.leftShoulder || 0]);
  t.vectors.hips.updateFromPlane(t.person.normalized[t.person.kinematics?.model.pelvis || 0], t.person.normalized[t.person.kinematics?.model.leftHip || 0], t.person.normalized[t.person.kinematics?.model.rightHip || 0]);
}
