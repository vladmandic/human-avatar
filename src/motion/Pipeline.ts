import { DefaultRenderingPipeline, ColorCurves } from '@babylonjs/core';
import { settings } from '../settings';
import type { Motion } from './Motion';

export class Pipeline {
  pipeline: DefaultRenderingPipeline;

  constructor(motion: Motion) {
    this.pipeline = new DefaultRenderingPipeline('default', settings.renderer.enableHDR, motion.scene, motion.cameras);
    const curve = new ColorCurves();
    for (const [key, val] of Object.entries(settings.renderer.colorCurve)) {
      // @ts-ignore
      curve[key] = val;
    }
    this.pipeline.imageProcessing.colorCurves = curve;
    this.pipeline.depthOfField.focalLength = 150;
    this.pipeline.imageProcessing.toneMappingEnabled = false;
    for (const [key, val] of Object.entries(settings.renderer.imageProcessing)) { // set all values from settings
      // @ts-ignore
      this.pipeline.imageProcessing[key] = val;
    }
    // this.pipeline.imageProcessingEnabled = false;
  }
}
