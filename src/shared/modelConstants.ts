/**
 * Model constant enums and default model adjustments
 */

import { Vector3, BoneLookController } from '@babylonjs/core';

export const SMPLKeypoints: Record<string, number> = {
  pelvis: 0,
  spine: 3,
  spine1: 6,
  spine2: 9,
  neck: 12,
  nose: 27,
  leftEye: 26,
  rightEye: 29,
  leftEar: 25,
  rightEar: 28,
  leftShoulder: 13,
  rightShoulder: 14,
  leftArm: 16,
  rightArm: 17,
  leftElbow: 18,
  rightElbow: 19,
  leftWrist: 20,
  rightWrist: 21,
  leftIndex: 22,
  rightIndex: 23,
  leftHip: 1,
  rightHip: 2,
  leftKnee: 4,
  rightKnee: 5,
  leftAnkle: 7,
  rightAnkle: 8,
  leftFoot: 10,
  rightFoot: 11,
};

export const BlazePoseKeypoints: Record<string, number> = {
  nose: 0,
  leftEyeInside: 1,
  leftEye: 2,
  leftEyeOutside: 3,
  rightEyeInside: 4,
  rightEye: 5,
  rightEyeOutside: 6,
  leftEar: 7,
  rightEar: 8,
  leftMouth: 9,
  rightMouth: 10,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftPinky: 17,
  rightPinky: 18,
  leftIndex: 19,
  rightIndex: 20,
  leftThumb: 21,
  rightThumb: 22,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFoot: 31,
  rightFoot: 32,
  pelvis: 33, // not really
  bodyTop: 34,
  leftPalm: 35,
  leftHand: 36,
  rightPalm: 37,
  rightHand: 38,
};

export const BoneLookList = {
  Hips: null,
  // 'Neck',
  Head: null,
  // 'Spine',
  // 'Spine1',
  // 'Spine2',
  LeftShoulder: 'LeftArm',
  RightShoulder: 'RightArm',
  LeftArm: 'LeftForeArm',
  RightArm: 'RightForeArm',
  LeftForeArm: 'LeftHand',
  RightForeArm: 'RightHand',
  LeftHand: null,
  // 'LeftHandIndex1',
  // 'LeftHandPinky1',
  // 'LeftHandThumb1',
  RightHand: null,
  // 'RightHandIndex1',
  // 'RightHandPinky1',
  // 'RightHandThumb1',
  LeftUpLeg: 'LeftLeg',
  RightUpLeg: 'RightLeg',
  LeftLeg: 'LeftFoot',
  RightLeg: 'RightFoot',
  LeftFoot: 'LeftToeBase',
  RightFoot: 'RightToeBase',
  // 'LeftToeBase',
  // 'RightToeBase',
};

export const BoneDisableL1 = [
  'Head',
];

export const BoneSize = {
  upperLeg: 0.35084,
  lowerLeg: 0.02175,
  upperArm: 0.14979,
};

export const BoneTelemetryList: Record<string, string> = {
  Hips: 'hips',
  Spine: 'lower spine',
  Spine1: 'center spine',
  Spine2: 'upper spine',
  Neck: 'neck',
  Head: 'head',

  LeftShoulder: 'left shoulder',
  RightShoulder: 'right shoulder',
  LeftArm: 'left upper arm',
  RightArm: 'right upper arm',
  LeftForeArm: 'left forearm',
  RightForeArm: 'right forearm',
  LeftHand: 'left hand',
  RightHand: 'right hand',
  LeftUpLeg: 'left upper leg',
  RightUpLeg: 'right upper leg',
  LeftLeg: 'left lower leg',
  RightLeg: 'right lower leg',
  LeftFoot: 'left foot',
  RightFoot: 'right foot',
};

export function adjustLookAngles(look: Record<string, BoneLookController>) {
  // look.Hips.adjustYaw = 0;
  // look.Spine.adjustYaw = -Math.PI;
  // look.Spine1.adjustYaw = -Math.PI;
  // look.Spine2.adjustYaw = -Math.PI;
  // look.Neck.adjustYaw = 0;
  // look.Head.adjustYaw = 0;

  // @ts-ignore
  window.look = look;

  for (const [key, val] of Object.entries(look)) {
    if (key.startsWith('Left')) val.upAxis = new Vector3(-1, 1, -1);
    else if (key.startsWith('Right')) val.upAxis = new Vector3(1, 1, -1);
    else val.upAxis = new Vector3(0, 1, 0);
  }

  if (look.Hips) look.Hips.upAxis = new Vector3(0, 1, 0);

  if (look.LeftUpLeg) look.LeftUpLeg.adjustPitch = -Math.PI / 2;
  if (look.LeftUpLeg) look.LeftUpLeg.adjustRoll = 0;
  if (look.RightUpLeg) look.RightUpLeg.adjustPitch = -Math.PI / 2;
  if (look.RightUpLeg) look.RightUpLeg.adjustRoll = 0;

  if (look.LeftLeg) look.LeftLeg.adjustPitch = -Math.PI / 2;
  if (look.RightLeg) look.RightLeg.adjustPitch = -Math.PI / 2;

  if (look.LeftFoot) look.LeftFoot.adjustPitch = -0.25; // offset due to difference in heel vs ankle
  if (look.LeftFoot) look.LeftFoot.adjustRoll = Math.PI / 4;
  if (look.RightFoot) look.RightFoot.adjustPitch = -0.25;
  if (look.RightFoot) look.RightFoot.adjustRoll = -Math.PI / 4;

  if (look.LeftShoulder) look.LeftShoulder.adjustYaw = Math.PI / 2;
  if (look.RightShoulder) look.RightShoulder.adjustYaw = -Math.PI / 2;

  if (look.LeftArm) look.LeftArm.adjustYaw = Math.PI / 2;
  if (look.RightArm) look.RightArm.adjustYaw = -Math.PI / 2;

  if (look.LeftForeArm) look.LeftForeArm.adjustYaw = Math.PI / 2;
  if (look.RightForeArm) look.RightForeArm.adjustYaw = -Math.PI / 2;

  if (look.LeftHand) look.LeftHand.adjustYaw = Math.PI / 2;
  if (look.RightHand) look.RightHand.adjustYaw = -Math.PI / 2;

  if (look.LeftHand) look.LeftHand.adjustPitch = -Math.PI / 2;
  if (look.RightHand) look.RightHand.adjustPitch = -Math.PI / 2;
}
