/**
 * Motion class is a top-level class that contains all other instances and methods
 */

// eslint-disable-next-line max-len
import { Scene, Mesh, Nullable, DefaultRenderingPipeline, ArcRotateCamera, AnimationRange, DirectionalLight, HemisphericLight, ShadowGenerator, EnvironmentHelper, Animation, Color3, Vector3, StandardMaterial, BoundingBoxGizmo, DirectionalLightFrustumViewer, UtilityLayerRenderer, AssetContainer, GlowLayer } from '@babylonjs/core';
import '@babylonjs/inspector';
import { log } from '../log';
import { dom } from '../dom/elements'; // only external dependency is add person to html select element
import { setTextScene, initFont, drawText } from '../components/text3D';
import { centerCamera, initCameras, introAnimation, showViewports } from './cameras';
import { attachPointerControls } from './pointerEvents';
import { createBoneDomElements } from './boneControls';
import { settings } from '../settings';
import { loadSkeleton } from '../person/skeleton';
import { Pipeline } from './pipeline';
import { Person } from '../person/person';
import { createEngine } from './engine';
import type { MotionOptions, SceneOptions } from '../types';
import type { E } from './engine';

interface Global extends Window {
  scene: Scene,
  Vector3: typeof Vector3,
  Color3: typeof Color3,
}
declare let window: Global;

export class Motion {
  ready: boolean = false;
  engine: E;
  canvas: HTMLCanvasElement | undefined;
  scene: Scene;
  pipeline: DefaultRenderingPipeline;
  layer: UtilityLayerRenderer;
  gizmo: BoundingBoxGizmo | undefined;
  frustum: DirectionalLightFrustumViewer;
  cameras: ArcRotateCamera[] = [];
  light: DirectionalLight;
  shadows: ShadowGenerator;
  environment!: EnvironmentHelper;
  container: AssetContainer | undefined = undefined;
  axisText: Mesh[] = [];
  pickedMesh: Nullable<Mesh> = null;
  logo: Nullable<Mesh> = null;
  pickedPosition: Nullable<Vector3> = null;
  pickedPerson: Nullable<Person> = null;
  persons: Record<string, Person> = {};
  options: MotionOptions;
  shouldUpdate: boolean = true;
  scaleErr: number = 0;

  constructor(engine: E, canvas?: HTMLCanvasElement) {
    this.options = settings.motion;
    // engine & scene
    this.engine = engine;
    this.canvas = canvas;
    Animation.AllowMatricesInterpolation = true;
    this.scene = new Scene(this.engine);
    this.scene.clearCachedVertexData();
    this.scene.defaultCursor = 'crosshair';
    this.scene.fogEnabled = false;
    this.scene.spritesEnabled = false;
    this.scene.particlesEnabled = true;
    this.scene.physicsEnabled = false;
    this.scene.audioEnabled = false;
    this.scene.probesEnabled = false;

    // glow layer
    const glow = new GlowLayer('glow-layer', this.scene);
    glow.intensity = 2;
    glow.blurKernelSize = 32;

    // start scene
    this.engine.runRenderLoop(() => this.scene.render(true, false));

    // environment
    this.environment = this.scene.createDefaultEnvironment({
      environmentTexture: settings.environment.environmentTexture,
      createSkybox: true,
      skyboxTexture: settings.environment.skyboxTexture,
      skyboxColor: Color3.FromHexString(settings.theme.skyboxColor),
      skyboxSize: settings.environment.skyboxSize,
      createGround: false,
    }) as EnvironmentHelper;
    const environment = this.scene.meshes.find((mesh) => mesh.name === 'BackgroundHelper') as Mesh;
    environment.name = 'environment';
    const skybox = this.scene.meshes.find((m) => m.name === 'BackgroundSkybox') as Mesh;
    skybox.name = 'skybox';

    // utility layer that hosts all controls
    this.layer = new UtilityLayerRenderer(this.scene);

    // lights
    const ambient = new HemisphericLight('light:hemispheric', new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 1;
    ambient.specular = Color3.FromHexString(settings.theme.ambientColor);
    ambient.parent = environment;
    this.light = new DirectionalLight('light:directional', new Vector3(1, -1, 1), this.scene);
    this.light.intensity = 15;
    this.light.autoCalcShadowZBounds = true;
    this.light.diffuse = new Color3(1, 1, 1);
    this.light.specular = Color3.FromHexString(settings.theme.groundColor);
    this.light.position = new Vector3(-3, 3, -3);
    this.light.parent = environment;
    this.shadows = new ShadowGenerator(1024, this.light, false);
    this.shadows.transparencyShadow = true;
    this.shadows.depthScale = 60.0;
    this.shadows.frustumEdgeFalloff = 1.0;

    // finish up
    for (const mesh of this.scene.meshes) mesh.isPickable = false; // make all default meshes ignore mouse clicks
    initCameras(this);
    showViewports(settings.scene.viewports);
    attachPointerControls(this); // attach camera controls
    createBoneDomElements(this);
    introAnimation(this.options.animationDuration); // animate
    if (typeof window !== 'undefined') window.onresize = () => this.engine.resize();
    if (this.canvas) this.scene.activeCamera?.attachControl(this.canvas);

    // rendering pipeline
    this.pipeline = new Pipeline(this).pipeline;

    this.frustum = new DirectionalLightFrustumViewer(this.light, this.cameras[0]);
    this.frustum.transparency = 0.1;
    this.frustum.showLines = false;
    this.frustum.showPlanes = true;
    this.frustum.hide();
    setTimeout(() => this.frustum.update(), 1000);

    // const lightGizmo = new LightGizmo();
    // lightGizmo.light = this.light;

    // const gizmoManager = new GizmoManager(this.scene);
    // gizmoManager.usePointerToAttachGizmos = true;
    // gizmoManager.scaleRatio = 0.2;
    // gizmoManager.enableAutoPicking = true;
    // gizmoManager.positionGizmoEnabled = true;
    // gizmoManager.rotationGizmoEnabled = true;
    // gizmoManager.scaleGizmoEnabled = true;
    // gizmoManager.boundingBoxGizmoEnabled = true;

    // set gltf decoder paths
    // DracoCompression.Configuration.decoder.fallbackUrl = './assets/draco_decoder_gltf.js';
    // DracoCompression.Configuration.decoder.wasmBinaryUrl = './assets/draco_decoder_gltf.wasm';
    // DracoCompression.Configuration.decoder.wasmUrl = './assets/draco_wasm_wrapper_gltf.js';

    // diag
    // @ts-ignore
    window.t = this;
    window.Vector3 = Vector3;
    window.Color3 = Color3;
  }

  dispose = () => {
    for (const person of Object.values(this.persons)) person.rootNode.dispose();
    this.scene.dispose();
  };

  setOptions(options: Partial<MotionOptions>, skipRender?: boolean) {
    this.options = { ...this.options, ...options };
    settings.motion = this.options;
    if (!skipRender) {
      log('motion set options:', options);
    }
  }

  setSceneOptions(options: Partial<SceneOptions>, skipRender?: boolean) {
    settings.scene = { ...settings.scene, ...options };
    if (!skipRender) {
      log('motion set options:', options);
    }
  }

  async renderPersons() {
    for (const person of Object.values(this.persons)) {
      if (person.rootNode.isEnabled()) person.beforeRender();
    }
  }

  async showAxisTitle() {
    if (this.axisText.length === 0) { // runs only once
      setTextScene(this.layer.utilityLayerScene);
      const scaling = new Vector3(settings.theme.axisTextSize / 1000, settings.theme.axisTextSize / 1000, settings.theme.axisTextSize / 1000);
      const t0 = await drawText('FRONT', { position: new Vector3(-0.32, 2.5, 0), rotation: new Vector3(0, 0, 0), scaling });
      const t1 = await drawText('LEFT', { position: new Vector3(-1.5, 2.5, 0.2), rotation: new Vector3(0, Math.PI / 2, 0), scaling });
      const t2 = await drawText('RIGHT', { position: new Vector3(1.5, 2.5, -0.3), rotation: new Vector3(Math.PI, Math.PI / 2, Math.PI), scaling });
      const t3 = await drawText('TOP', { position: new Vector3(-0.2, 2.7, 0.32), rotation: new Vector3(Math.PI / 2, 0, 0), scaling });
      const t4 = await drawText('BOTTOM', { position: new Vector3(-0.4, -0.5, 0), rotation: new Vector3(-Math.PI / 2, 0, 0), scaling });
      this.axisText.push(t0!.rootNode, t1!.rootNode, t2!.rootNode, t3!.rootNode, t4!.rootNode);
    }
    this.axisText.forEach((text) => text.setEnabled(this.options.showAxisTitle));
  }

  showAnchors(value?: boolean) {
    const show = typeof value !== 'undefined' ? value : this.options.showAnchors;
    Object.values(this.persons).forEach((person) => {
      person.positions.setEnabled(person.current.keypoints.length > 0 ? show : false);
      person.anchors.setEnabled(person.current.keypoints.length > 0 ? show : false);
    });
  }

  setWireframe(bone?: boolean, joint?: boolean) {
    const materialSkins = this.scene.materials.filter((material) => material.name === 'skin:surface') as StandardMaterial[];
    materialSkins.forEach((material) => { material.wireframe = (typeof bone !== 'undefined' ? bone : this.options.wireframeBone); });
    const materialJoints = this.scene.materials.filter((material) => material.name === 'skin:joints') as StandardMaterial[];
    materialJoints.forEach((material) => { material.wireframe = (typeof joint !== 'undefined' ? joint : this.options.wireframeJoint); });
  }

  setMaterial(material: string) {
    for (const person of Object.values(this.persons)) person.setSkeletonMaterial(material);
  }

  setModel(model: string) {
    log('motion set model:', { model });
    Object.values(this.persons).forEach((person) => person.rootNode.setEnabled(true));
  }

  center = () => centerCamera();

  setAutoRotate(autorotate: boolean) {
    for (const camera of this.cameras) camera.useAutoRotationBehavior = autorotate;
  }

  resetScale() {
    log('motion reset skeleton scale');
    this.options.scalePerson = settings.motion.scalePerson;
    this.scaleErr = Number.MAX_VALUE;
  }

  load = () => loadSkeleton(this);

  beforeRender() {
    this.renderPersons(); // each person checks if it should be updated
    if (this.shouldUpdate) { // if any frame or person was updated
      this.setWireframe();
      this.showAxisTitle();
      this.showAnchors();
      this.shouldUpdate = false;
    }
    const activePersons = Object.values(this.persons).filter((p) => p.rootNode.isEnabled()).length;
    const readyPersons = Object.values(this.persons).filter((p) => p.ready).length;
    this.ready = activePersons === readyPersons;
  }
}

let t: Motion; // default instance of a scene

async function updateCloneCanvases() {
  let div = document.getElementById('clone-canvases');
  if (div) document.body.removeChild(div);
  div = document.createElement('div');
  div.id = 'clone-canvases';
  div.style.position = 'fixed';
  div.style.left = `${settings.menu.width + 40}px`;
  div.style.bottom = '20px';
  div.style.width = '20px';
  document.body.appendChild(div);
  if (t.options.showCloneCanvases) {
    for (const person of Object.values(t.persons)) {
      if (!person.image) continue;
      const canvas = document.createElement('canvas');
      const image: HTMLImageElement = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = person.image as string;
      });
      canvas.className = 'clone';
      canvas.width = image.width || 0;
      canvas.height = image.height || 0;
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      ctx.drawImage(image, 0, 0);
      ctx.font = '14px CenturyGothic';
      ctx.fillStyle = 'white';
      ctx.fillText(person.name, 6, 24);
      ctx.fillStyle = 'black';
      ctx.fillText(person.name, 4, 22);
      div.appendChild(canvas);
    }
  }
}

export async function createPerson(name: string): Promise<Person | null> {
  if (!t) return null;
  log('person create:', { name });
  t.persons[name] = await Person.create(name, t); // create default person
  for (const mesh of t.persons[name].skeletonMesh) t.shadows.addShadowCaster(mesh, true);
  return t.persons[name];
}

export async function clonePerson(original: Person | number): Promise<Person | null> {
  if (!t) return null;
  if (typeof original === 'number') original = Object.values(t.persons).find((p) => p.id === original) as Person;
  if (original.interpolated.keypoints.length === 0) return null;
  const count = Object.keys(t.persons).length;
  const name = `${t.options.cloneNamePrefix}${count} OF\n${original.name}`;
  log('person clone:', { name });
  t.persons[name] = await Person.create(name, t);
  t.persons[name].parent = original;
  for (const mesh of t.persons[name].skeletonMesh) t.shadows.addShadowCaster(mesh, true);
  original.clones.push(t.persons[name]);
  t.persons[name].offsets = [+0.66 * original.clones.length + original.offsets[0], 0, 0];
  t.persons[name].updateData(original.interpolated.keypoints, original.interpolated.score);
  await updateCloneCanvases();
  return t.persons[name];
}

export async function deletePerson(name: string) {
  if (!t) return;
  log('person delete:', { name });
  t.persons[name].skeleton?.dispose();
  for (const mesh of t.persons[name].skeletonMesh) mesh.dispose();
  t.persons[name].title?.dispose();
  t.persons[name].position.dispose();
  t.persons[name].lookControllers = {};
  t.persons[name].positions.dispose();
  t.persons[name].anchors.dispose();
  t.persons[name].rootNode.dispose(false);
  if (t.persons[name].parent) {
    t.persons[name].parent!.clones = t.persons[name].parent!.clones.filter((clone) => clone.name !== name); // remove from list of clones
  }
  delete t.persons[name];
  updateCloneCanvases();
}

export async function showInspector() {
  if (!t || !t.scene) return;
  log('inspector show');
  const globalRoot = document.getElementById('inspector') as HTMLDivElement;
  if (t.scene.debugLayer.isVisible()) t.scene.debugLayer.hide();
  else t.scene.debugLayer.show({ embedMode: true, overlay: false, showExplorer: true, showInspector: true, globalRoot });
  if (document.querySelector('#sceneExplorer')) {
    const div = document.querySelector('#sceneExplorer') as HTMLDivElement;
    div.style.fontFamily = 'CenturyGothic';
    div.style.fontVariant = 'small-caps';
    div.style.background = settings.menu.backgroundColor;
  }
  if (document.querySelector('#inspector-host')) {
    const div = document.querySelector('#inspector-host') as HTMLDivElement;
    div.style.fontFamily = 'CenturyGothic';
    div.style.fontVariant = 'small-caps';
    div.style.background = settings.menu.backgroundColor;
  }
  if (document.querySelector('#actionTabs .tabs')) {
    const div = document.querySelector('#actionTabs .tabs') as HTMLDivElement;
    div.style.fontFamily = 'CenturyGothic';
    div.style.fontVariant = 'small-caps';
    div.style.background = settings.menu.backgroundColor;
    div.style.mixBlendMode = 'screen';
  }
}

export async function showVectors(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  for (const person of persons) {
    log('telemetry vectors:', { person: person.rootNode.name, show });
    person.options.showVectors = show;
    person.shouldUpdate = true;
  }
}

export async function showTracing(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  for (const person of persons) {
    log('telemetry trace:', { person: person.rootNode.name, show });
    person.options.showTracing = show;
    person.shouldUpdate = true;
  }
}

export async function showCharts(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  for (const person of persons) {
    log('telemetry chart:', { person: person.rootNode.name, show });
    person.options.showCharts = show;
    person.shouldUpdate = true;
  }
}

export async function showHighlights(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  for (const person of persons) {
    log('limits highligh:', { person: person.rootNode.name, show });
    person.options.showHighlights = show;
    person.shouldUpdate = true;
  }
}

export async function showMaximums(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  for (const person of persons) {
    log('limits maximums:', { person: person.rootNode.name, show });
    person.options.showMaximums = show;
    person.shouldUpdate = true;
  }
}

export async function showTracking(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  for (const person of persons) {
    log('motion tracking:', { person: person.rootNode.name, show });
    person.options.showTrack = show;
    person.shouldUpdate = true;
  }
}

export async function showShaders(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  for (const person of persons) {
    log('limits shaders:', { person: person.rootNode.name, show });
    person.options.showShaders = show;
    person.shouldUpdate = true;
  }
}

export async function trackPosition(track: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  for (const person of persons) {
    log('telemetry track:', { person: person.rootNode.name, track });
    person.options.updatePosition = track;
    person.shouldUpdate = true;
  }
}

export async function showRotation(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  for (const person of persons) {
    log('telemetry rotation:', { person: person.rootNode.name, show });
    person.options.showRotation = show;
    person.telemetryRotations.setEnabled(show);
    if (show) person.telemetry.updateTelemetry();
  }
}

async function idleScene(runIdle: boolean) {
  if (runIdle) {
    const persons = Object.values(t.persons);
    if (!persons || persons.length !== 1) return;
    const range = new AnimationRange('idle-walk-run-strafe', 0, 212);
    for (const mesh of persons[0].skeletonMesh) {
      mesh.position = new Vector3(0, -1, 0);
      mesh.rotation = new Vector3(0, Math.PI, 0);
    }
    t.scene.beginAnimation(persons[0].skeleton, range.from, range.to, true, 0.3);
  } else {
    for (const person of Object.values(t.persons)) {
      for (const mesh of person.skeletonMesh) {
        mesh.position = new Vector3(0, 0, 0);
        mesh.rotation = new Vector3(0, 0, 0);
      }
    }
    await t.scene.stopAllAnimations();
    t.options.showAnchors = true;
    if (dom.btnAnchors) dom.btnAnchors.style.backgroundColor = t.options.showAnchors ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  }
}

export async function skeletonAutoScale() {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  if (persons.length < 1) return;
  persons[0].autoScale();
}

export async function createScene(canvas: HTMLCanvasElement, options?: Partial<MotionOptions>): Promise<Motion> {
  if (t) {
    t.scene.dispose();
    t.engine.dispose();
    t.pipeline.dispose();
    Object.values(t.persons).forEach((p) => p.rootNode.dispose());
  }
  if (!t || t.scene.isDisposed) {
    log('scene create start');
    const engine = await createEngine(settings.engine, canvas);
    t = new Motion(engine, canvas); // create new scene
    if (options) t.setOptions(options, false);
    await initFont();
    if (t.options.skeletonAutoLoad) await t.load();
    if (t.options.createDefaultPerson) {
      await createPerson(`${t.options.personNamePrefix}1`);
      idleScene(t.options.idleAnimate);
    }
    t.scene.registerBeforeRender(() => t.beforeRender());
    log('scene create finish');
  }

  return t;
}
