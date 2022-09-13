/**
 * Pure Methods that work only with scene
 * Split to maintain scene class file manageable
 */

import { Animation, Vector3, SineEase, ArcRotateCamera, Viewport, Scene, Nullable } from '@babylonjs/core';
import { settings } from '../settings';
import { log } from '../shared/log';
import type { Motion, Point } from '../shared/types';
import type { CameraData } from '../project/project';

let motion: Motion;

const getPersons = () => Object.values(motion.persons).filter((person) => person.rootNode.isEnabled());

export async function introAnimation(ms: number) {
  if (ms === 0) {
    for (const camera of motion.cameras) {
      camera.fov = 0.1;
      if (motion.options.idleRotate) camera.useAutoRotationBehavior = true;
    }
    motion.light.intensity = 5;
    motion.light.direction.x = 0.5;
    motion.light.direction.y = -0.8;
    return;
  }
  for (const camera of motion.cameras) {
    Animation.CreateAndStartAnimation('camera:fov', camera, 'fov', 60, 60 * ms / 1000, /* start */ 0.5, /* end */ 0.1, /* loop */ 0, new SineEase());
    if (motion.options.idleRotate) camera.useAutoRotationBehavior = true;
  }
  Animation.CreateAndStartAnimation('light:intensity', motion.light, 'intensity', 60, 120 * ms / 1000, /* start */ 0, /* end */ 5, /* loop */ 0, new SineEase());
  Animation.CreateAndStartAnimation('light:direction.x', motion.light, 'direction.x', 60, 120 * ms / 1000, /* start */ -0.5, /* end */ 0.5, /* loop */ 0, new SineEase());
  Animation.CreateAndStartAnimation('light:direction.y', motion.light, 'direction.y', 60, 60 * ms / 1000, /* start */ 0.8, /* end */ -0.8, /* loop */ 0, new SineEase());
}

export function createCamera(name: string, scene: Scene) {
  const camera = new ArcRotateCamera(name, 0, 0, 90, new Vector3(0.5, 0.5, 0.5), scene);
  camera.minZ = 0.1;
  // camera.lowerBetaLimit = -Math.PI;
  // camera.upperBetaLimit = Math.PI;
  camera.upperRadiusLimit = 500;
  camera.wheelDeltaPercentage = 0.01;
  // camera.useBouncingBehavior = true;
  camera.angularSensibilityX = 10000;
  camera.angularSensibilityY = 10000;
  camera.fov = 0.1;
  // camera.upVector = new Vector3(0, 0, -1);
  // camera.position = new Vector3(0, -25, -2.5);
  camera.target = new Vector3(0, 1, 0);
  camera.parent = motion.ground.box;
  return camera;
}

export async function positionCamera(camera: Nullable<ArcRotateCamera>, x: number, y: number, z: number) {
  const steps = 30;
  if (!camera) return;
  if (motion.options.animationDuration === 0) {
    camera.position = new Vector3(x, y, z);
    return;
  }
  const cx = camera.position.x;
  const cy = camera.position.y;
  const cz = camera.position.z;
  const duration = (steps - 1) * motion.options.animationDuration / 1000;
  const calc = (frame: number, start: number, end: number) => (((duration - frame) * start) + (frame * end)) / duration;
  for (let f = 0; f <= steps - 1; f++) {
    setTimeout(() => { camera.position = new Vector3(calc(f, cx, x), calc(f, cy, y), calc(f, cz, z)); }, f * 15);
  }
  /*
  // does not work?
  Animation.CreateAndStartAnimation('camera:position:x', camera, 'position.x', 60, duration, cx, x, 0, new SineEase());
  Animation.CreateAndStartAnimation('camera:position:y', camera, 'position.y', 60, duration, cy, y, 0, new SineEase());
  Animation.CreateAndStartAnimation('camera:position:z', camera, 'position.z', 60, duration, cz, z, 0, new SineEase());
  */
}

export async function rotateCamera(camera: Nullable<ArcRotateCamera>, which: string, startAngle?: number, endAngle?: number) {
  if (!camera) return;
  const angle = which === 'alpha' ? camera.alpha : camera.beta;
  const duration = 120 * motion.options.animationDuration / 1000;
  Animation.CreateAndStartAnimation(`camera:${which}`, camera, which, 30, duration, startAngle || (angle), endAngle || (2 * Math.PI + angle), 0, new SineEase());
  log('camera rotate:', { which, angle });
}

export async function targetCamera(camera: Nullable<ArcRotateCamera>, x: number, y: number, z: number) {
  if (!camera) return;
  log('camera target:', { x, y, z });
  if (motion.options.animationDuration === 0) {
    camera.target = new Vector3(x, y, z);
    return;
  }
  const cx = camera.target.x;
  const cy = camera.target.y;
  const cz = camera.target.z;
  const duration = 30 * motion.options.animationDuration / 1000;
  Animation.CreateAndStartAnimation('camera:target:x', camera, 'target.x', 60, duration, cx, x, 0, new SineEase());
  Animation.CreateAndStartAnimation('camera:target:y', camera, 'target.y', 60, duration, cy, y, 0, new SineEase());
  Animation.CreateAndStartAnimation('camera:target:z', camera, 'target.z', 60, duration, cz, z, 0, new SineEase());
}

export async function zoomCamera(camera: Nullable<ArcRotateCamera>, radius: number) {
  if (!camera) return;
  log('camera radius:', { radius });
  if (motion.options.animationDuration === 0) {
    camera.radius = radius;
    return;
  }
  const prev = camera.radius;
  const duration = 30 * motion.options.animationDuration / 1000;
  Animation.CreateAndStartAnimation('camera:radius', camera, 'radius', 60, duration, prev, radius, 0, new SineEase());
}

export function initCameras(t?: Motion) {
  if (t) motion = t;
  if (!motion) return;
  for (let i = 0; i < 4; i++) {
    if (!motion.cameras[i]) {
      log('camera create:', { camera: settings.scene.cameras[i] });
      motion.cameras[i] = createCamera(settings.scene.cameras[i].name, motion.scene);
      motion.cameras[i].position = new Vector3(...settings.scene.cameras[i].position);
    } else {
      motion.cameras[i].name = settings.scene.cameras[i].name;
      motion.cameras[i].position = new Vector3(...settings.scene.cameras[i].position);
    }
  }
}

export function getCameras(): CameraData[] {
  const cameras: CameraData[] = [];
  if (!motion) return cameras;
  for (const cam of motion.scene.cameras as ArcRotateCamera[]) {
    cameras.push({
      name: cam.name,
      radius: cam.radius,
      position: [cam.position.x, cam.position.y, cam.position.z],
      target: [cam.target.x, cam.target.y, cam.target.z],
    });
  }
  log('cameras get:', cameras);
  return cameras;
}

export function setCameras(cameras: CameraData[]) {
  if (!motion) return;
  log('cameras set:', cameras);
  for (let i = 0; i < motion.scene.cameras.length; i++) {
    const cam = motion.scene.cameras[i] as ArcRotateCamera;
    cam.name = cameras[i].name;
    cam.position = new Vector3(...cameras[i].position);
    cam.target = new Vector3(...cameras[i].target);
    cam.radius = cameras[i].radius;
  }
}

export function showViewports(viewports: number) {
  motion.scene.activeCamera = motion.cameras[0];
  log('viewports set:', viewports);
  settings.scene.viewports = viewports;
  if (viewports === 1) {
    motion.cameras[0].viewport = new Viewport(0.0, 0.0, 1.0, 1.0);
    motion.cameras[1].viewport = new Viewport(0.0, 0.0, 0.0, 0.0);
    motion.cameras[2].viewport = new Viewport(0.0, 0.0, 0.0, 0.0);
    motion.cameras[3].viewport = new Viewport(0.0, 0.0, 0.0, 0.0);
    motion.scene.activeCameras = [motion.cameras[0]];
  } else if (viewports === 2) {
    motion.cameras[0].viewport = new Viewport(0.0, 0.0, 0.5, 1.0);
    motion.cameras[1].viewport = new Viewport(0.5, 0.0, 0.5, 1.0);
    motion.cameras[2].viewport = new Viewport(0.0, 0.0, 0.0, 0.0);
    motion.cameras[3].viewport = new Viewport(0.0, 0.0, 0.0, 0.0);
    motion.scene.activeCameras = [motion.cameras[0], motion.cameras[1]];
  } else if (viewports === 3) {
    motion.cameras[0].viewport = new Viewport(0.0, 0.4, 1.0, 0.6);
    motion.cameras[1].viewport = new Viewport(0.0, 0.0, 0.5, 0.4);
    motion.cameras[2].viewport = new Viewport(0.5, 0.0, 0.5, 0.4);
    motion.cameras[3].viewport = new Viewport(0.0, 0.0, 0.0, 0.0);
    motion.scene.activeCameras = [motion.cameras[0], motion.cameras[1], motion.cameras[2]];
  } else if (viewports === 4) {
    motion.cameras[0].viewport = new Viewport(0.0, 0.5, 0.5, 0.5);
    motion.cameras[1].viewport = new Viewport(0.5, 0.5, 0.5, 0.5);
    motion.cameras[2].viewport = new Viewport(0.0, 0.0, 0.5, 0.5);
    motion.cameras[3].viewport = new Viewport(0.5, 0.0, 0.5, 0.5);
    motion.scene.activeCameras = [motion.cameras[0], motion.cameras[1], motion.cameras[2], motion.cameras[3]];
  }
}

export async function centerCamera() {
  if (!motion) return;
  let pos: Point = [0, 0, 0];
  const persons = getPersons();
  for (const person of persons) pos = [pos[0] + person.position.position.x, pos[1] + person.position.position.y, pos[2] + person.position.position.z];
  pos = [pos[0] / persons.length, pos[1] / persons.length, pos[2] / persons.length];
  const vec = new Vector3(pos[0], pos[1] + 1, pos[2]);
  const cam = motion.scene.activeCamera as ArcRotateCamera;
  log('camera center:', { x: vec.x, y: vec.y, z: vec.z });
  targetCamera(cam, vec.x, vec.y, vec.z);
}

function autoFrame(cam: ArcRotateCamera) {
  const persons = getPersons();
  if (persons.length === 0) return;
  const min = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
  const max = [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE];
  for (const person of persons) {
    if (person.bbox.min[0] < min[0]) min[0] = person.bbox.min[0];
    if (person.bbox.min[1] < min[1]) min[1] = person.bbox.min[1];
    if (person.bbox.min[2] < min[2]) min[2] = person.bbox.min[2];
    if (person.bbox.max[0] > max[0]) max[0] = person.bbox.max[0];
    if (person.bbox.max[1] > max[1]) max[1] = person.bbox.max[1];
    if (person.bbox.max[2] > max[2]) max[2] = person.bbox.max[2];
  }
  const sceneSize = Vector3.Distance(new Vector3(...min), new Vector3(...max));
  const radius = 30 * sceneSize;
  if (radius > 0) {
    zoomCamera(cam, radius);
    log('camera autoframe:', { radius, persons: persons.length });
  }
}

export async function cameraPresets(preset: string) {
  const cam = motion.scene.activeCamera as ArcRotateCamera;
  log('camera preset:', { preset });
  if (preset === 'targetcenter') {
    centerCamera();
  }
  if (preset === 'frontview') {
    positionCamera(cam, 0, 2.5, -25);
    targetCamera(cam, 0, 1, 0);
  }
  if (preset === 'topdown') {
    positionCamera(cam, 0, 25, -2.5);
    targetCamera(cam, 0, 1, 0);
  }
  if (preset === 'lsideview') {
    positionCamera(cam, -25, 2.5, 0);
    targetCamera(cam, 0, 1, 0);
  }
  if (preset === 'rsideview') {
    positionCamera(cam, 25, 2.5, 0);
    targetCamera(cam, 0, 1, 0);
  }
  if (preset === 'rotatealpha') {
    rotateCamera(cam, 'alpha');
  }
  if (preset === 'rotatebeta') {
    rotateCamera(cam, 'beta');
  }
  if (preset === 'autorotate') {
    cam.useAutoRotationBehavior = !cam.useAutoRotationBehavior;
  }
  if (preset === 'autoframe') {
    autoFrame(cam);
  }
}
