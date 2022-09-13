/**
 * Pure Methods that work only with scene
 * Split to maintain scene class file manageable
 */

import { PointerInfo, PointerEventTypes, Mesh, Vector3, ArcRotateCamera, BoundingBoxGizmo, Color3 } from '@babylonjs/core';
import type { Motion } from '../shared/types';
import { targetCamera } from './cameraControls';

let motion: Motion;

function pointerDown(pointerInfo: PointerInfo) {
  if (!motion.scene.activeCameras) return;
  for (let i = 0; i < motion.cameras.length; i++) {
    const viewport = motion.cameras[i].viewport;
    const box = [viewport.x * (motion.canvas?.width || 1), viewport.y * (motion.canvas?.height || 1), (viewport.x + viewport.width) * (motion.canvas?.width || 1), (viewport.y + viewport.height) * (motion.canvas?.height || 1)];
    const xy = [pointerInfo.event.x, (motion.canvas?.height || 0) - pointerInfo.event.y];
    if ((xy[0] >= box[0]) && (xy[1] >= box[1]) && (xy[0] <= box[2]) && (xy[1] <= box[3])) {
      motion.scene.activeCamera = motion.cameras[i];
      for (const camera of motion.cameras) camera.detachControl();
      motion.scene.activeCamera.attachControl(motion.canvas);
      motion.scene.activeCameras = [motion.scene.activeCamera];
    }
  }
  const pickInfo = motion.scene.pick(motion.scene.pointerX, motion.scene.pointerY, undefined, false, motion.scene.activeCamera);
  if (pickInfo?.pickedMesh) {
    for (const camera of motion.cameras) camera.detachControl();
    motion.pickedMesh = pickInfo.pickedMesh as Mesh;
    motion.pickedPosition = pickInfo.pickedPoint;
    if (pickInfo.pickedMesh.parent) motion.pickedPerson = motion.persons[pickInfo.pickedMesh.parent.id];
    if (!motion.pickedPerson && pickInfo.pickedMesh.parent?.parent) motion.pickedPerson = motion.persons[pickInfo.pickedMesh.parent.parent!.id];
    if (motion.pickedPerson) {
      if (pointerInfo.event.buttons === 2) { // right click
      } else {
        if (motion.gizmo) motion.gizmo.dispose();
        if (motion.options.enableBBoxGizmo) {
          motion.gizmo = new BoundingBoxGizmo(Color3.FromHexString('#AAFFFF'));
          motion.gizmo.attachedMesh = motion.pickedPerson.rootNode;
        }
      }
    }
    if (pointerInfo.event.buttons !== 2 && motion.pickedPerson && (motion.pickedMesh.name === 'center')) motion.pickedPerson.detached = true;
  } else {
    if (motion.gizmo) motion.gizmo.dispose();
  }
  if (pointerInfo.event.buttons === 2) { // right click
    if (motion.pickedPerson) motion.pickedPerson.menu.show();
  }
}

function pointerUp() {
  const cam = motion.scene.activeCamera as ArcRotateCamera;
  cam.attachControl(motion.canvas);
  if (motion.pickedPerson && motion.pickedMesh && (motion.pickedMesh.name === 'center')) motion.pickedPerson.detached = false;
  motion.pickedMesh = null;
  motion.pickedPosition = null;
  motion.pickedPerson = null;
}

function pointerMove(pointerInfo: PointerInfo) {
  if (!motion.pickedPosition || !motion.pickedMesh) return;
  const pickInfo = motion.scene.pick(motion.scene.pointerX, motion.scene.pointerY, undefined, false, motion.scene.activeCamera);
  if (!pickInfo || !pickInfo.pickedPoint || !motion.pickedPerson) return;
  const cam = motion.scene.activeCamera as ArcRotateCamera;
  const positionDifference = pickInfo?.pickedPoint.subtract(motion.pickedPosition);
  const xAxis = Math.abs(cam.position.x / cam.radius) < 0.5 ? 1 : 0; // limit axis movement freedom depending on camera angle
  const yAxis = Math.abs(cam.position.y / cam.radius) < 0.5 ? 1 : 0;
  const zAxis = Math.abs(cam.position.z / cam.radius) < 0.5 ? 1 : 0;
  const normDifference = positionDifference.multiply(new Vector3(xAxis, yAxis, zAxis));
  if (pointerInfo.event.buttons === 1) { // left click
    if (!motion.pickedPerson.detached) {
      // motion.pickedMesh.position.addInPlace(normDifference); // move whatever is picked // update done since keypoints are updated during normalization with offsets
      // @ts-ignore custom property
      const kpt = motion.pickedMesh.keypointId;
      if (kpt && (kpt > -1)) {
        motion.pickedPerson.normalizedOffsets[kpt] = [
          motion.pickedPerson.normalizedOffsets[kpt][0] + normDifference.x,
          motion.pickedPerson.normalizedOffsets[kpt][1] + normDifference.y,
          motion.pickedPerson.normalizedOffsets[kpt][2] + normDifference.z,
        ];
      } else {
        motion.pickedMesh.position.addInPlace(normDifference); // unknown kpt, but still do the move
      }
    } else { // move entire skeleton
      motion.pickedPerson.shouldUpdate = false;
      // motion.pickedPerson.rootNode.position.addInPlace(normDifference); // update done since keypoints are updated during normalization with offsets
      motion.pickedPerson.offsets = [motion.pickedPerson.offsets[0] + normDifference.x, motion.pickedPerson.offsets[1] + normDifference.y, motion.pickedPerson.offsets[2] + normDifference.z];
    }
    motion.pickedPosition = pickInfo.pickedPoint;
    motion.pickedPerson.shouldUpdate = true;
  } else if (pointerInfo.event.buttons === 2) { // right click
    //
  }
  // Object.values(motion.persons).forEach((person) => { person.shouldUpdate = true; });
}

function pointerDoubleTap() {
  const cam = motion.scene.activeCamera as ArcRotateCamera;
  if (motion.pickedPerson) {
    motion.pickedPerson.menu.show();
  } else if (motion.pickedPosition) {
    targetCamera(cam, motion.pickedPosition.x, motion.pickedPosition.y, motion.pickedPosition.z);
  } else {
    motion.center();
  }
}

function pointerWheel(pointerInfo: PointerInfo) {
  if (motion.pickedPerson) {
    const delta = (pointerInfo.event as WheelEvent).deltaY / 180 / Math.PI / 2;
    const current = motion.pickedPerson.rootNode.rotation.y;
    motion.pickedPerson.rootNode.rotation = new Vector3(0, current + delta, 0);
    pointerInfo.event.preventDefault();
  }
}

export function attachPointerControls(t: Motion) {
  motion = t;
  motion.scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
      case PointerEventTypes.POINTERDOWN: pointerDown(pointerInfo); break;
      case PointerEventTypes.POINTERDOUBLETAP: pointerDoubleTap(); break;
      case PointerEventTypes.POINTERUP: pointerUp(); break;
      case PointerEventTypes.POINTERMOVE: pointerMove(pointerInfo); break;
      case PointerEventTypes.POINTERWHEEL: pointerWheel(pointerInfo); break;
      default: break;
    }
  });
}
