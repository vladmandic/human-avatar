/**
 * Exports of all type definitions
 */

// data as provided by metrabs
export type Data = null | {
  options: { // options used during processing
    image: string,
    video: string,
    model: string,
    augmentations: number,
    average: number,
    batch: number,
    fov: number,
    iou: number,
    maxpeople: number,
    minconfidence: number,
    skipms: number,
    suppress: number,
    skeleton: string,
  },
  frames: number, // total number of rendered frames
  resolution: [number, number], // input resolution in pixels
  edges: Array<[number, number]>, // defined in model output as well as in `constants.ts`
  joints: Array<string>, // defined in model output as well as in `constants.ts`
  boxes: Array<[number, number, number, number, number][]>, // frame x body x [left, top, width, height, confidence]
  poses: Array<[number, number, number][][]>, // frame x body x pose [pose is a array of points]
  timestamps: Array<number>, // timestamp of each frame
  scalePerson?: [number, number, number], // loaded from override.json
  scaleScene?: [number, number, number], // loaded from override.json
  groundRotation?: [number, number, number], // loaded from override.json
  groundPosition?: [number, number, number], // loaded from override.json
  groundVisibility?: number, // loaded from override.json
}

export type Point = [number, number, number];

export type MotionData = {
  timestamp: number,
  weight?: number,
  keypoints: Point[],
  scores: number[],
  score: number,
};

export type EnvironmentOptions = {
  environmentTexture: string,
  skyboxTexture: string,
  groundTexture: string,
  skyboxSize: number,
  groundSize: number,
};

export type RendererOptions = {
  enableHDR: boolean,
  imageProcessing: Record<string, unknown>,
  colorCurve: Record<string, unknown>,
};

export type MotionOptions = {
  minScore: number,
  maxPersons: number,
  showSkeleton: boolean,
  showSimpleModel: boolean,
  showAnchors: boolean,
  showAxisTitle: boolean,
  showInputMedia: boolean,
  showCloneCanvases: boolean,
  showFrustum: boolean,
  enableBBoxGizmo: boolean,
  animationDuration: number,
  interpolationSteps: number,
  slerpValue: number,
  scalePerson: [number, number, number],
  scaleScene: [number, number, number],
  wireframeBone: boolean,
  wireframeJoint: boolean,
  showPersonTitle: boolean;
  ikLevel: 0 | 1,
  personNamePrefix: string,
  frameNamePrefix: string,
  cloneNamePrefix: string,
  createDefaultPerson: boolean,
  skeletonAutoLoad: boolean,
  skeletonAutoScale: boolean,
  skeletonPathUrl: string,
  skeletonFileUrl: string,
  inputChangeResetCamera: boolean,
  groundMirror: boolean,
  groundSpotlights: boolean,
  groundSpotlightColorLeft: string,
  groundSpotlightColorRight: string,
  groundAutoRotation: number,
  groundAutoPosition: number,
  groundRotation: [number, number, number],
  groundPosition: [number, number, number],
  groundAlpha: number,
  groundVisibility: number,
  idleRotate: boolean,
  idleAnimate: boolean,
}

export type SceneOptions = {
  viewports: number,
  cameras: { name: string, position: [number, number, number] }[],
  presets: string[],
}

export type MenuOptions = {
  width: number,
  backgroundColor: string,
  btnDefaultColor: string,
  btnCheckedColor: string,
  btnUncheckedColor: string,
  allowImages: boolean,
  allowVideos: boolean,
}

export type TelemetryOptions = {
  rotation: boolean,
  vectors: boolean,
  trace: boolean,
  chart: boolean,
}

export type LimitsOptions = {
  highlight: boolean,
  shader: boolean,
  maximums: boolean,
  track: boolean,
}

export type { Motion } from '../motion/Motion';
export type { Person, PersonOptions } from '../person/Person';
export type { Frame } from '../frame/Frame';
export type { TextMesh } from './TextMesh';
export type { FrameData } from '../motion/processData';
