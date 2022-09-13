export const dom = { // pointers to dom objects
  // global items
  log: document.getElementById('log') as HTMLPreElement,
  status: document.getElementById('status') as HTMLPreElement,
  media: document.getElementById('media') as HTMLDivElement,
  json: document.getElementById('json') as HTMLDivElement,
  video: document.getElementById('video') as HTMLVideoElement,
  image: document.getElementById('image') as HTMLImageElement,
  output: document.getElementById('output') as HTMLCanvasElement,
  chart: document.getElementById('chart') as HTMLCanvasElement,
  // menu items
  imageBone: document.getElementById('menuBoneImage') as HTMLImageElement,
  boneList: document.getElementById('menuBoneList') as HTMLDivElement,
  btnAllowImages: document.getElementById('menuBtnAllowImages') as HTMLButtonElement,
  btnAllowVideos: document.getElementById('menuBtnAllowVideos') as HTMLButtonElement,
  btnAnchors: document.getElementById('menuBtnAnchors') as HTMLButtonElement,
  btnAutoScale: document.getElementById('menuBtnAutoScale') as HTMLButtonElement,
  btnAxisTitle: document.getElementById('menuBtnAxisTitle') as HTMLButtonElement,
  btnBBoxGizmo: document.getElementById('menuBtnBBoxGizmo') as HTMLButtonElement,
  btnBoneListImage: document.getElementById('menuBtnBoneListImage') as HTMLButtonElement,
  btnBoneListText: document.getElementById('menuBtnBoneListText') as HTMLButtonElement,
  btnCameraAutoFrame: document.getElementById('menuCameraAutoFrame') as HTMLButtonElement,
  btnCameraAutoRotate: document.getElementById('menuCameraAutoRotate') as HTMLButtonElement,
  btnCameraFront: document.getElementById('menuCameraViewFront') as HTMLButtonElement,
  btnCameraLeft: document.getElementById('menuCameraViewLSide') as HTMLButtonElement,
  btnCameraRight: document.getElementById('menuCameraViewRSide') as HTMLButtonElement,
  btnCameraRotateAlpha: document.getElementById('menuCameraRotateAlpha') as HTMLButtonElement,
  btnCameraRotateBeta: document.getElementById('menuCameraRotateBeta') as HTMLButtonElement,
  btnCameraTargetCenter: document.getElementById('menuCameraTargetCenter') as HTMLButtonElement,
  btnCameraTop: document.getElementById('menuCameraViewTop') as HTMLButtonElement,
  btnChart: document.getElementById('menuBtnChart') as HTMLButtonElement, // TBD
  btnClear: document.getElementById('menuBtnClear') as HTMLButtonElement,
  btnFrustum: document.getElementById('menuBtnFrustum') as HTMLButtonElement,
  btnInpector: document.getElementById('menuBtnInspector') as HTMLButtonElement,
  btnInputAppend: document.getElementById('menuBtnInputAppend') as HTMLButtonElement, // TBD
  btnInputClear: document.getElementById('menuBtnInputClear') as HTMLButtonElement,
  btnLimitHighlight: document.getElementById('menuBtnLimitHighlight') as HTMLButtonElement,
  btnLimitShader: document.getElementById('menuBtnLimitShader') as HTMLButtonElement,
  btnLimitMax: document.getElementById('menuBtnLimitMax') as HTMLButtonElement,
  btnLimitTrack: document.getElementById('menuBtnLimitTrack') as HTMLButtonElement,
  btnLog: document.getElementById('menuBtnLog') as HTMLButtonElement,
  btnRecordVideo: document.getElementById('menuBtnRecordVideo') as HTMLButtonElement,
  btnRecordScreenshot: document.getElementById('menuBtnRecordScreenshot') as HTMLButtonElement,
  btnRotation: document.getElementById('menuBtnRotation') as HTMLButtonElement,
  btnShowClones: document.getElementById('menuBtnShowClones') as HTMLButtonElement,
  btnShowInput: document.getElementById('menuBtnShowInput') as HTMLButtonElement,
  btnStatus: document.getElementById('menuBtnStatus') as HTMLButtonElement,
  btnTrace: document.getElementById('menuBtnTrace') as HTMLButtonElement,
  btnUpdatePosition: document.getElementById('menuBtnUpdatePosition') as HTMLButtonElement,
  btnVectors: document.getElementById('menuBtnVectors') as HTMLButtonElement,
  btnViewport1: document.getElementById('menuViewport1') as HTMLButtonElement,
  btnViewport2: document.getElementById('menuViewport2') as HTMLButtonElement,
  btnViewport3: document.getElementById('menuViewport3') as HTMLButtonElement,
  btnViewport4: document.getElementById('menuViewport4') as HTMLButtonElement,
  btnWireframeBone: document.getElementById('menuBtnWireframeBone') as HTMLButtonElement,
  btnWireframeJoint: document.getElementById('menuBtnWireframeJoint') as HTMLButtonElement,
  btnBoneListAll: document.getElementById('menuBtnBoneListAll') as HTMLButtonElement,
  btnBoneListNone: document.getElementById('menuBtnBoneListNone') as HTMLButtonElement,
  btnGroundEnabled: document.getElementById('menuBtnGroundEnabled') as HTMLButtonElement,
  groundLevel: document.getElementById('menuGroundLevel') as HTMLInputElement,
  groundLevelVal: document.getElementById('menuGroundLevelVal') as HTMLOutputElement,
  groundRotation: document.getElementById('menuGroundRotation') as HTMLInputElement,
  groundRotationVal: document.getElementById('menuGroundRotationVal') as HTMLOutputElement,
  interpolation: document.getElementById('menuInterpolation') as HTMLInputElement,
  interpolationVal: document.getElementById('menuInterpolationVal') as HTMLOutputElement,
  material: document.getElementById('menuMaterial') as HTMLSelectElement,
  maxPersons: document.getElementById('menuMaxPersons') as HTMLInputElement,
  maxPersonsVal: document.getElementById('menuMaxPersonsVal') as HTMLOutputElement,
  menu: document.getElementById('menu') as HTMLDivElement,
  menuResize: document.getElementById('menuResizeBar') as HTMLDivElement,
  minScore: document.getElementById('menuMinScore') as HTMLInputElement,
  minScoreVal: document.getElementById('menuMinScoreVal') as HTMLOutputElement,
  model: document.getElementById('menuModel') as HTMLSelectElement,
  persons: document.getElementById('menuPersons') as HTMLDivElement,
  recordFPS: document.getElementById('menuRecordFPS') as HTMLInputElement,
  recordResolutionX: document.getElementById('menuRecordResolutionX') as HTMLInputElement,
  recordResolutionY: document.getElementById('menuRecordResolutionY') as HTMLInputElement,
  scalePersonX: document.getElementById('menuScalePersonX') as HTMLInputElement,
  scalePersonXVal: document.getElementById('menuScalePersonXVal') as HTMLOutputElement,
  scalePersonY: document.getElementById('menuScalePersonY') as HTMLInputElement,
  scalePersonYVal: document.getElementById('menuScalePersonYVal') as HTMLOutputElement,
  scalePersonZ: document.getElementById('menuScalePersonZ') as HTMLInputElement,
  scalePersonZVal: document.getElementById('menuScalePersonZVal') as HTMLOutputElement,
  scaleSceneX: document.getElementById('menuScaleSceneX') as HTMLInputElement,
  scaleSceneXVal: document.getElementById('menuScaleSceneXVal') as HTMLOutputElement,
  scaleSceneY: document.getElementById('menuScaleSceneY') as HTMLInputElement,
  scaleSceneYVal: document.getElementById('menuScaleSceneYVal') as HTMLOutputElement,
  scaleSceneZ: document.getElementById('menuScaleSceneZ') as HTMLInputElement,
  scaleSceneZVal: document.getElementById('menuScaleSceneZVal') as HTMLOutputElement,
  selectInput: document.getElementById('menuSelectInput') as HTMLSelectElement,
  selectInputList: document.getElementById('menuSelectInputList') as HTMLDataListElement,
};

export function initDomElements() {
  //
}
