/**
 * Submodule of telemetry class
 */

import { Vector3, Color4, Texture, Bone, ParticleSystem, GPUParticleSystem, PointParticleEmitter } from '@babylonjs/core';
import type { Telemetry } from './telemetry';

const capacity = 10000;

export const setTraceVisibility = (t: Telemetry, boneName: string, shown: boolean) => {
  t.visibleTrace[boneName] = shown;
  if (t.traces[boneName]) {
    if (shown) {
      t.traces[boneName].start();
    } else {
      t.traces[boneName].stop();
      t.traces[boneName].reset();
    }
  }
  t.person.shouldUpdate = true;
};

function createParticleSystem(t: Telemetry, bone: Bone): ParticleSystem | GPUParticleSystem {
  if (GPUParticleSystem.IsSupported) {
    t.traces[bone.name] = new GPUParticleSystem(`${t.person.name}:${bone.name}`, { capacity }, t.person.motion.scene);
  } else {
    t.traces[bone.name] = new ParticleSystem(`${t.person.name}:${bone.name}`, capacity, t.person.motion.scene);
  }
  t.traces[bone.name].particleTexture = new Texture('./assets/flare.png');
  t.traces[bone.name].emitRate = 300;
  t.traces[bone.name].minEmitBox = new Vector3(-0.02, -0.02, -0.02);
  t.traces[bone.name].maxEmitBox = new Vector3(+0.02, +0.02, +0.02);
  t.traces[bone.name].minSize = 0.1;
  t.traces[bone.name].maxSize = 0.15;
  t.traces[bone.name].minLifeTime = 1;
  t.traces[bone.name].maxLifeTime = 10;
  t.traces[bone.name].minEmitPower = 0;
  t.traces[bone.name].maxEmitPower = 0;
  t.traces[bone.name].color1 = Color4.FromHexString('#292900');
  t.traces[bone.name].color2 = Color4.FromHexString('#002929');
  t.traces[bone.name].colorDead = Color4.FromHexString('#290000');
  t.traces[bone.name].particleEmitterType = new PointParticleEmitter();
  return t.traces[bone.name];
}

export function drawTrace(t: Telemetry, bone: Bone) {
  if (!t.traces[bone.name]) createParticleSystem(t, bone);
  t.traces[bone.name].emitter = t.person.lookControllers[bone.name] ? t.person.lookControllers[bone.name].target : bone.getAbsolutePosition();
  if (!t.traces[bone.name].isStarted()) t.traces[bone.name].start();
}
