/**
 * Class that creates an instance of a person
 * No external dependencies
 */

import { Scene, Mesh, Skeleton, Vector3, Color3, BoneLookController, Bone, StandardMaterial, MeshBuilder, DynamicTexture, Material, ShaderMaterial, AbstractMesh, Nullable, SkeletonViewer, MultiMaterial } from '@babylonjs/core';
import { CustomMaterial, PBRCustomMaterial } from '@babylonjs/materials';
import { skeletonAutoScale } from './skeletonScale';
import { ContextMenu } from './ContextMenu';
import { TextMesh } from '../shared/TextMesh';
import { BoneLookList, BoneDisableL1, adjustLookAngles } from '../shared/modelConstants';
import { setSkeletonMaterials, BoneShaderInfo } from './skeletonMaterial';
import { interpolateData, normalizeKeypoints } from '../shared/mathCalculations';
import { Telemetry } from '../telemetry/Telemetry';
import { Kinematics } from './Kinematics';
import { settings } from '../settings';
import { log } from '../shared/log';
// import { createBoneShader } from './boneShader';
import type { MotionData, Point, Motion } from '../shared/types';

export type PersonOptions = {
  showBoundingBox: boolean;
  showVectors: boolean;
  showRotation: boolean;
  showTracing: boolean;
  showCharts: boolean;
  showHighlights: boolean,
  showMaximums: boolean,
  showShaders: boolean,
  showTrack: boolean,
  updatePosition: boolean;
};

export class Person {
  // internal variables
  ready: boolean = false;
  id: number;
  name: string;
  active: boolean = false;
  options: PersonOptions;
  rootNode: AbstractMesh;
  positions: AbstractMesh;
  anchors: AbstractMesh;
  telemetryVectors: AbstractMesh;
  telemetryRotations: AbstractMesh;
  telemetryTracing: AbstractMesh;
  motion: Motion;
  scene: Scene;
  skeleton: Skeleton | undefined = undefined;
  skeletonMesh: Mesh[] = [];
  skeletonMaterial: Nullable<Material> = null;
  title: TextMesh | undefined;
  position: Mesh; // person anchor
  lookControllers: Record<string, BoneLookController> = {};
  kinematics: Kinematics; // subclass that handles updating positions/rotations/look controllers
  current: MotionData = { timestamp: 0, weight: 100, keypoints: [], scores: [], score: 0 };
  interpolated: MotionData = { timestamp: 1, keypoints: [], scores: [], score: 0 };
  normalized: Point[] = [];
  normalizedOffsets: Point[] = [];
  telemetry: Telemetry; // subclass that handles telemetry calculations
  weightShader?: ShaderMaterial;
  menu: ContextMenu;
  offsets: Point = [0, 0, 0];
  boneShaderInfo?: BoneShaderInfo;
  bbox: { min: Point, max: Point, avg: Point } = { min: [0, 0, 0], max: [0, 0, 0], avg: [0, 0, 0] };
  shouldUpdate: boolean = false; // true if ik needs to update person
  shouldScale: boolean = false; // true if need to rescale
  detached: boolean = false; // true if person is no longer attached to a controller
  image: string | null = null; // set for clone
  // eslint-disable-next-line no-use-before-define
  clones: Person[] = []; // list of clones
  // eslint-disable-next-line no-use-before-define
  parent: Person | null = null; // set if this is a clone instance
  posError: number = 0; // temporary positional error due to bone calculations
  interpolationStep: number = 0; // internal current interpolation step

  static async create(name: string, motion: Motion, position?: Point) {
    // use static method to create class instance since constructor cannot have async method which is required by load
    const person = new Person(name, motion, position);
    await person.clone(name);
    const hips = person.getBone('Hips');
    if (hips) {
      hips.position = position ? new Vector3(position[0], position[1], position[2]) : new Vector3(0, 0, 0);
      hips.rotation = new Vector3(0, Math.PI, 0);
      hips.scaling = new Vector3(1, 1, 0.85); // reduce depth for better visual
    }
    await person.initLookControllers();
    if (person.motion.ground.mirror && person.motion.ground.mirror.renderList) {
      for (const mesh of person.skeletonMesh) person.motion.ground.mirror.renderList.push(mesh);
    }
    person.shouldUpdate = true;
    return person;
  }

  constructor(name: string, motion: Motion, position?: Point) {
    this.id = Object.keys(motion.persons).length;
    this.name = name;
    this.motion = motion;
    this.options = { ...settings.person };
    this.scene = motion.scene;
    this.rootNode = new AbstractMesh(`person:${name}`, this.scene);
    this.rootNode.id = name;
    this.positions = new AbstractMesh('positions', this.scene);
    this.positions.parent = this.rootNode;
    this.anchors = new AbstractMesh('anchors', this.scene);
    this.anchors.parent = this.rootNode;
    this.telemetryVectors = new AbstractMesh('vectors', this.scene);
    this.telemetryVectors.parent = this.rootNode;
    this.telemetryRotations = new AbstractMesh('rotations', this.scene);
    this.telemetryRotations.parent = this.rootNode;
    this.telemetryTracing = new AbstractMesh('tracing', this.scene);
    this.telemetryTracing.parent = this.rootNode;
    //
    this.position = this.createAnchor('center', settings.theme.centerColor, 0.2, this.rootNode);
    this.position.parent = this.positions;
    this.position.position = position ? new Vector3(position[0], position[1], position[2]) : new Vector3(0, 0, 0);
    this.telemetry = new Telemetry(this);
    this.kinematics = new Kinematics(this);
    if (this.motion.options.showPersonTitle) {
      this.title = new TextMesh(name, this.motion.layer.utilityLayerScene);
      this.title.rootNode.scaling = new Vector3(settings.theme.personTitleSize / 1500, settings.theme.personTitleSize / 1500, settings.theme.personTitleSize / 1500);
      this.title.rootNode.parent = this.rootNode;
      this.title.rootNode.name = 'title';
    }
    this.menu = new ContextMenu(this, this.scene);
    // this.scene.registerBeforeRender(() => this.beforeRender());
  }

  async clone(name: string) {
    const instance = this.motion.container?.instantiateModelsToScene();
    if (!instance) return; // something went wrong
    instance.rootNodes[0].name = 'skeleton';
    instance.rootNodes[0].parent = this.rootNode;
    this.skeleton = instance.skeletons[0];
    this.skeleton.name = name;
    this.skeletonMesh = instance.rootNodes[0]?.getChildren().filter((mesh) => (mesh as Mesh).useBones) as Mesh[]; // TBD xbot has separate surface/joints meshes
    for (const mesh of this.skeletonMesh) {
      mesh.isPickable = false;
      mesh.showBoundingBox = this.options.showBoundingBox;
    }
    this.skeletonMaterial = this.skeletonMesh[0]?.material;
    setSkeletonMaterials(this, this.skeletonMesh, settings.material);
  }

  getBone = (name: string): Bone => {
    const bone = (this.skeleton ? this.skeleton.bones.find((b) => b.name === name) : null) as Bone;
    if (!bone) log('getBone error:', { bone: name, skeleton: this.skeleton?.bones });
    return bone;
  };

  getOrigin = (name: string) => this.positions.getChildMeshes(true, (node) => node.name === name) as Mesh[];

  getTarget = (name: string) => this.anchors.getChildMeshes(true, (node) => node.name === name) as Mesh[];

  show = () => {
    if (!this.rootNode.isEnabled()) this.rootNode.setEnabled(true);
  };

  hide = () => {
    if (this.rootNode.isEnabled()) this.rootNode.setEnabled(false);
  };

  updateTitle = (title?: string) => {
    if (title) {
      if (this.title) this.title.dispose();
      this.title = new TextMesh(title, this.motion.layer.utilityLayerScene);
      this.title.rootNode.scaling = new Vector3(settings.theme.personTitleSize / 1000, settings.theme.personTitleSize / 1000, settings.theme.personTitleSize / 1000);
      this.title.rootNode.parent = this.rootNode;
      this.title.rootNode.name = 'title';
    }
    const head = this.getBone('Head');
    const left = (this.title?.width || 0) / settings.theme.personTitleSize;
    if (head && this.title) this.title.rootNode.position = new Vector3(head.getAbsolutePosition().x - left, head.getAbsolutePosition().y + 0.35, head.getAbsolutePosition().z); // reposition title text above person
    if (this.title) this.title.rootNode.setEnabled(this.motion.options.showPersonTitle);
  };

  beforeRender = () => { // per-person loop runs before each frame
    if (!this.rootNode.isEnabled()) return;
    if (this.motion.shouldUpdate) this.shouldUpdate = true;
    if (this.shouldUpdate) this.updateTitle();
    if (!this.kinematics || !this.telemetry) return;
    if (!this.skeleton || !this.skeletonMesh) return;
    if (this.current.keypoints.length === 0) return;

    const isDataNew = (Date.now() - this.current.timestamp) < 200 * (this.motion.options.interpolationSteps + 1); // is latest received data newer than ~2sec?
    const isDataInterpolation = this.interpolationStep < 10 * (this.motion.options.interpolationSteps + 1); // is latest received data newer than ~10x required interpolations?
    if (this.shouldUpdate || isDataInterpolation || (!this.detached && isDataNew)) {
      // if (!this.detached) console.log('HERE1', this.shouldUpdate, isDataInterpolation, isDataNew);
      this.interpolationStep++;
      this.interpolated = interpolateData(this.current, this.interpolated, this.motion.options); // time interpolate results
      this.normalized = normalizeKeypoints(this.interpolated.keypoints, this.motion.options.scalePerson, this.offsets, this.normalizedOffsets);
      this.posError = this.kinematics.setRootPositions();
      this.bbox.min = this.normalized[this.normalized.length - 3];
      this.bbox.max = this.normalized[this.normalized.length - 2];
      this.bbox.avg = this.normalized[this.normalized.length - 1];
      for (const mesh of this.skeletonMesh) mesh.visibility = 1 - this.posError; // TBD workaround since positional error should not exist
      this.kinematics.setLookTargets();
      this.kinematics.setLimbRotation();
      this.kinematics.manualCorrections();
      this.shouldUpdate = true;
      this.motion.shouldUpdate = true;
      // this.skeletonMesh.setEnabled(true);
    }
    if (!this.detached && this.shouldUpdate) {
      for (const lookController of Object.values(this.lookControllers)) lookController.update(); // update look controllers
      this.telemetry.updateTelemetry(); // update telemetry data
      for (const clone of this.clones) clone.telemetry?.updateTelemetry(); // update telemetry data that is relative to this person
      let visibility = 1;
      if (this.current.score < this.motion.options.minScore) visibility = Math.max(0, 1 - (this.motion.options.interpolationSteps / 60));
      for (const mesh of this.skeletonMesh) mesh.visibility = visibility;
    }
    this.shouldUpdate = this.posError > 0.01; // repeat if positional error in skeleton bones
    this.ready = true;
  };

  updateData = (keypoints: Point[], score: number) => { // update is triggered after each frame
    if (keypoints) {
      if (this.normalizedOffsets.length !== keypoints.length) this.normalizedOffsets = new Array(keypoints.length).fill([0, 0, 0]);
      this.current.timestamp = Date.now();
      this.current.keypoints = keypoints;
      this.current.score = score;
      this.interpolationStep = 0;
      this.shouldUpdate = true;
    }
  };

  createAnchor = (name: string, color: string, diameter: number, parent: AbstractMesh): Mesh => {
    const texture = new DynamicTexture(name, { width: 350, height: 150 }, this.scene, false);
    texture.drawText(name, null, null, settings.theme.jointFont, settings.theme.jointFontColor, color, false);
    texture.uOffset = 0.25;
    texture.vAng = 2.2;
    const material = new StandardMaterial(`${parent.name}:${name}`, this.scene);
    material.diffuseTexture = texture;
    material.specularPower = 128;
    material.specularColor = Color3.FromHexString('#222222');
    const sphere = MeshBuilder.CreateSphere(name, { diameter, updatable: true }, this.scene);
    // @ts-ignore custom property
    Object.defineProperties(sphere, { keypointId: { value: -1, writable: true } });
    sphere.material = material;
    sphere.parent = parent;
    return sphere;
  };

  initLookControllers = () => {
    // @ts-ignore
    window.bone = {};
    if (!this.skeleton || !this.skeletonMesh) return;
    for (const bone of this.skeleton.bones) {
      const positionMesh: Mesh = this.createAnchor(bone.name, settings.theme.jointPositionColor, settings.theme.jointPositionSize, this.positions);
      positionMesh.position = bone.getAbsolutePosition();
      positionMesh.setEnabled(false);
      // @ts-ignore
      window.bone[bone.name] = bone;
    }
    for (const [boneName, boneTarget] of Object.entries(BoneLookList)) { // create look anchors and controllers
      if ((this.motion.options.ikLevel === 1) && BoneDisableL1.includes(boneName)) continue;
      const bone = this.getBone(boneName);
      if (!bone) continue;
      const targetMesh: Mesh = this.createAnchor(bone.name, settings.theme.jointTargetColor, settings.theme.jointTargetSize, this.anchors);
      targetMesh.position = boneTarget ? this.getBone(boneTarget).getAbsolutePosition() : bone.getAbsolutePosition();
      if (boneTarget) bone.length = Vector3.Distance(this.getBone(boneTarget).position, bone.position);
      this.lookControllers[bone.name] = new BoneLookController(this.skeletonMesh[0], bone, targetMesh.position, { slerpAmount: this.motion.options.slerpValue }); // 0.01 is highest slerp
    }
    adjustLookAngles(this.lookControllers); // fixed angle offsets
    this.telemetry?.updateTelemetry();
    this.kinematics?.update();
  };

  setSkeletonMaterial = (material: string) => {
    if (!this.skeletonMesh) return;
    setSkeletonMaterials(this, this.skeletonMesh, material);
  };

  autoScale = () => skeletonAutoScale(this);

  setBoneWeightShader = (targetBoneIndex: number) => {
    if (!this.skeleton || !this.skeletonMesh || !this.skeletonMaterial) return;
    if (this.name.startsWith(this.motion.options.cloneNamePrefix)) return; // abort
    if (!this.weightShader) {
      const weightShaderColorOptions = {
        skeleton: this.skeleton,
        colorBase: Color3.FromHexString(settings.theme.telemetryColorBase),
        colorZero: Color3.FromHexString(settings.theme.telemetryColorZero),
        colorQuarter: Color3.FromHexString(settings.theme.telemetryColorQuarter),
        colorHalf: Color3.FromHexString(settings.theme.telemetryColorHalf),
        colorFull: Color3.FromHexString(settings.theme.telemetryColorFull),
      };
      this.weightShader = SkeletonViewer.CreateBoneWeightShader(weightShaderColorOptions, this.scene);
    }
    if (targetBoneIndex >= 0) {
      this.weightShader.setFloat('targetBoneIndex', targetBoneIndex);
      this.skeletonMesh[0].material = this.weightShader; // TBD this fails on clone
      this.skeletonMesh[0].material.wireframe = this.motion.options.wireframeBone;
    } else {
      this.skeletonMesh[0].material = this.skeletonMaterial;
    }
  };

  setBoneColor = (boneIndex: number, enabled: boolean, colorBase?: Point, colorFocus?: Point) => {
    if (!this.skeletonMesh || !this.skeletonMesh[0]) return;
    const material = (this.skeletonMesh[0].material instanceof MultiMaterial
      ? (this.skeletonMesh[0].material as MultiMaterial).getChildren()[0] as PBRCustomMaterial
      : this.skeletonMesh[0].material) as CustomMaterial;
    if (!material) return;
    if (material instanceof PBRCustomMaterial) {
      if (!this.boneShaderInfo) return;
      this.boneShaderInfo.enabled[boneIndex] = enabled ? 1 : -1;
      if (colorBase) this.boneShaderInfo.colorsBase[boneIndex] = colorBase;
      if (colorFocus) this.boneShaderInfo.colorsFocus[boneIndex] = colorFocus;
    } else {
      this.setBoneWeightShader(boneIndex);
    }
  };
}
