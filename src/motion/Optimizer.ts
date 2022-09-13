/**
 * Pure Methods that work only with scene
 * Split to maintain scene class file manageable
 */

import { Scene, SceneOptimizer, SceneOptimizerOptions, HardwareScalingOptimization, ShadowsOptimization, PostProcessesOptimization, LensFlaresOptimization, TextureOptimization } from '@babylonjs/core';
import { log } from '../shared/log';

export class Optimizer {
  optimizer: SceneOptimizer;

  constructor(scene: Scene) {
    const optimizerOptions = new SceneOptimizerOptions();
    optimizerOptions.targetFrameRate = 30;
    // optimizerOptions.trackerDuration = 5000;
    optimizerOptions.trackerDuration = 0;
    optimizerOptions.addOptimization(new HardwareScalingOptimization());
    optimizerOptions.addOptimization(new ShadowsOptimization());
    optimizerOptions.addOptimization(new PostProcessesOptimization());
    optimizerOptions.addOptimization(new LensFlaresOptimization());
    optimizerOptions.addOptimization(new TextureOptimization());
    this.optimizer = new SceneOptimizer(scene, optimizerOptions, true, false);
    this.optimizer.onNewOptimizationAppliedObservable.add((eventData, eventState) => log('scene optimizer: applied:', eventData, eventState));
    this.optimizer.onSuccessObservable.add((eventData, eventState) => log('scene optimizer: success:', eventData, eventState));
    this.optimizer.onFailureObservable.add((eventData, eventState) => log('scene optimizer: fail:', eventData, eventState));
    // setInterval(() => log('Frame rate:', optimizer.currentFrameRate), 1000);
    setTimeout(() => this.optimizer.start(), 10000);
  }
}
