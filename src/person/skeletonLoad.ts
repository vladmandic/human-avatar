/**
 * Helper method that loads a default skeleton
 * Used only once since all other instances are clones
 */

import { Skeleton, SceneLoader, AnimationPropertiesOverride, AssetContainer } from '@babylonjs/core';
import { log } from '../shared/log';
import type { Motion } from '../motion/Motion';

function setAnimationProperties(skeleton: Skeleton) {
  skeleton.animationPropertiesOverride = new AnimationPropertiesOverride();
  skeleton.animationPropertiesOverride.enableBlending = true;
  skeleton.animationPropertiesOverride.blendingSpeed = 0.9;
  skeleton.animationPropertiesOverride.loopMode = 0;
}

export async function loadSkeleton(motion: Motion): Promise<AssetContainer> { // used to load skeleton once as each person instance will have its clone of it
  log('skeleton load:', { url: motion.options.skeletonFileUrl });
  motion.container = await SceneLoader.LoadAssetContainerAsync(motion.options.skeletonPathUrl, motion.options.skeletonFileUrl, motion.scene);
  log('skeleton assets:', motion.container);
  setAnimationProperties(motion.container.skeletons[0]);
  return motion.container;
}
