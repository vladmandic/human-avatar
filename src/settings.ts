/**
 * JSON with default settings
 */

import type { EnvironmentOptions, MotionOptions, RendererOptions, PersonOptions, MenuOptions, SceneOptions, TelemetryOptions, LimitsOptions, Point } from './shared/types';
import { darkTheme } from './themes';

export type Settings = {
  environment: EnvironmentOptions,
  motion: MotionOptions,
  renderer: RendererOptions,
  person: PersonOptions,
  scene: SceneOptions,
  telemetry: TelemetryOptions,
  limits: LimitsOptions,
  theme: typeof darkTheme,
  material: 'standard' | 'glass' | 'metal' | 'default',
  engine: 'webgl' | 'webgpu',
  menu: MenuOptions,
}

export const settings: Settings = {
  // rendering engine
  engine: 'webgl' as const, // webgl or webgpu,

  // theme settigs
  theme: darkTheme,
  material: 'glass' as const, // standard, metal or glass,

  // ui options
  menu: {
    width: 340,
    backgroundColor: 'rgba(30, 30, 30, 0.75)',
    btnDefaultColor: 'rgb(80, 85, 92)',
    btnUncheckedColor: 'rgb(200, 100, 100)',
    btnCheckedColor: 'rgb(100, 100, 200)',
    allowImages: true,
    allowVideos: true,
  },

  // renderer options
  renderer: {
    enableHDR: true,
    imageProcessing: {
      contrast: 1.3,
      exposure: 1.0,
    },
    colorCurve: {
      globalHue: 200,
      globalDensity: 80,
      globalSaturation: 80,
      highlightsHue: 20,
      highlightsDensity: 80,
      highlightsSaturation: -80,
      shadowsHue: 2,
      shadowsDensity: 80,
      shadowsSaturation: 40,
    },
  },

  // environment options
  environment: {
    environmentTexture: './assets/scene-environment.env',
    skyboxTexture: './assets/scene-skybox.dds',
    groundTexture: './assets/scene-ground.env',
    skyboxSize: 100,
    groundSize: 40,
  },

  scene: {
    viewports: 1,
    cameras: [
      { name: 'camera:main', position: [0, 2.5, -25] },
      { name: 'camera:top', position: [0, 25, -2.5] },
      { name: 'camera:side-left', position: [-25, 2.5, 0] },
      { name: 'camera:side-right', position: [25, 2.5, 0] },
    ],
    presets: [
      'autoframe',
      'center',
      'frontview',
    ],
  },

  // motion options
  motion: {
    // show accessories
    showAnchors: true,
    showSimpleModel: false,
    showSkeleton: true,
    showAxisTitle: true,
    showPersonTitle: true,
    showInputMedia: true,
    showCloneCanvases: true,
    showFrustum: false,
    enableBBoxGizmo: false,

    // scene options
    scaleScene: [1.5, 1.0, 1.0] as Point,
    animationDuration: 1000,
    skeletonAutoLoad: true,
    skeletonAutoScale: true,
    skeletonPathUrl: './assets/',
    skeletonFileUrl: 'ybot.babylon',
    createDefaultPerson: true,
    inputChangeResetCamera: true,
    idleRotate: true,
    idleAnimate: true,

    // ground options
    groundMirror: true,
    groundSpotlights: true,
    groundSpotlightColorLeft: '#FF00FF',
    groundSpotlightColorRight: '#00FFFF',
    groundAlpha: 0.25,
    groundVisibility: 1,
    groundAutoRotation: 0, // 0=never, 1=onload, 2=always
    groundAutoPosition: 1, // 0=never, 1=onload, 2=always
    groundRotation: [0, 0, 0],
    groundPosition: [0, 0, 0],

    // person options: global
    maxPersons: 10,
    minScore: 0.1,
    wireframeBone: true,
    wireframeJoint: false,
    personNamePrefix: 'PERSON ',
    frameNamePrefix: 'FRAME ',
    cloneNamePrefix: 'CLONE ',

    // kinematics options: global
    scalePerson: [2.70, 1.60, 2.10] as Point,
    interpolationSteps: 10,
    slerpValue: 1, // additional interpolation, 0=infinite, 1=none
    ikLevel: 0, // 0=full, 1=limited
  },

  telemetry: {
    rotation: true,
    vectors: true,
    trace: false,
    chart: false,
  },

  limits: {
    highlight: false,
    shader: true,
    maximums: false,
    track: false,
  },

  // person options: local
  person: {
    showBoundingBox: false,
    showVectors: true,
    showRotation: true,
    showTracing: false,
    showCharts: false,
    showHighlights: true,
    showMaximums: false,
    showShaders: true,
    showTrack: false,
    updatePosition: true,
  },
};
