/**
 * Submodule of telemetry class
 */

import { Vector3, AxesViewer, Bone, ArcRotateCamera, Color3, StandardMaterial } from '@babylonjs/core';
import { drawText, TextOptions } from '../components/text3D';
import { BoneTelemetryList } from '../person/modelConstants';
import { settings } from '../settings';
import { radians2degrees } from '../person/mathCalculations';
import type { TextMesh, Person, Point } from '../types';
import type { Telemetry } from './telemetry';

const textOffset = [0.05, 0, 0.10];

const degreesText = (person: Person, name: string, relativeAngles: Point, overalAngleDiff: number): string => {
  let text = `${name}\n`;
  if (person.parent) text += `BASE: ${person.parent.name}\n`;
  if (overalAngleDiff > 0) text += `POSE CHANGE: ${overalAngleDiff}%\n`;
  const txt = [radians2degrees(relativeAngles[0]).toFixed(0), radians2degrees(relativeAngles[1]).toFixed(0), radians2degrees(relativeAngles[2]).toFixed(0)];
  if ((txt[0] !== '0') || (txt[1] !== '0') || (txt[2] !== '0')) text += `ROTATION: ${txt[0]}° | ${txt[1]}° | ${txt[2]}°`;
  return text;
};

const textOptions: Partial<TextOptions> = {
  scaling: new Vector3(settings.theme.telemetryFontSize / 1000, settings.theme.telemetryFontSize / 1000, settings.theme.telemetryFontSize / 1000),
  fontUrl: settings.theme.telemetryFont,
  color: Color3.FromHexString(settings.theme.telemetryTextColor),
  backgroundColor: Color3.FromHexString(settings.theme.telemetryBackgroundColor),
  alpha: 0.95,
};

const busy: Record<string, boolean> = {};
export async function drawRotation(t: Telemetry, bone: Bone, person: Person, relativeAngles: Point, overallAnglesDiff: number) {
  if (busy[`${person.name}:${bone.name}`]) return;
  busy[`${person.name}:${bone.name}`] = true;
  const angleText = degreesText(person, BoneTelemetryList[bone.name].toLocaleUpperCase(), relativeAngles, overallAnglesDiff);
  if (t.angles[bone.name]) {
    t.angles[bone.name]!.updateText(angleText); // update text box
  } else { // create new text box
    t.angles[bone.name] = await drawText(angleText, textOptions) as TextMesh;
    t.angles[bone.name].rootNode.parent = person.telemetryRotations;
    const cam = t.person.scene.activeCamera as ArcRotateCamera;
    t.angles[bone.name].rootNode.rotation = new Vector3(Math.PI / 2 - cam.beta, Math.PI + Math.PI / 2 - cam.alpha, 0);
  }
  if (t.angles[bone.name].box) {
    let rgb;
    if (overallAnglesDiff < 25) rgb = new Color3(0.15, 0.25, 0.15 + overallAnglesDiff / 150);
    else if (overallAnglesDiff < 50) rgb = new Color3(0 + overallAnglesDiff / 150, 0.25, 0.15);
    else rgb = new Color3(0 + overallAnglesDiff / 150, 0.10, 0.10);
    (t.angles[bone.name].box!.material as StandardMaterial).diffuseColor = rgb;
  }
  if (t.axes[bone.name]) {
    t.axes[bone.name] = new AxesViewer(t.person.scene, settings.theme.telemetryAxisSize / 100);
    t.axes[bone.name].xAxis.parent = bone;
    t.axes[bone.name].yAxis.parent = bone;
    t.axes[bone.name].zAxis.parent = bone;
  }
  t.angles[bone.name].rootNode.setEnabled(true);
  const pos = bone.getAbsolutePosition();
  pos.x = pos.x > 0 ? pos.x + textOffset[0] : pos.x - (t.angles[bone.name].width * settings.theme.telemetryFontSize / 1000) - textOffset[0];
  pos.y += (pos.y > 0 ? 1 : -1) * textOffset[1];
  pos.z -= textOffset[2];
  t.angles[bone.name].rootNode.position = new Vector3(pos.x, pos.y, pos.z);
  delete busy[`${person.name}:${bone.name}`];
}

export const setRotationVisibility = (t: Telemetry, boneName: string, shown: boolean) => {
  t.person.shouldUpdate = true;
  t.visibleRotation[boneName] = shown;
  if (!shown) {
    if (t.angles[boneName] && t.angles[boneName].rootNode.isEnabled()) t.angles[boneName].rootNode.setEnabled(false);
    if (t.axes[boneName]) {
      t.axes[boneName].dispose();
      delete t.axes[boneName];
    }
  } else {
    const cam = t.person.scene.activeCamera as ArcRotateCamera;
    if (t.angles[boneName] && t.angles[boneName].rootNode) t.angles[boneName].rootNode.rotation = new Vector3(Math.PI / 2 - cam.beta, Math.PI + Math.PI / 2 - cam.alpha, 0);
  }
};
