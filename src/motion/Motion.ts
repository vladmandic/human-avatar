/**
 * Motion class is a top-level class that contains all other instances and methods
 */

// eslint-disable-next-line max-len
import { Scene, Mesh, Nullable, SceneOptimizer, DefaultRenderingPipeline, ArcRotateCamera, DirectionalLight, HemisphericLight, ShadowGenerator, EnvironmentHelper, Animation, Color3, Vector3, StandardMaterial, SpotLight, BoundingBoxGizmo, DirectionalLightFrustumViewer, UtilityLayerRenderer, AssetContainer, GlowLayer } from '@babylonjs/core';
import '@babylonjs/inspector';
import { log } from '../shared/log';
import { setTextScene, drawText } from '../shared/text3D';
import { centerCamera, initCameras, introAnimation, showViewports } from './cameraControls';
import { attachPointerControls } from './pointerEvents';
import { createBoneDomElements } from './boneListControls';
import { Optimizer } from './Optimizer';
import { settings } from '../settings';
import { clearCache, processData } from './processData';
import { loadSkeleton } from '../person/skeletonLoad';
import { Pipeline } from './Pipeline';
import { Ground } from './Ground';
import type { Person, Frame, Data, MotionOptions, SceneOptions } from '../shared/types';
import type { E } from './createEngine';

export interface Global extends Window {
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
  optimizer: SceneOptimizer;
  ground: Ground;
  container: AssetContainer | undefined = undefined;
  axisText: Mesh[] = [];
  pickedMesh: Nullable<Mesh> = null;
  logo: Nullable<Mesh> = null;
  pickedPosition: Nullable<Vector3> = null;
  pickedPerson: Nullable<Person> = null;
  persons: Record<string, Person> = {};
  frames: Record<string, Frame> = {};
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
    this.ground = new Ground(this);
    const skybox = this.scene.meshes.find((m) => m.name === 'BackgroundSkybox') as Mesh;
    skybox.name = 'skybox';

    // utility layer that hosts all controls
    this.layer = new UtilityLayerRenderer(this.scene);

    // lights
    const ambient = new HemisphericLight('light:hemispheric', new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 1;
    ambient.groundColor = Color3.FromHexString(settings.theme.groundColor);
    ambient.specular = Color3.FromHexString(settings.theme.ambientColor);
    ambient.parent = environment;
    this.light = new DirectionalLight('light:directional', new Vector3(1, -1, 1), this.scene);
    this.light.intensity = 15;
    this.light.autoCalcShadowZBounds = true;
    this.light.diffuse = new Color3(1, 1, 1);
    this.light.specular = Color3.FromHexString(settings.theme.groundColor);
    this.light.position = new Vector3(-3, 3, -3);
    this.light.parent = environment;
    if (settings.motion.groundSpotlights) {
      const spotLeft = new SpotLight('spotlight:left', new Vector3(15, 15, -15), new Vector3(-1.8, -1, 1), Math.PI / 2, 20, this.scene);
      spotLeft.diffuse = new Color3(1, 1, 0); // yellow
      spotLeft.specular = Color3.FromHexString(this.options.groundSpotlightColorLeft);
      spotLeft.shadowEnabled = false;
      spotLeft.intensity = 5;
      spotLeft.parent = this.ground.box;
      const spotRight = new SpotLight('spotlight:right', new Vector3(-15, 15, -15), new Vector3(1.8, -1, 1), Math.PI / 2, 20, this.scene);
      spotRight.diffuse = new Color3(1, 1, 0); // yellow
      spotRight.specular = Color3.FromHexString(this.options.groundSpotlightColorRight);
      spotRight.shadowEnabled = false;
      spotRight.intensity = 5;
      spotRight.parent = this.ground.box;
    }
    this.shadows = new ShadowGenerator(1024, this.light, false);
    this.shadows.transparencyShadow = true;
    this.shadows.depthScale = 60.0;
    this.shadows.frustumEdgeFalloff = 1.0;

    // optimizer
    this.optimizer = new Optimizer(this.scene).optimizer;

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
    for (const frame of Object.values(this.frames)) frame.rootNode.dispose();
    this.scene.dispose();
  };

  process = (data?: Data, frame?: number) => {
    processData(this, data, frame);
  };

  clearData = () => clearCache();

  setOptions(options: Partial<MotionOptions>, skipRender?: boolean) {
    this.options = { ...this.options, ...options };
    settings.motion = this.options;
    if (!skipRender) {
      log('motion set options:', options);
      this.process();
    }
  }

  setSceneOptions(options: Partial<SceneOptions>, skipRender?: boolean) {
    settings.scene = { ...settings.scene, ...options };
    if (!skipRender) {
      log('motion set options:', options);
      this.process();
    }
  }

  async renderFrames() {
    for (const frame of Object.values(this.frames)) {
      if (frame.rootNode.isEnabled()) {
        if (this.options.showSimpleModel) frame.beforeRender();
        else frame.rootNode.setEnabled(false);
      }
    }
  }

  async renderPersons() {
    for (const person of Object.values(this.persons)) {
      if (person.rootNode.isEnabled()) {
        if (this.options.showSkeleton) person.beforeRender();
        else person.rootNode.setEnabled(false);
      }
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
      for (const mesh of this.axisText) mesh.parent = this.ground.box;
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
    if (model === 'skeleton') {
      this.options.showSkeleton = true;
      this.options.showSimpleModel = false;
    } else if (model === 'simple') {
      this.options.showSkeleton = false;
      this.options.showSimpleModel = true;
    } else {
      this.options.showSkeleton = true;
      this.options.showSimpleModel = true;
    }
    Object.values(this.frames).forEach((frame) => frame.rootNode.setEnabled(this.options.showSimpleModel));
    Object.values(this.persons).forEach((person) => person.rootNode.setEnabled(this.options.showSkeleton));
    this.process();
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
    this.renderFrames(); // each frame checks if it should be updated
    this.renderPersons(); // each person checks if it should be updated
    if (this.shouldUpdate) { // if any frame or person was updated
      this.setWireframe();
      this.showAxisTitle();
      this.showAnchors();
      this.ground.updatePlane();
      this.shouldUpdate = false;
    }
    const activePersons = Object.values(this.persons).filter((p) => p.rootNode.isEnabled()).length;
    const readyPersons = Object.values(this.persons).filter((p) => p.ready).length;
    this.ready = activePersons === readyPersons;
  }
}
