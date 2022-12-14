import { dom } from './elements';
import { log } from '../log';
import { settings } from '../settings';
import { showInspector, showVectors, showRotation, showTracing, showTracking, showMaximums, skeletonAutoScale, trackPosition, showHighlights, showShaders, showCharts } from '../scene/motion';
import { cameraPresets, showViewports } from '../scene/cameras';
import { boneListSetAll } from '../scene/boneControls';
import type { Motion } from '../types';

const checkButton = (el: HTMLElement) => {
  const checked = el.style.backgroundColor === settings.menu.btnCheckedColor;
  el.style.backgroundColor = checked ? settings.menu.btnUncheckedColor : settings.menu.btnCheckedColor;
  return checked;
};

export const bindMenuRangeControls = () => {
  log('menu bind range controls');
  dom.scaleSceneX.oninput = () => { dom.scaleSceneXVal.value = `x-axis: ${dom.scaleSceneX.valueAsNumber.toFixed(2)}`; };
  dom.scaleSceneY.oninput = () => { dom.scaleSceneYVal.value = `y-axis: ${dom.scaleSceneY.valueAsNumber.toFixed(2)}`; };
  dom.scaleSceneZ.oninput = () => { dom.scaleSceneZVal.value = `z-axis: ${dom.scaleSceneZ.valueAsNumber.toFixed(2)}`; };
  dom.scalePersonX.oninput = () => { dom.scalePersonXVal.value = `x-axis: ${dom.scalePersonX.valueAsNumber.toFixed(2)}`; };
  dom.scalePersonY.oninput = () => { dom.scalePersonYVal.value = `y-axis: ${dom.scalePersonY.valueAsNumber.toFixed(2)}`; };
  dom.scalePersonZ.oninput = () => { dom.scalePersonZVal.value = `z-axis: ${dom.scalePersonZ.valueAsNumber.toFixed(2)}`; };
  dom.interpolation.oninput = () => { dom.interpolationVal.value = `steps: ${dom.interpolation.valueAsNumber.toFixed(0)}`; };
};

export const initMenuControls = (motion: Motion) => {
  log('menu register control bindings');
  if (dom.btnBBoxGizmo) dom.btnBBoxGizmo.onclick = () => motion.setOptions({ enableBBoxGizmo: !checkButton(dom.btnBBoxGizmo) });
  if (dom.btnBoneListImage) dom.btnBoneListImage.onclick = () => { dom.imageBone.style.display = dom.imageBone.style.display === 'block' ? 'none' : 'block'; };
  if (dom.btnBoneListText) dom.btnBoneListText.onclick = () => { dom.boneList.style.display = dom.boneList.style.display === 'grid' ? 'none' : 'grid'; };
  if (dom.btnLog) dom.btnLog.onclick = () => { dom.log.style.visibility = checkButton(dom.btnLog) ? 'hidden' : 'visible'; };
  if (dom.btnStatus) dom.btnStatus.onclick = () => { dom.status.style.visibility = checkButton(dom.btnStatus) ? 'hidden' : 'visible'; };
  if (dom.btnWireframeBone) dom.btnWireframeBone.onclick = () => motion.setOptions({ wireframeBone: !checkButton(dom.btnWireframeBone) });
  if (dom.btnWireframeJoint) dom.btnWireframeJoint.onclick = () => motion.setOptions({ wireframeJoint: !checkButton(dom.btnWireframeJoint) });
  if (dom.interpolation) dom.interpolation.onchange = () => motion.setOptions({ interpolationSteps: dom.interpolation.valueAsNumber });
  if (dom.material) dom.material.onchange = () => motion.setMaterial(dom.material.value);
  if (dom.scalePersonX) dom.scalePersonX.onchange = () => motion.setOptions({ scalePerson: [dom.scalePersonX.valueAsNumber, dom.scalePersonY.valueAsNumber, dom.scalePersonZ.valueAsNumber] });
  if (dom.scalePersonY) dom.scalePersonY.onchange = () => motion.setOptions({ scalePerson: [dom.scalePersonX.valueAsNumber, dom.scalePersonY.valueAsNumber, dom.scalePersonZ.valueAsNumber] });
  if (dom.scalePersonZ) dom.scalePersonZ.onchange = () => motion.setOptions({ scalePerson: [dom.scalePersonX.valueAsNumber, dom.scalePersonY.valueAsNumber, dom.scalePersonZ.valueAsNumber] });
  if (dom.scaleSceneX) dom.scaleSceneX.onchange = () => motion.setOptions({ scaleScene: [dom.scaleSceneX.valueAsNumber, dom.scaleSceneY.valueAsNumber, dom.scaleSceneZ.valueAsNumber] });
  if (dom.scaleSceneY) dom.scaleSceneY.onchange = () => motion.setOptions({ scaleScene: [dom.scaleSceneX.valueAsNumber, dom.scaleSceneY.valueAsNumber, dom.scaleSceneZ.valueAsNumber] });
  if (dom.scaleSceneZ) dom.scaleSceneZ.onchange = () => motion.setOptions({ scaleScene: [dom.scaleSceneX.valueAsNumber, dom.scaleSceneY.valueAsNumber, dom.scaleSceneZ.valueAsNumber] });
  if (dom.btnAutoScale) {
    dom.btnAutoScale.onclick = () => {
      const checked = checkButton(dom.btnAutoScale);
      motion.setOptions({ skeletonAutoScale: !checked });
      if (!checked) skeletonAutoScale();
    };
  }
  if (dom.btnFrustum) {
    dom.btnFrustum.onclick = () => {
      const checked = checkButton(dom.btnFrustum);
      motion.setOptions({ showFrustum: !checked });
      if (motion.options.showFrustum) motion.frustum.show();
      else motion.frustum.hide();
      motion.frustum.update();
    };
  }
  if (dom.btnInpector) {
    dom.btnInpector.onclick = () => {
      checkButton(dom.btnInpector);
      showInspector();
    };
  }
  if (dom.btnViewport1) dom.btnViewport1.onclick = () => showViewports(1);
  if (dom.btnViewport2) dom.btnViewport2.onclick = () => showViewports(2);
  if (dom.btnViewport3) dom.btnViewport3.onclick = () => showViewports(3);
  if (dom.btnViewport4) dom.btnViewport4.onclick = () => showViewports(4);
  if (dom.btnAnchors) {
    dom.btnAnchors.onclick = () => {
      motion.options.showAnchors = !checkButton(dom.btnAnchors);
      motion.shouldUpdate = true;
    };
  }
  if (dom.btnAxisTitle) {
    dom.btnAxisTitle.onclick = () => {
      motion.options.showAxisTitle = !checkButton(dom.btnAxisTitle);
      motion.shouldUpdate = true;
    };
  }
  if (dom.btnUpdatePosition) dom.btnUpdatePosition.onclick = () => trackPosition(!checkButton(dom.btnUpdatePosition));
  if (dom.btnVectors) dom.btnVectors.onclick = () => showVectors(!checkButton(dom.btnVectors));
  if (dom.btnRotation) dom.btnRotation.onclick = () => showRotation(!checkButton(dom.btnRotation));
  if (dom.btnTrace) dom.btnTrace.onclick = () => showTracing(!checkButton(dom.btnTrace));
  if (dom.btnChart) dom.btnChart.onclick = () => showCharts(!checkButton(dom.btnChart));
  if (dom.btnLimitHighlight) dom.btnLimitHighlight.onclick = () => showHighlights(!checkButton(dom.btnLimitHighlight));
  if (dom.btnLimitShader) dom.btnLimitShader.onclick = () => showShaders(!checkButton(dom.btnLimitShader));
  if (dom.btnLimitMax) dom.btnLimitMax.onclick = () => showMaximums(!checkButton(dom.btnLimitMax));
  if (dom.btnLimitTrack) dom.btnLimitTrack.onclick = () => showTracking(!checkButton(dom.btnLimitTrack));

  if (dom.btnCameraAutoRotate) {
    dom.btnCameraAutoRotate.onclick = () => {
      checkButton(dom.btnCameraAutoRotate);
      cameraPresets('autorotate');
    };
  }
  if (dom.btnBoneListAll) dom.btnBoneListAll.onclick = () => boneListSetAll(true);
  if (dom.btnBoneListNone) dom.btnBoneListNone.onclick = () => boneListSetAll(false);

  if (dom.btnCameraFront) dom.btnCameraFront.onclick = () => cameraPresets('frontview');
  if (dom.btnCameraLeft) dom.btnCameraLeft.onclick = () => cameraPresets('lsideview');
  if (dom.btnCameraRight) dom.btnCameraRight.onclick = () => cameraPresets('rsideview');
  if (dom.btnCameraTop) dom.btnCameraTop.onclick = () => cameraPresets('topdown');
  if (dom.btnCameraTargetCenter) dom.btnCameraTargetCenter.onclick = () => cameraPresets('targetcenter');
  if (dom.btnCameraAutoFrame) dom.btnCameraAutoFrame.onclick = () => cameraPresets('autoframe');
  if (dom.btnCameraRotateAlpha) dom.btnCameraRotateAlpha.onclick = () => cameraPresets('rotatealpha');
  if (dom.btnCameraRotateBeta) dom.btnCameraRotateBeta.onclick = () => cameraPresets('rotatebeta');
};
