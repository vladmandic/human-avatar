/**
 * Exports of all type definitions
 */

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
  skyboxSize: number,
};

export type RendererOptions = {
  enableHDR: boolean,
  imageProcessing: Record<string, unknown>,
  colorCurve: Record<string, unknown>,
};

export type MotionOptions = {
  showAnchors: boolean,
  showAxisTitle: boolean,
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

export type { Motion } from './scene/motion';
export type { Person } from './person/person';
export type { TextMesh } from './components/textMesh';
