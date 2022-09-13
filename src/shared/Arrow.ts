/**
 * Class that creates an instance of 3D arrow
 * No external dependencies
 */

import { Vector3, Color3, ExtrudeShapeCustom, Mesh, Plane, StandardMaterial } from '@babylonjs/core';
import type { Point, Person } from './types';

const n = 3;
const deltaAngle = 2 * Math.PI / n;
export class Arrow {
  name: string;
  person: Person;
  shape: Vector3[] = [];
  path: Vector3[] = [];
  arrow: Mesh;
  arrowRadius: number = 0.03;
  arrowHeadLength: number = 0.05;
  arrowHeadMaxSize: number = 0.05;
  arrowLength = 1;
  arrowBodyLength: number = this.arrowLength - this.arrowHeadLength;
  arrowStart: Vector3 = new Vector3(0, 0, 0);
  arrowDirection: Vector3 = new Vector3(0, 0, 0);

  constructor(name: string, person: Person, color?: string) {
    this.name = name;
    this.person = person;
    for (let i = 0; i <= n; i++) this.shape.push(new Vector3(this.arrowRadius * Math.cos(i * deltaAngle), this.arrowRadius * Math.sin(i * deltaAngle), 0));
    this.shape.push(this.shape[0]);
    this.arrowDirection.normalize();
    const arrowBodyEnd = this.arrowStart.add(this.arrowDirection.scale(this.arrowBodyLength));
    const arrowHeadEnd = arrowBodyEnd.add(this.arrowDirection.scale(this.arrowHeadLength));
    this.path.push(this.arrowStart);
    this.path.push(arrowBodyEnd);
    this.path.push(arrowBodyEnd);
    this.path.push(arrowHeadEnd);
    this.arrow = ExtrudeShapeCustom(this.name, { shape: this.shape, path: this.path, updatable: true, scaleFunction: this.scaling, sideOrientation: Mesh.DOUBLESIDE });

    const material = new StandardMaterial(`arrow:${name}:${person.name}`);
    material.alpha = 0.25;
    material.specularPower = 100;
    material.diffuseColor = Color3.FromHexString(color || '#007878');
    this.arrow.isPickable = false;
    this.arrow.material = material;
    this.arrow.parent = person.telemetryVectors;
  }

  scaling = (index: number) => {
    if (index <= 1) return 1;
    if (index === 2) return this.arrowHeadMaxSize / this.arrowRadius;
    return 0;
  };

  update = () => {
    const arrowBodyEnd = this.arrowStart.add(this.arrowDirection.scale(this.arrowBodyLength));
    const arrowHeadEnd = arrowBodyEnd.add(this.arrowDirection.scale(this.arrowHeadLength));
    this.path.length = 0;
    this.path.push(this.arrowStart);
    this.path.push(arrowBodyEnd);
    this.path.push(arrowBodyEnd);
    this.path.push(arrowHeadEnd);
    ExtrudeShapeCustom(this.name, { shape: this.shape, path: this.path, scaleFunction: this.scaling, instance: this.arrow });
  };

  updateFromCross = (pt1: Point, pt2: Point) => {
    const vec1 = new Vector3(...pt1);
    const vec2 = new Vector3(...pt2);
    this.arrowStart = Vector3.Lerp(vec1, vec2, 0.5);
    this.arrowDirection = vec1.cross(vec2);
    this.arrowDirection.normalize();
    this.arrowBodyLength = 4 * Vector3.Distance(vec1, vec2);
    this.update();
  };

  updateLine = (pt1: Point, pt2: Point) => {
    const vec1 = new Vector3(...pt1);
    const vec2 = new Vector3(...pt2);
    this.arrowStart = vec1;
    this.arrowDirection = vec2.subtract(vec1);
    this.arrowBodyLength = 4 * Vector3.Distance(vec1, vec2);
    this.update();
  };

  updateFromPlane = (pt1: Point, pt2: Point, pt3: Point) => {
    const vec1 = new Vector3(...pt1);
    const vec2 = new Vector3(...pt2);
    const vec3 = new Vector3(...pt3);
    const plane = Plane.FromPoints(vec1, vec2, vec3);
    this.arrowStart = vec1;
    this.arrowDirection = plane.normal;
    this.arrowDirection.normalize();
    this.arrowBodyLength = 0.8 * Vector3.Distance(vec1, plane.normal);
    this.update();
  };
}
