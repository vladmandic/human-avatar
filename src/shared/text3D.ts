/**
 * Helper methods for working with TextMesh
 */

import { Scene, StandardMaterial, Color3, Vector3 } from '@babylonjs/core';
import { TextMesh, TextMeshFont, getDefaultFont, setDefaultFont, getDefaultFontMaterial, setDefaultFontMaterial } from './TextMesh';
import { settings } from '../settings';

let scene: Scene;
let counter = 0;

const fontCache: Record<string, TextMeshFont> = {};
export async function loadFont(fontUrl: string, material: StandardMaterial) {
  if (!fontCache[fontUrl]) {
    fontCache[fontUrl] = new TextMeshFont(fontUrl, material);
    await fontCache[fontUrl].loadFont();
  }
  return fontCache[fontUrl];
}

export type TextOptions = {
  font: TextMeshFont,
  fontUrl: string,
  material: StandardMaterial,
  color: Color3,
  position: Vector3,
  rotation: Vector3,
  scaling: Vector3,
  backgroundColor: Color3,
  alpha: number,
};

export async function setTextScene(inScene: Scene) {
  scene = inScene;
}

export async function initFont() {
  if (!getDefaultFontMaterial()) {
    setDefaultFontMaterial(new StandardMaterial('text', scene));
  }
  if (!getDefaultFont()) {
    setDefaultFont(await loadFont(settings.theme.defaultFont, getDefaultFontMaterial()));
  }
  getDefaultFontMaterial().diffuseColor = Color3.FromHexString(settings.theme.defaultTextColor);
}

export async function drawText(text: string, options?: Partial<TextOptions>): Promise<TextMesh | null> {
  if (!scene) return null;
  const material = options?.material || getDefaultFontMaterial();
  let font: TextMeshFont = getDefaultFont();
  if (options?.font) font = options.font;
  if (options?.fontUrl) font = await loadFont(options?.fontUrl, material);
  if (options?.color) {
    font.material = getDefaultFontMaterial().clone(`text:${counter++}`);
    font.material.diffuseColor = options.color;
  }
  if (options?.alpha) font.material.alpha = options.alpha;
  const textMesh: TextMesh = new TextMesh(text, scene, font, options?.backgroundColor);
  textMesh.rootNode.position = options?.position || new Vector3(0, 0, 0);
  textMesh.rootNode.rotation = options?.rotation || new Vector3(0, 0, 0);
  textMesh.rootNode.scaling = options?.scaling || new Vector3(1, 1, 1);
  return textMesh;
}
