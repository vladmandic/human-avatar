/**
 * Submodule of telemetry class
 */

import { Color3, StandardMaterial } from '@babylonjs/core';
import type { Telemetry } from './telemetry';

export async function drawLimitsHighlight(t: Telemetry, boneName: string, value: number) {
  const glow = t.person.options.showHighlights && t.visibleHighlight[boneName] && (value !== 0);
  const origins = t.person.getOrigin(boneName);
  if (origins && origins[0]) {
    if (glow) (origins[0].material as StandardMaterial).emissiveColor = new Color3(2 * value / 100, 1 - (2 * value / 100), 0);
    else (origins[0].material as StandardMaterial).emissiveColor = new Color3(0, 0, 0);
  }
  const targets = t.person.getTarget(boneName);
  if (targets && targets[0]) {
    const boneIndex = t.person.getBone(boneName).getIndex();
    const sensitivity = t.person.boneShaderInfo?.sensitivity[boneIndex] || 2;
    if (glow) (targets[0].material as StandardMaterial).emissiveColor = new Color3(sensitivity * value / 100, 1 - (sensitivity * value / 100), 0);
    else (targets[0].material as StandardMaterial).emissiveColor = new Color3(0, 0, 0);
  }
}

export const setHighlightVisibility = (t: Telemetry, boneName: string, shown: boolean) => {
  t.visibleHighlight[boneName] = shown;
  t.person.shouldUpdate = true;
  drawLimitsHighlight(t, boneName, 0);
};
