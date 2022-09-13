/**
 * Class of skeleton frame
 */

import { Scene, Mesh, Vector3, Color3, AbstractMesh, StandardMaterial, MeshBuilder } from '@babylonjs/core';
import { settings } from '../settings';
import type { Point, Motion } from '../shared/types';

export class Frame {
  name: string;
  rootNode: AbstractMesh;
  motion: Motion;
  scene: Scene;
  meshes: Record<string, Mesh> = {};
  material: StandardMaterial;
  private pose: Point[] = [];
  private edges: [number, number][] = [];
  private joints: string[] = [];
  boneScale: number = 200;
  jointScale: number = 200;
  shouldUpdate: boolean = false; // true if ik needs to update person

  constructor(name: string, motion: Motion) {
    this.name = name;
    this.motion = motion;
    this.scene = motion.scene;
    this.rootNode = new AbstractMesh(`wireframe:${name}`, this.scene);
    this.material = new StandardMaterial('materialTube', this.scene);
    this.material.diffuseColor = Color3.FromHexString(settings.theme.tubesColor);
    this.material.useSpecularOverAlpha = true;
    // this.scene.registerBeforeRender(() => this.beforeRender());
  }

  beforeRender = () => {
    if (!this.shouldUpdate || !this.rootNode.isEnabled()) return;
    for (let i = 0; i < this.edges.length; i++) {
      const pt0 = new Vector3(...this.pose[this.edges[i][0]]);
      const pt1 = new Vector3(...this.pose[this.edges[i][1]]);
      this.drawBone(this.joints[i], pt0, pt1);
    }
    this.shouldUpdate = false;
  };

  drawBone = (part: string, pt0: Vector3, pt1: Vector3) => {
    const path = [pt0, pt1];
    const distance = Vector3.Distance(pt0, pt1); // edge length
    const depth = Math.min(Math.sqrt(Math.abs(1 / (pt0.z + 0.5))), 2); // z-distance of a point
    const radius = depth * (distance + 0.1) / 20 * this.boneScale / 100;
    const diameter = depth * (distance + 0.1) / 20 * this.jointScale / 100 * 2;
    if (!this.meshes[part] || this.meshes[part].isDisposed()) { // body part seen for the first time
      this.meshes[part] = MeshBuilder.CreateTube(part, { path, radius, updatable: true, cap: 3, sideOrientation: Mesh.DOUBLESIDE }, this.scene);
      this.meshes[part].material = this.material;
      this.meshes[part].parent = this.rootNode;
      this.meshes[part + 'start'] = MeshBuilder.CreateSphere(part + 'start', { diameter }, this.scene); // rounded edge for bone start
      this.meshes[part + 'start'].material = this.material;
      this.meshes[part + 'start'].parent = this.rootNode;
      this.meshes[part + 'start'].position = pt0; // update head position
      this.meshes[part + 'end'] = MeshBuilder.CreateSphere(part + 'end', { diameter }, this.scene); // rounded edge for bone end
      this.meshes[part + 'end'].material = this.material;
      this.meshes[part + 'end'].parent = this.rootNode;
      this.meshes[part + 'end'].position = pt1; // update head position
    } else { // updating existing body part
      this.meshes[part + 'start'].position = pt0; // update rounded edge position
      this.meshes[part + 'end'].position = pt1; // update rounded edge position
      this.meshes[part] = MeshBuilder.CreateTube(part, { path, radius, updatable: true, cap: 3, sideOrientation: Mesh.DOUBLESIDE, instance: this.meshes[part] }, this.scene); // update existing tube
    }
  };

  updateRawDetection(poses: Point[], edges: [number, number][], joints: string[]) {
    this.pose = poses;
    this.edges = edges;
    this.joints = joints;
    this.shouldUpdate = true;
    this.motion.shouldUpdate = true;
  }
}
