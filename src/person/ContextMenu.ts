/**
 * Class that creates an instance of context menu
 * Subclass of Person
 * No external dependencies
 */

import { Color3, Color4, Vector3, TransformNode, ArcRotateCamera, Scene } from '@babylonjs/core';
import { GUI3DManager, HolographicButton, PlanePanel, TextBlock } from '@babylonjs/gui';
import { clonePerson, deletePerson } from '../motion/motionInstance';
import { settings } from '../settings';
import type { Person } from '../shared/types';

// eslint-disable-next-line no-unused-vars
type Callback = (person: Person) => void;

export class ContextMenu {
  person: Person;
  scene: Scene;
  manager: GUI3DManager;
  panel: PlanePanel;
  anchor: TransformNode;
  buttons: Record<string, HolographicButton> = {};

  constructor(person: Person, scene: Scene) {
    this.person = person;
    this.scene = scene;
    this.manager = new GUI3DManager(this.person.scene);
    this.manager.controlScaling = 0.20;
    this.anchor = new TransformNode('menu', this.person.scene);
    this.anchor.position = new Vector3(0.5, 0, -0.5);
    this.anchor.rotation = new Vector3(0, 0, 0);
    this.anchor.parent = person.rootNode;
    this.panel = new PlanePanel('panel');
    this.panel.margin = 0.1;
    this.panel.columns = 2;
    this.manager.addControl(this.panel);
    this.panel.linkToTransformNode(this.anchor);

    // order of button is inverse vertical
    this.panel.blockLayout = true;
    this.buttons.vectors = this.createButton('hide vectors', this.showVectors);
    this.buttons.rotation = this.createButton('hide rotation', this.showRotations);
    this.buttons.center = this.createButton('center person', this.centerPersonBtn);
    this.buttons.clone = this.createButton('clone person', this.clonePersonBtn);
    this.buttons.save = this.createButton('save pose', this.savePoseBtn);
    this.buttons.restore = this.createButton('restore pose', this.restorePoseBtn);
    this.panel.blockLayout = false;
    this.hide();
  }

  show() {
    const shouldShow = !this.panel.isVisible && (this.person.current.keypoints.length > 0);
    this.panel.isVisible = shouldShow;
    for (const btn of Object.values(this.buttons)) btn.isVisible = shouldShow;
    const cam = this.scene.activeCamera as ArcRotateCamera;
    this.manager.utilityLayer?.setRenderCamera(cam);
    this.anchor.rotation = new Vector3(Math.PI / 4 - cam.beta / 2 - this.person.rootNode.rotation.x, Math.PI + Math.PI / 2 - cam.alpha - this.person.rootNode.rotation.y, 0 - this.person.rootNode.rotation.z);
  }

  hide() {
    this.panel.isVisible = false;
    for (const btn of Object.values(this.buttons)) btn.isVisible = false;
  }

  createTextBlock(text: string) {
    const textBlock = new TextBlock();
    textBlock.text = text.replace(' ', '\n').toUpperCase();
    textBlock.color = settings.theme.btnFontColor;
    textBlock.alpha = 1;
    textBlock.resizeToFit = true;
    textBlock.fontFamily = 'CenturyGothic';
    textBlock.fontSize = 50;
    textBlock.fontWeight = '800';
    return textBlock;
  }

  createButton(name: string, callback: Callback) {
    const btn = new HolographicButton(name, true);
    btn.onPointerDownObservable.add(() => callback(this.person));
    this.panel.addControl(btn);
    btn.backMaterial.albedoColor = Color3.FromHexString(settings.theme.btnBackColor);
    btn.backMaterial.alpha = settings.theme.btnBackAlpha;
    btn.frontMaterial.albedoColor = Color3.FromHexString(settings.theme.btnHighlighColor);
    btn.frontMaterial.hoverColor = Color4.FromHexString(settings.theme.btnHighlighColor);
    btn.frontMaterial.alpha = settings.theme.btnHighlightAlpha;
    btn.plateMaterial.diffuseColor = Color3.FromHexString(settings.theme.btnFontColor);
    btn.content = this.createTextBlock(name);
    btn.renderingGroupId = 1;
    return btn;
  }

  removePersonBtn: Callback = (person: Person) => {
    deletePerson(person.name);
    this.hide();
  };

  clonePersonBtn: Callback = (person: Person) => {
    clonePerson(person);
    this.hide();
  };

  centerPersonBtn: Callback = (person: Person) => {
    if (!this.scene.activeCamera) return;
    const cam = this.scene.activeCamera as ArcRotateCamera;
    cam.target = person.position.position;
    this.hide();
  };

  savePoseBtn: Callback = (person: Person) => {
    if (!person.skeleton) return;
    person.skeleton.setCurrentPoseAsRest();
    this.hide();
  };

  restorePoseBtn: Callback = (person: Person) => {
    if (!person.skeleton) return;
    person.skeleton.returnToRest();
    this.hide();
  };

  showVectors: Callback = (person: Person) => {
    person.options.showVectors = !person.options.showVectors;
    this.buttons.vectors.content = this.createTextBlock(person.options.showVectors ? 'hide vectors' : 'show vectors');
    person.shouldUpdate = true;
    this.hide();
  };

  showRotations: Callback = (person: Person) => {
    person.telemetryRotations.setEnabled(!person.telemetryRotations.isEnabled());
    this.buttons.vectors.content = this.createTextBlock(person.telemetryRotations.isEnabled() ? 'hide rotation' : 'show rotation');
    person.shouldUpdate = true;
    this.hide();
  };
}
