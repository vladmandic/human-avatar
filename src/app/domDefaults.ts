import { dom } from './domElements';
import { log } from '../shared/log';
import { settings } from '../settings';
import type { Motion } from '../shared/types';

type MenuSection = 'menuSceneSettings' | 'menuProcessingOptions' | 'menuViewControls' | 'menuPersonAnalysis' | 'menuDiagnostics' | 'menuUtility'

export async function setMenuVisibility(menuSection: MenuSection, visibility: 0 | 1 | 2) {
  const el = document.getElementById(menuSection) as HTMLDivElement;
  if (!el) return;
  log('menu set visibility', { menuSection, visibility });
  if (visibility === 0) {
    el.style.display = 'none';
    el.style.visibility = 'hidden';
    el.style.height = '';
  } else if (visibility === 1) {
    el.style.display = 'block';
    el.style.visibility = 'visible';
    el.style.height = '1.4rem';
  } else if (visibility === 2) {
    el.style.display = 'block';
    el.style.visibility = 'visible';
    el.style.height = '';
  }
}

export async function setMenuVisibilityDefaults() {
  setMenuVisibility('menuSceneSettings', 2);
  setMenuVisibility('menuProcessingOptions', 1);
  setMenuVisibility('menuViewControls', 2);
  setMenuVisibility('menuPersonAnalysis', 1);
  setMenuVisibility('menuUtility', 1);
  setMenuVisibility('menuDiagnostics', 1);
  if (dom.menu) {
    dom.menu.style.width = `${settings.menu.width}px`;
    dom.menu.style.backgroundColor = settings.menu.backgroundColor;
    dom.menu.style.visibility = 'visible';
  }
}

export async function setMenuDefaults(motion: Motion) {
  if (!motion) return;
  log('menu set defaults');
  if (dom.btnAllowImages) dom.btnAllowImages.style.backgroundColor = settings.menu.allowImages ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnAllowVideos) dom.btnAllowVideos.style.backgroundColor = settings.menu.allowVideos ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnAnchors) dom.btnAnchors.style.backgroundColor = motion.options.showAnchors ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnAutoScale) dom.btnAutoScale.style.backgroundColor = motion.options.skeletonAutoScale ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnAxisTitle) dom.btnAxisTitle.style.backgroundColor = motion.options.showAxisTitle ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnBBoxGizmo) dom.btnBBoxGizmo.style.backgroundColor = motion.options.enableBBoxGizmo ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnFrustum) dom.btnFrustum.style.backgroundColor = motion.options.showFrustum ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnShowClones) dom.btnShowClones.style.backgroundColor = motion.options.showCloneCanvases ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnShowInput) dom.btnShowInput.style.backgroundColor = motion.options.showInputMedia ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnWireframeBone) dom.btnWireframeBone.style.backgroundColor = motion.options.wireframeBone ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnWireframeJoint) dom.btnWireframeJoint.style.backgroundColor = motion.options.wireframeJoint ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.interpolation && dom.interpolation.oninput) { dom.interpolation.valueAsNumber = motion.options.interpolationSteps; dom.interpolation.oninput(new Event('input')); }
  if (dom.maxPersons && dom.maxPersons.oninput) { dom.maxPersons.valueAsNumber = motion.options.maxPersons; dom.maxPersons.oninput(new Event('input')); }
  if (dom.minScore && dom.minScore.oninput) { dom.minScore.valueAsNumber = motion.options.minScore; dom.minScore.oninput(new Event('input')); }
  if (dom.scalePersonX && dom.scalePersonX.oninput) { dom.scalePersonX.valueAsNumber = motion.options.scalePerson[0]; dom.scalePersonX.oninput(new Event('input')); }
  if (dom.scalePersonY && dom.scalePersonY.oninput) { dom.scalePersonY.valueAsNumber = motion.options.scalePerson[1]; dom.scalePersonY.oninput(new Event('input')); }
  if (dom.scalePersonZ && dom.scalePersonZ.oninput) { dom.scalePersonZ.valueAsNumber = motion.options.scalePerson[2]; dom.scalePersonZ.oninput(new Event('input')); }
  if (dom.scaleSceneX && dom.scaleSceneX.oninput) { dom.scaleSceneX.valueAsNumber = motion.options.scaleScene[0]; dom.scaleSceneX.oninput(new Event('input')); }
  if (dom.scaleSceneY && dom.scaleSceneY.oninput) { dom.scaleSceneY.valueAsNumber = motion.options.scaleScene[1]; dom.scaleSceneY.oninput(new Event('input')); }
  if (dom.scaleSceneZ && dom.scaleSceneZ.oninput) { dom.scaleSceneZ.valueAsNumber = motion.options.scaleScene[2]; dom.scaleSceneZ.oninput(new Event('input')); }
  if (dom.btnRotation) dom.btnRotation.style.backgroundColor = settings.telemetry.rotation ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnVectors) dom.btnVectors.style.backgroundColor = settings.telemetry.vectors ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnTrace) dom.btnTrace.style.backgroundColor = settings.telemetry.trace ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnChart) dom.btnChart.style.backgroundColor = settings.telemetry.chart ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnLimitHighlight) dom.btnLimitHighlight.style.backgroundColor = settings.limits.highlight ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnLimitShader) dom.btnLimitShader.style.backgroundColor = settings.limits.shader ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnLimitMax) dom.btnLimitMax.style.backgroundColor = settings.limits.maximums ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnLimitTrack) dom.btnLimitTrack.style.backgroundColor = settings.limits.track ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnUpdatePosition) dom.btnUpdatePosition.style.backgroundColor = settings.person.updatePosition ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  if (dom.btnGroundEnabled) dom.btnGroundEnabled.style.backgroundColor = motion.options.groundVisibility > 0.5 ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  // diagnostics items
  if (dom.btnInpector) dom.btnInpector.style.backgroundColor = settings.menu.btnUncheckedColor;
  if (dom.btnLog) dom.btnLog.style.backgroundColor = settings.menu.btnUncheckedColor;
  if (dom.btnStatus) dom.btnStatus.style.backgroundColor = settings.menu.btnUncheckedColor;
  // @ts-ignore
  if (dom.btnCameraAutoRotate) dom.btnCameraAutoRotate.style.backgroundColor = motion.scene.activeCamera?.useAutoRotationBehavior ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
}
