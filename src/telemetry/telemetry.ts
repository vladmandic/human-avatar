/**
 * Class telemetry deals with visualizatios and has 3 sub-modules
 * Impure as it interacts with DOM
 */

import type { Bone, AxesViewer, ParticleSystem, GPUParticleSystem } from '@babylonjs/core';
import type { Person, TextMesh, Point } from '../types';
import { BoneTelemetryList } from '../person/modelConstants';
import { relativeAngle } from '../person/mathCalculations';
import { drawRotation, setRotationVisibility } from './rotations';
import { drawChart, setChartVisibility, updateChartData } from './chart';
import { drawTrace, setTraceVisibility } from './traces';
import { drawLimitsShader, setShaderVisibility, setDefaultsLimitsShader } from './shader';
import { drawLimitsHighlight, setHighlightVisibility } from './highlight';
import { drawVectors } from './vectors';
import { drawMaximums, updateMaximums } from './maximums';
import { trackMotion } from './track';
import type { Arrow } from '../components/arrow';

export class Telemetry {
  angles: Record<string, TextMesh> = {};
  axes: Record<string, AxesViewer> = {};
  vectors: Record<string, Arrow> = {};
  maximums: Record<string, [number, number, number, number, number, number, number]> = {};
  traces: Record<string, ParticleSystem | GPUParticleSystem> = {};
  visibleRotation: Record<string, boolean> = {};
  visibleTrace: Record<string, boolean> = {};
  visibleChart: Record<string, boolean> = {};
  visibleHighlight: Record<string, boolean> = {};
  visibleShader: Record<string, boolean> = {};
  person: Person;

  constructor(person: Person) {
    this.person = person;
  }

  getBone = (name: string): Bone => (this.person.skeleton ? this.person.skeleton.bones.find((bone) => bone.name === name) : null) as Bone;

  setActive(boneName: string, boneActive: boolean) {
    // log('telemetry setactive:', { boneName, boneActive });
    setRotationVisibility(this, boneName, boneActive);
    setTraceVisibility(this, boneName, boneActive);
    setHighlightVisibility(this, boneName, boneActive);
    setShaderVisibility(this, boneName, boneActive);
    setChartVisibility(this, boneName, boneActive);
  }

  updateTelemetry() {
    setDefaultsLimitsShader(this);
    for (const boneName of Object.keys(BoneTelemetryList)) {
      const bone: Bone = this.getBone(boneName);
      if (!bone) return;
      const parent = this.person.parent?.telemetry?.getBone(boneName)?.rotation || { x: 0, y: 0, z: 0 };
      if (boneName === 'Hips') parent.y = Math.PI; // correct for flip

      const relativeAngles: Point = [relativeAngle(bone.rotation.x, parent.x), relativeAngle(bone.rotation.y, parent.y), relativeAngle(bone.rotation.z, parent.z)];
      const overallAnglesDiff = Math.round(100 * Math.sqrt((((relativeAngles[0] * relativeAngles[0]) + (relativeAngles[1] * relativeAngles[1]) + (relativeAngles[2] * relativeAngles[2])) / (Math.PI * Math.PI) / 3)));

      if (this.person.options.showRotation && this.visibleRotation[boneName]) drawRotation(this, bone, this.person, relativeAngles, overallAnglesDiff);
      else setRotationVisibility(this, boneName, false);

      if (this.person.options.showTracing && this.visibleTrace[boneName]) drawTrace(this, bone);
      else setTraceVisibility(this, boneName, false);

      if (this.person.options.showCharts && this.visibleChart[boneName]) updateChartData(bone.name, overallAnglesDiff);
      else setChartVisibility(this, boneName, false);

      drawLimitsHighlight(this, boneName, overallAnglesDiff);
      drawLimitsShader(this, boneName, overallAnglesDiff);
      updateMaximums(this, boneName, overallAnglesDiff, relativeAngles);
    }
    drawChart(this, this.person.options.showCharts);
    drawMaximums(this);
    trackMotion(this);

    if (this.person.options.showVectors) drawVectors(this);
    this.person.telemetryVectors.setEnabled(this.person.options.showVectors);
  }
}
