/**
 * Submodule of telemetry class
 */

// import { Color3, StandardMaterial } from '@babylonjs/core';
import type { Telemetry } from './Telemetry';

export const getShaderVisibility = (t: Telemetry, boneName: string) => t.visibleTrace[boneName] || false;

export const setShaderVisibility = (t: Telemetry, boneName: string, shown: boolean) => {
  if (!t.person || !t.person.boneShaderInfo) return;
  const bone = t.person.getBone(boneName);
  t.person.boneShaderInfo.enabled[bone.getIndex()] = shown ? 1 : -1;
  t.visibleShader[boneName] = shown;
  t.person.shouldUpdate = true;
};

export function setDefaultsLimitsShader(t: Telemetry) {
  if (!t.person.boneShaderInfo) return;
  for (let i = 0; i < t.person.boneShaderInfo.colorsFocus.length; i++) {
    t.person.boneShaderInfo.colorsFocus[i] = [0, 0, 0];
  }
}

export async function drawLimitsShader(t: Telemetry, boneName: string, value: number) {
  const shade = t.person.options.showShaders && t.visibleShader[boneName];
  const bone = t.person.getBone(boneName);
  if (bone && t.person.boneShaderInfo) {
    const boneIndex = bone.getIndex();
    if (!shade) {
      t.person.boneShaderInfo.colorsFocus[boneIndex] = [1, 0, 0];
    } else {
      t.person.boneShaderInfo.colorsFocus[boneIndex] = [
        value > 20 ? t.person.boneShaderInfo.sensitivity[boneIndex] * value / 100 : 0,
        1 - (t.person.boneShaderInfo.sensitivity[boneIndex] * value / 100),
        0,
      ];
      // console.log({ boneName, boneIndex, value, rgb: t.person.boneShaderInfo.colorsFocus[boneIndex] });
    }
  }
}
