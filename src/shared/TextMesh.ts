/**
 * Class that creates vertex mesh from a vector font
 */

import { Scene, Mesh, VertexData, StandardMaterial, Vector3, InstancedMesh, AbstractMesh, MeshBuilder, Color3 } from '@babylonjs/core';
import earcut from 'earcut';
import * as opentype from 'opentype.js';
import { settings } from '../settings';
import { log } from './log';

const bezierMaxSteps = 10;
const bezierStepSize = 20.0;
const glypthCoordsScale = 0.001;

type Point = { x: number, y: number };

let scene: Scene;

// eslint-disable-next-line no-use-before-define
let defaultFont: TextMeshFont;
export const getDefaultFont = () => defaultFont;
// eslint-disable-next-line no-use-before-define
export const setDefaultFont = (font: TextMeshFont) => { defaultFont = font; };

let defaultFontMaterial: StandardMaterial;
export const getDefaultFontMaterial = () => defaultFontMaterial;
export const setDefaultFontMaterial = (material: StandardMaterial) => {
  defaultFontMaterial = material;
  defaultFontMaterial.diffuseColor = Color3.FromHexString(settings.theme.defaultTextColor);
};

// eslint-disable-next-line no-use-before-define
// let defaultFont: TextMeshFont;
export class TextMeshPolygon { // class for converting path commands into point data
  points: Point[] = [];
  // eslint-disable-next-line no-use-before-define
  children: TextMeshPolygon[] = [];
  area = 0.0;

  sqr = (n: number) => n * n;
  distance = (p1: Point, p2: Point) => Math.sqrt(this.sqr(p1.x - p2.x) + this.sqr(p1.y - p2.y));
  lerp = (p1: Point, p2: Point, t: number) => ({ x: (1 - t) * p1.x + t * p2.x, y: (1 - t) * p1.y + t * p2.y });
  cross = (p1: Point, p2: Point) => p1.x * p2.y - p1.y * p2.x;
  moveTo = (p: Point) => this.points.push(p);
  lineTo = (p: Point) => this.points.push(p);

  close = () => {
    let cur = this.points[this.points.length - 1];
    this.points.forEach((next) => {
      this.area += 0.5 * this.cross(cur, next);
      cur = next;
    });
  };

  conicTo = (p: Point, p1: Point) => {
    const p0 = this.points[this.points.length - 1];
    const dist = this.distance(p0, p1) + this.distance(p1, p);
    const steps = Math.max(2, Math.min(bezierMaxSteps, dist / bezierStepSize));
    for (let i = 1; i <= steps; ++i) {
      const t = i / steps;
      this.points.push(this.lerp(this.lerp(p0, p1, t), this.lerp(p1, p, t), t));
    }
  };

  cubicTo(p: Point, p1: Point, p2: Point) {
    const p0 = this.points[this.points.length - 1];
    const dist = this.distance(p0, p1) + this.distance(p1, p2) + this.distance(p2, p);
    const steps = Math.max(2, Math.min(bezierMaxSteps, dist / bezierStepSize));
    for (let i = 1; i <= steps; ++i) {
      const t = i / steps;
      this.points.push(this.lerp(this.lerp(this.lerp(p0, p1, t), this.lerp(p1, p2, t), t), this.lerp(this.lerp(p1, p2, t), this.lerp(p2, p, t), t), t));
    }
  }

  inside(p: Point) {
    const epsilon = 1e-6;
    let count = 0;
    let cur = this.points[this.points.length - 1];
    this.points.forEach((next) => {
      const p0 = (cur.y < next.y ? cur : next);
      const p1 = (cur.y < next.y ? next : cur);
      if (p0.y < p.y + epsilon && p1.y > p.y + epsilon && ((p1.x - p0.x) * (p.y - p0.y) > (p.x - p0.x) * (p1.y - p0.y))) count++;
      cur = next;
    });
    return (count % 2) !== 0;
  }
}

export class TextMeshFont {
  material: StandardMaterial;
  glyphsParent!: Mesh;
  font!: opentype.Font;
  fontUrl: string;
  root: AbstractMesh;
  glyphs: Record<string, { index: number, advanceWidth: number, mesh?: Mesh }>;

  constructor(fontUrl: string, material: StandardMaterial) {
    this.material = material;
    this.glyphs = {};
    this.fontUrl = fontUrl;
    this.root = new AbstractMesh('text', scene);
  }

  async loadFont() {
    const font = await opentype.load(this.fontUrl);
    if (!font) {
      // eslint-disable-next-line no-console
      log('font loading error:', this.fontUrl);
    } else {
      this.font = font;
      this.glyphsParent = new Mesh(`font:${font?.names?.fontFamily?.en || 'TextMeshFont'}`, scene);
      this.glyphsParent.parent = this.root;
      log('font loaded:', { ulr: this.fontUrl, ...font.names });
    }
  }

  createGlyph(ch: string) {
    if (!this.font) return null;
    const glyph = this.font.charToGlyph(ch);
    if (glyph && glyph.advanceWidth) {
      this.glyphs[ch] = {
        index: glyph.index,
        advanceWidth: glyph.advanceWidth,
      };
      if (glyph.path && (glyph.path as opentype.Path).commands && (glyph.path as opentype.Path).commands.length) {
        const polys: TextMeshPolygon[] = [];
        (glyph.path as opentype.Path).commands.forEach((command) => {
          switch (command.type) {
            case 'M':
              polys.push(new TextMeshPolygon());
              polys[polys.length - 1].moveTo({ x: command.x, y: command.y });
              break;
            case 'L':
              polys[polys.length - 1].moveTo({ x: command.x, y: command.y });
              break;
            case 'C':
              polys[polys.length - 1].cubicTo({ x: command.x, y: command.y }, { x: command.x1, y: command.y1 }, { x: command.x2, y: command.y2 });
              break;
            case 'Q':
              polys[polys.length - 1].conicTo({ x: command.x, y: command.y }, { x: command.x1, y: command.y1 });
              break;
            case 'Z':
              polys[polys.length - 1].close();
              break;
            default:
          }
        });
        polys.sort((a, b) => Math.abs(b.area) - Math.abs(a.area)); // sort contours by descending area
        const root: TextMeshPolygon[] = [];
        for (let i = 0; i < polys.length; ++i) { // classify contours to find holes and their 'parents'
          let parent: TextMeshPolygon | null = null;
          for (let j = i - 1; j >= 0; --j) {
            if (polys[j].inside(polys[i].points[0]) && polys[i].area * polys[j].area < 0) { // a contour is a hole if it is inside its parent and has different winding
              parent = polys[j];
              break;
            }
          }
          if (parent) parent.children.push(polys[i]);
          else root.push(polys[i]);
        }
        const totalPoints = polys.reduce((sum, p) => sum + p.points.length, 0);
        const vertexData = new Float32Array(totalPoints * 2);
        let vertexCount = 0;
        const indices: number[] = [];

        // eslint-disable-next-line no-inner-declarations
        function process(poly: TextMeshPolygon) {
          const coords: number[] = []; // construct input for earcut
          const holes: number[] = [];
          poly.points.forEach(({ x, y }) => coords.push(x, y));
          poly.children.forEach((child) => {
            child.children.forEach(process); // children's children are new, separate shapes
            holes.push(coords.length / 2);
            child.points.forEach(({ x, y }) => coords.push(x, y));
          });
          vertexData.set(coords, vertexCount * 2); // add vertex data
          earcut(coords, holes).forEach((i) => indices.push(i + vertexCount)); // add index data
          vertexCount += coords.length / 2;
        }

        root.forEach(process);
        const meshdata = new VertexData();
        const vertices: number[] = [];
        const normals: number[] = [];
        for (let i = 0; i < vertexCount; i++) {
          vertices.push(vertexData[i * 2 + 0] * glypthCoordsScale, vertexData[i * 2 + 1] * glypthCoordsScale, 0);
          normals.push(0, 0, -1);
        }
        meshdata.positions = vertices;
        meshdata.indices = indices;
        meshdata.normals = normals;
        this.glyphs[ch].mesh = new Mesh(`glyph#${this.glyphs[ch].index}:${ch}`, scene);
        this.glyphs[ch].mesh!.setParent(this.glyphsParent);
        meshdata.applyToMesh(this.glyphs[ch].mesh!);
        if (this.material) this.glyphs[ch].mesh!.material = this.material;
        this.glyphs[ch].mesh!.setEnabled(false);
      }
    }
    return this.glyphs[ch];
  }

  dispose() {
    for (const i in this.glyphs) {
      if (this.glyphs[i].mesh) this.glyphs[i].mesh!.dispose();
    }
    this.glyphsParent.dispose();
  }
}

export class TextMesh {
  scene: Scene;
  textMeshFont: TextMeshFont;
  text: string;
  width: number = 0;
  height: number = 0;
  lines: number = 0;
  instances: Record<string, InstancedMesh[]>;
  rootNode: Mesh;
  box?: Mesh;

  constructor(text: string, inScene: Scene, textMeshFont?: TextMeshFont, backgroundColor?: Color3) {
    this.scene = inScene;
    this.textMeshFont = textMeshFont || defaultFont;
    this.text = text;
    this.instances = {};
    this.rootNode = new Mesh('text:' + text.substring(0, 24), scene);
    this.rootNode.parent = this.textMeshFont.root;
    if (backgroundColor) this.createBox(backgroundColor);
    this.updateText(text);
  }

  createBox(backgroundColor?: Color3) {
    if (!backgroundColor) return;
    // const faceColors = [backgroundColor, backgroundColor];
    this.box = MeshBuilder.CreateBox('box', { width: 1, height: 1, depth: 1, updatable: true });
    this.box.hasVertexAlpha = true;
    const material = new StandardMaterial('textbox', scene);
    material.alpha = 0.5;
    if (backgroundColor) material.diffuseColor = backgroundColor;
    this.box.material = material;
    this.box.parent = this.rootNode;
  }

  updateText(text: string) {
    const instanceCounts: Record<string, number> = {};
    const pos = { x: 0, y: 0, z: 0 };
    this.width = 0;
    this.lines = 1;
    for (let i = 0; i < text.length; i++) {
      const ch1 = text[i];
      if (ch1 === '\n') {
        pos.x = 0;
        pos.y -= this.height;
        this.lines++;
      } else {
        const ch2 = text[i + 1];
        let g = this.textMeshFont.glyphs[ch1];
        // @ts-ignore null check is done later
        if (!g) g = this.textMeshFont.createGlyph(ch1);
        if (g) {
          if (g.mesh) {
            const bbox = g.mesh?.getBoundingInfo().boundingBox;
            if (bbox.maximum.y > this.height) this.height = 2 * bbox.maximum.y;
            instanceCounts[ch1] = (instanceCounts[ch1] || 0) + 1;
            let inst;
            if (!this.instances[ch1]) {
              inst = g.mesh.createInstance(`glyph:${ch1}`);
              this.instances[ch1] = [inst];
            } else if (instanceCounts[ch1] > this.instances[ch1].length) {
              inst = g.mesh.createInstance(`glyph:${ch1}`);
              this.instances[ch1].push(inst);
            } else {
              inst = this.instances[ch1][instanceCounts[ch1] - 1];
              inst.setEnabled(true);
            }
            inst.setParent(this.rootNode);
            inst.position = new Vector3(pos.x, pos.y, pos.z);
            inst.scaling = new Vector3(1, 1, 1);
          }
          let advance = g.advanceWidth;
          if (advance) {
            if (ch2 && this.textMeshFont.glyphs[ch2]) {
              const kern = this.textMeshFont.font.getKerningValue(g.index, this.textMeshFont.glyphs[ch2].index);
              if (kern) advance += kern;
            }
            pos.x += advance * glypthCoordsScale;
            if (pos.x > this.width) this.width = pos.x;
          }
        }
      }
    }

    for (const ch in this.instances) {
      const start = instanceCounts[ch] ? instanceCounts[ch] : 0;
      for (let i = start; i < this.instances[ch].length; i++) this.instances[ch][i].setEnabled(false);
    }

    if (this.box) {
      this.box.scaling = new Vector3(1.1 * this.width, 1.3 * (this.height / 2 + (this.lines - 1) * this.height), 1);
      this.box.position = new Vector3(this.width / 2, this.height / 4 - (this.lines - 1) * this.height / 2, 1);
    }
  }

  dispose() {
    for (const i in this.instances) {
      for (const j in this.instances[i]) this.instances[i][j].dispose();
    }
    this.rootNode.dispose();
  }
}
