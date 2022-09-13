import { Mesh, CreateBox, StandardMaterial, Color3, Plane, MirrorTexture, Vector3, Texture } from '@babylonjs/core';
import { settings } from '../settings';
import { log } from '../shared/log';
import type { Motion } from './Motion';

const height = 0.10;

export class Ground {
  material: StandardMaterial;
  box: Mesh;
  motion: Motion;
  mirror: MirrorTexture | undefined;

  constructor(motion: Motion) {
    log('scene create ground');
    this.motion = motion;
    this.material = new StandardMaterial('ground', motion.scene);
    this.material.alpha = settings.motion.groundAlpha;
    this.material.diffuseColor = new Color3(0, 0, 0);
    this.material.specularColor = Color3.FromHexString(settings.theme.groundColor);
    this.material.specularPower = 1.0;
    this.material.bumpTexture = new Texture('./assets/grassmap.jpg', motion.scene);
    this.material.bumpTexture.level = 0.1;
    if (settings.motion.groundMirror) {
      this.mirror = new MirrorTexture('mirror', { ratio: 1.0 }, this.motion.scene, true);
      this.mirror.mirrorPlane = new Plane(0, -1.0, 0, -1.0);
      this.mirror.renderList = [];
      this.mirror.level = 0.6;
      this.mirror.adaptiveBlurKernel = 16;
      this.material.reflectionTexture = this.mirror;
    }
    this.box = CreateBox('ground', { width: settings.environment.groundSize, height, depth: settings.environment.groundSize }, this.motion.scene);
    // this.box.rotation.x = Math.PI / 2;
    this.box.position.y = -1 - height;
    this.box.material = this.material;
    this.box.receiveShadows = true;
  }

  resetPlane = () => {
    this.box.rotation.x = 0;
    this.box.position.y = -1 - height;
    const active = Object.values(this.motion.persons).filter((p) => (p.rootNode.isEnabled()));
    for (const person of active) person.rootNode.rotation = new Vector3(0, 0, 0);
  };

  updatePlane = (initial?: boolean) => {
    // set visibility
    this.box.visibility = this.motion.options.groundVisibility;

    // enumerate x,y,z coords of all active persons
    const ptsX: number[] = [];
    const ptsY: number[] = [];
    const ptsZ: number[] = [];
    const active = Object.values(this.motion.persons).filter((p) => (p.rootNode.isEnabled() && (p.bbox.min[0] !== 0) && (p.bbox.min[1] !== 0) && (p.bbox.min[2] !== 0)));
    for (const person of active) {
      ptsX.push(person.bbox.avg[0]);
      ptsY.push(person.bbox.avg[1]);
      ptsZ.push(person.bbox.avg[2]);
    }
    if (ptsX.length === 0) return;

    // is position or rotation set manually or via overrides
    const manualRotation = (this.motion.options.groundRotation[0] !== 0) || (this.motion.options.groundRotation[1] !== 0) || (this.motion.options.groundRotation[2] !== 0);
    const manualPosition = (this.motion.options.groundPosition[0] !== 0) || (this.motion.options.groundPosition[1] !== 0) || (this.motion.options.groundPosition[2] !== 0);

    // set ground position
    if (manualPosition) {
      this.box.position = new Vector3(this.motion.options.groundPosition[0], this.motion.options.groundPosition[1] - height - 1, this.motion.options.groundPosition[2]);
      if (initial) log('scene set manual ground position:', this.motion.options.groundPosition);
    } else
    if ((this.motion.options.groundAutoPosition === 2) || ((this.motion.options.groundAutoPosition === 1) && initial)) {
      const avgX = ptsX.reduce((a, b) => a + b, 0) / ptsX.length;
      const avgY = ptsY.reduce((a, b) => a + b, 0) / ptsX.length;
      const avgZ = ptsZ.reduce((a, b) => a + b, 0) / ptsX.length;
      this.box.position = new Vector3(avgX, avgY - height - 1, avgZ);
      if (initial) log('scene set average ground position:', [avgX, avgY, avgZ]);
    }

    // set ground rotation
    if (manualRotation) {
      this.box.rotation = new Vector3(this.motion.options.groundRotation[0], this.motion.options.groundRotation[1], this.motion.options.groundRotation[2]);
      for (const person of active) person.rootNode.rotation = this.box.rotation; // adjust each person rotation to match ground rotation
      if (initial) log('scene set manual ground rotation:', this.motion.options.groundRotation);
    } else if ((this.motion.options.groundAutoRotation === 2) || ((this.motion.options.groundAutoRotation === 1) && initial)) {
      const x = 0;
      const y = 0;
      const z = 0;
      // TBD: do the actual math
      this.box.rotation = new Vector3(x, y, z);
      for (const person of active) person.rootNode.rotation = this.box.rotation; // adjust each person rotation to match ground rotation
      if (initial) log('scene set plane ground rotation:', [x, y, z]);
    }
  };
}
