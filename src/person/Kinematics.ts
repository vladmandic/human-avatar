/**
 * Class that creates an instance of kinematics calculations
 * Subclass of Person
 * No external dependencies
 */

import { Vector3, Bone, Space, Mesh, Plane } from '@babylonjs/core';
import { SMPLKeypoints, BlazePoseKeypoints } from '../shared/modelConstants';
import { calcMiddle } from '../shared/mathCalculations';
import type { Person, Point } from '../shared/types';

export class Kinematics {
  model: typeof SMPLKeypoints | typeof BlazePoseKeypoints;
  person: Person;
  position: Record<string, Point> = {};
  bone: Record<string, Bone> = {};
  anchor: Record<string, Mesh> = {};
  origin: Record<string, Mesh> = {};

  constructor(person: Person) {
    this.model = SMPLKeypoints;
    this.person = person;
  }

  update() {
    if (!this.person.skeleton) return;
    for (const bone of this.person.skeleton.bones) this.bone[bone.name] = bone;
    for (const mesh of this.person.anchors.getChildMeshes()) this.anchor[mesh.name] = mesh as Mesh;
    for (const mesh of this.person.positions.getChildMeshes()) this.origin[mesh.name] = mesh as Mesh;
  }

  setModelType(model: 'SMPLKeypoints' | 'BlazePoseKeypoints') {
    if (model === 'BlazePoseKeypoints') this.model = BlazePoseKeypoints;
    if (model === 'SMPLKeypoints') this.model = SMPLKeypoints;
  }

  setTarget = (name: string, kpts: Point[], idx: number) => {
    if (!kpts[idx]) return;
    if (!this.anchor[name] || !this.person.lookControllers[name]) return;
    const position = new Vector3(kpts[idx][0], kpts[idx][1], kpts[idx][2]);
    const offset = Vector3.Distance(position, this.anchor[name].absolutePosition);
    if (offset < 0.001) return;
    this.anchor[name].setPositionWithLocalVector(new Vector3(kpts[idx][0], kpts[idx][1], kpts[idx][2]));
    // @ts-ignore custom property
    this.anchor[name].keypointId = idx;
    this.person.lookControllers[name].target = this.anchor[name].absolutePosition;
  };

  setOrigin = (name: string, kpt: Point) => {
    if (!kpt) return;
    if (!this.bone[name] || !this.origin[name]) return;
    const position = new Vector3(kpt[0], kpt[1], kpt[2]);
    const offset = Vector3.Distance(position, this.bone[name].getAbsolutePosition());
    if (offset < 0.001) return;
    this.origin[name].setPositionWithLocalVector(position);
    this.bone[name].setPosition(position, Space.BONE);
    this.bone[name].computeAbsoluteTransforms();
  };

  setRootPositions = (): number => {
    const kpts = this.person.normalized;
    const scaleScene = this.person.motion.options.scaleScene;
    if (this.person.options.updatePosition) {
      const center = [kpts[kpts.length - 1][0] * scaleScene[0], kpts[kpts.length - 1][1] * scaleScene[1], kpts[kpts.length - 1][2] * scaleScene[2]];
      this.person.rootNode.setAbsolutePosition(new Vector3(center[0], center[1], center[2]));
    }

    this.position.MidShoulder = calcMiddle(kpts[this.model.leftShoulder], kpts[this.model.rightShoulder]);
    if (this.model === BlazePoseKeypoints) {
      this.position.Pelvis = calcMiddle(kpts[this.model.leftHip], kpts[this.model.rightHip]);
      this.position.Spine = calcMiddle(this.position.Pelvis, this.position.MidShoulder, 2, 1); // lower
      this.position.Spine1 = calcMiddle(this.position.Pelvis, this.position.MidShoulder, 1, 1); // slightly below center
      this.position.Spine2 = calcMiddle(this.position.Pelvis, this.position.MidShoulder, 1, 2); // higher
      this.position.Head = [this.position.MidShoulder[0], this.position.MidShoulder[1] * 1.3, kpts[this.model.nose][2] / 4];
      this.position.Neck = calcMiddle(this.position.MidShoulder, this.position.Head);
    } else {
      this.position.MidHip = calcMiddle(kpts[this.model.leftHip], kpts[this.model.rightHip]);
      this.position.Pelvis = kpts[this.model.pelvis];
      this.position.Spine = kpts[this.model.spine];
      this.position.Spine1 = kpts[this.model.spine1];
      this.position.Spine2 = kpts[this.model.spine2];
      this.position.Head = calcMiddle(kpts[this.model.neck], calcMiddle(kpts[this.model.leftEar], kpts[this.model.rightEar]));
      this.position.Neck = kpts[this.model.neck];
    }
    this.setOrigin('Hips', this.position.Pelvis);
    if (this.bone.Hips) this.person.position.position = this.bone.Hips.position;
    if (this.person.motion.options.ikLevel < 1) {
      this.setOrigin('Spine', this.position.Spine); // TBD
      this.setOrigin('Spine1', this.position.Spine1); // TBD
      this.setOrigin('Spine2', this.position.Spine2); // TBD
      this.setOrigin('Neck', [this.position.Neck[0], this.position.Neck[1] - 0.05, this.position.Neck[2]]);
      this.setOrigin('Head', this.position.Head);
    }
    this.setOrigin('LeftShoulder', calcMiddle(this.position.MidShoulder, kpts[this.model.leftShoulder], 2, 1)); // shoulders are better being a bit more narrower than detected
    this.setOrigin('RightShoulder', calcMiddle(this.position.MidShoulder, kpts[this.model.rightShoulder], 2, 1)); // shoulders are better being a bit more narrower than detected
    this.setOrigin('LeftArm', kpts[this.model.leftShoulder]); // disconnect arm from shoulder
    this.setOrigin('RightArm', kpts[this.model.rightShoulder]); // disconnect arm from shoulder
    this.setOrigin('LeftUpLeg', kpts[this.model.leftHip]); // disconnect leg from shoulder
    this.setOrigin('RightUpLeg', kpts[this.model.rightHip]); // disconnect leg from shoulder

    // calculate position error
    const error = (this.origin.Head && this.bone.Head) ? Vector3.Distance(this.origin.Head.position, this.bone.Head.getAbsolutePosition()) : 0;
    return error;
  };

  setOrientation = () => {
    const kpts = this.person.normalized;
    const flipLeftLeg = (kpts[this.model.leftHip][2] - kpts[this.model.leftKnee][2]) > 0;
    this.person.lookControllers.LeftUpLeg.adjustPitch = flipLeftLeg ? -Math.PI / 2 : +Math.PI / 2;
    this.person.lookControllers.LeftUpLeg.adjustRoll = flipLeftLeg ? 0 : Math.PI;

    const flipRightLeg = kpts[this.model.rightHip][2] - kpts[this.model.rightKnee][2] > 0;
    this.person.lookControllers.RightUpLeg.adjustPitch = flipRightLeg ? -Math.PI / 2 : +Math.PI / 2;
    this.person.lookControllers.RightUpLeg.adjustRoll = flipRightLeg ? 0 : Math.PI;
  };

  setHips = (anchorName: string, pt1: Point, pt2: Point, pt3: Point) => {
    if (!pt1 || !pt2 || !pt3) return;
    const vec1 = new Vector3(...pt1);
    const vec2 = new Vector3(...pt2);
    const vec3 = new Vector3(...pt3);
    const plane = Plane.FromPoints(vec1, vec2, vec3);
    if (this.anchor[anchorName]) this.anchor[anchorName].setPositionWithLocalVector(plane.normal);
    if (this.person.lookControllers[anchorName]) {
      this.person.lookControllers[anchorName].target = this.anchor[anchorName].absolutePosition;
      this.person.lookControllers[anchorName].adjustRoll = -Math.atan2(Math.abs(pt2[0] - pt1[0]), Math.abs(pt2[1] - pt1[1])) + Math.PI / 2;
    }
  };

  setLookTargets = () => {
    const kpts = this.person.normalized;
    if (this.person.motion.options.ikLevel < 1) this.setTarget('Head', kpts, this.model.nose);
    this.setTarget('LeftShoulder', kpts, this.model.leftShoulder);
    this.setTarget('LeftArm', kpts, this.model.leftElbow);
    this.setTarget('LeftForeArm', kpts, this.model.leftWrist);
    this.setTarget('LeftHand', kpts, this.model.leftIndex);
    this.setTarget('LeftUpLeg', kpts, this.model.leftKnee);
    this.setTarget('LeftLeg', kpts, this.model.leftAnkle);
    this.setTarget('LeftFoot', kpts, this.model.leftFoot);
    this.setTarget('RightShoulder', kpts, this.model.rightShoulder);
    this.setTarget('RightArm', kpts, this.model.rightElbow);
    this.setTarget('RightForeArm', kpts, this.model.rightWrist);
    this.setTarget('RightHand', kpts, this.model.rightIndex);
    this.setTarget('RightUpLeg', kpts, this.model.rightKnee);
    this.setTarget('RightLeg', kpts, this.model.rightAnkle);
    this.setTarget('RightFoot', kpts, this.model.rightFoot);
    this.setHips('Hips', kpts[this.model.leftHip], kpts[this.model.rightHip], kpts[this.model.pelvis]); // set hips as vector cross-product which is perpendicular
  };

  setLimbRotation = () => {
    const kpts = this.person.normalized;
    const facingForward = Math.sign(kpts[this.model.leftHip][0] - kpts[this.model.rightHip][0]);
    for (const [key, val] of Object.entries(this.person.lookControllers)) {
      if (key.startsWith('Left')) val.upAxis = new Vector3(-facingForward, 1, -facingForward);
      else if (key.startsWith('Right')) val.upAxis = new Vector3(facingForward, 1, -facingForward);
      else if (key !== 'Hips') val.upAxis = new Vector3(0, 1, 0);
    }
    if (this.person.lookControllers.LeftShoulder) this.person.lookControllers.LeftShoulder.upAxis = new Vector3(facingForward, 1, -facingForward);
    if (this.person.lookControllers.RightShoulder) this.person.lookControllers.RightShoulder.upAxis = new Vector3(-facingForward, 1, -facingForward);
    if (this.person.lookControllers.LeftHand) this.person.lookControllers.LeftHand.upAxis = new Vector3(0, 0, facingForward);
    if (this.person.lookControllers.RightHand) this.person.lookControllers.RightHand.upAxis = new Vector3(0, 0, -facingForward);
  };

  setFist = (side: 'Left' | 'Right', angle: number) => {
    if (this.bone[`${side}HandIndex1`]) this.bone[`${side}HandIndex1`].rotation = new Vector3(0, 0, angle);
    if (this.bone[`${side}HandIndex2`]) this.bone[`${side}HandIndex2`].rotation = new Vector3(0, 0, angle);
    if (this.bone[`${side}HandIndex3`]) this.bone[`${side}HandIndex3`].rotation = new Vector3(0, 0, angle);
    if (this.bone[`${side}HandMiddle1`]) this.bone[`${side}HandMiddle1`].rotation = new Vector3(0, 0, angle);
    if (this.bone[`${side}HandMiddle2`]) this.bone[`${side}HandMiddle2`].rotation = new Vector3(0, 0, angle);
    if (this.bone[`${side}HandMiddle3`]) this.bone[`${side}HandMiddle3`].rotation = new Vector3(0, 0, angle);
    if (this.bone[`${side}HandPinky1`]) this.bone[`${side}HandPinky1`].rotation = new Vector3(0, 0, angle);
    if (this.bone[`${side}HandPinky2`]) this.bone[`${side}HandPinky2`].rotation = new Vector3(0, 0, angle);
    if (this.bone[`${side}HandPinky3`]) this.bone[`${side}HandPinky3`].rotation = new Vector3(0, 0, angle);
    if (this.bone[`${side}HandRing1`]) this.bone[`${side}HandRing1`].rotation = new Vector3(0, 0, angle);
    if (this.bone[`${side}HandRing2`]) this.bone[`${side}HandRing2`].rotation = new Vector3(0, 0, angle);
    if (this.bone[`${side}HandRing3`]) this.bone[`${side}HandRing3`].rotation = new Vector3(0, 0, angle);
    // this.bone[`${side}HandThumb1`].rotation = new Vector3(0, side === 'Left' ? -0.5 : 0.5, 0);
    // this.bone[`${side}HandThumb2`].rotation = new Vector3(0, 0, angle);
    // this.bone[`${side}HandThumb3`].rotation = new Vector3(0, 0, -angle);
  };

  manualCorrections = () => {
    const kpts = this.person.normalized;
    if (this.bone.LeftToeBase) this.bone.LeftToeBase.rotation = new Vector3(-this.bone.LeftFoot.rotation.x, 0, 0); // bend toes opposite of foot so they "touch" the ground
    if (this.bone.RightToeBase) this.bone.RightToeBase.rotation = new Vector3(-this.bone.RightFoot.rotation.x, 0, 0);
    if (this.person.motion.options.ikLevel < 1) {
      const l1 = Vector3.Distance(new Vector3(...kpts[this.model.leftElbow]), new Vector3(...kpts[this.model.leftWrist]));
      const l2 = Vector3.Distance(new Vector3(...kpts[this.model.leftIndex]), new Vector3(...kpts[this.model.leftWrist]));
      const r1 = Vector3.Distance(new Vector3(...kpts[this.model.rightElbow]), new Vector3(...kpts[this.model.rightWrist]));
      const r2 = Vector3.Distance(new Vector3(...kpts[this.model.rightIndex]), new Vector3(...kpts[this.model.rightWrist]));
      if (this.bone.LeftHand) this.setFist('Left', Math.PI * (1 - 3 * l2 / l1));
      if (this.bone.RightHand) this.setFist('Right', -Math.PI * (1 - 3 * r2 / r1));
    }
  };
}
