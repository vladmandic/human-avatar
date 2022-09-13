/**
 * Impure methods that work with scene
 * Also interact with DOM so they are not part of the scene class
 */

import { Mesh, AnimationRange, Vector3, LinesMesh } from '@babylonjs/core';
import { Person } from '../person/Person';
import { Motion } from './Motion';
import { initFont } from '../shared/text3D';
import { Frame } from '../frame/Frame';
import { log } from '../shared/log';
import { dom } from '../app/domElements'; // only external dependency is add person to html select element
import { createEngine } from './createEngine';
import { adjustImageMap } from './boneListControls';
import { settings } from '../settings';
import type { MotionOptions } from '../shared/types';
import type { PersonData, MeshData } from '../project/project';

let t: Motion; // default instance of a scene

export const motionSceneReady = (): boolean => {
  if (!t) return false;
  const activePersons = Object.values(t.persons).filter((p) => p.rootNode.isEnabled()).length;
  const readyPersons = Object.values(t.persons).filter((p) => p.ready).length;
  return (activePersons > 0 && activePersons === readyPersons);
};

export async function updateCloneCanvases() {
  let div = document.getElementById('clone-canvases');
  if (div) document.body.removeChild(div);
  div = document.createElement('div');
  div.id = 'clone-canvases';
  div.style.position = 'fixed';
  div.style.left = `${settings.menu.width + 40}px`;
  div.style.bottom = '20px';
  div.style.width = '20px';
  document.body.appendChild(div);
  if (t.options.showCloneCanvases) {
    for (const person of Object.values(t.persons)) {
      if (!person.image) continue;
      const canvas = document.createElement('canvas');
      const image: HTMLImageElement = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = person.image as string;
      });
      canvas.className = 'clone';
      canvas.width = image.width || 0;
      canvas.height = image.height || 0;
      canvas.style.width = dom.image.style.width;
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      ctx.drawImage(image, 0, 0);
      ctx.font = '14px CenturyGothic';
      ctx.fillStyle = 'white';
      ctx.fillText(person.name, 6, 24);
      ctx.fillStyle = 'black';
      ctx.fillText(person.name, 4, 22);
      div.appendChild(canvas);
    }
  }
}

export async function updateTelemetry() {
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  for (const person of persons) {
    if (person.telemetry) person.telemetry.updateTelemetry();
  }
}

export async function createPerson(name: string): Promise<Person | null> {
  if (!t) return null;
  log('person create:', { name });
  t.persons[name] = await Person.create(name, t); // create default person
  for (const mesh of t.persons[name].skeletonMesh) t.shadows.addShadowCaster(mesh, true);
  return t.persons[name];
}

export async function clonePerson(original: Person | number): Promise<Person | null> {
  if (!t) return null;
  if (typeof original === 'number') original = Object.values(t.persons).find((p) => p.id === original) as Person;
  if (original.interpolated.keypoints.length === 0) return null;
  const count = Object.keys(t.persons).length;
  const name = `${t.options.cloneNamePrefix}${count} OF\n${original.name}`;
  log('person clone:', { name });
  t.persons[name] = await Person.create(name, t);
  t.persons[name].parent = original;
  for (const mesh of t.persons[name].skeletonMesh) t.shadows.addShadowCaster(mesh, true);
  original.clones.push(t.persons[name]);
  t.persons[name].offsets = [+0.66 * original.clones.length + original.offsets[0], 0, 0];
  t.persons[name].updateData(original.interpolated.keypoints, original.interpolated.score);
  await updateCloneCanvases();
  return t.persons[name];
}

export async function renamePerson(idx: number, name: string) {
  if (!t) return;
  const persons = Object.values(t.persons);
  if (persons.length <= idx) return;
  // persons[idx].name = name;
  persons[idx].name = name;
  persons[idx].updateTitle(name);
}

export async function deletePerson(name: string) {
  if (!t) return;
  log('person delete:', { name });
  t.persons[name].skeleton?.dispose();
  for (const mesh of t.persons[name].skeletonMesh) mesh.dispose();
  t.persons[name].title?.dispose();
  t.persons[name].position.dispose();
  t.persons[name].lookControllers = {};
  t.persons[name].positions.dispose();
  t.persons[name].anchors.dispose();
  t.persons[name].rootNode.dispose(false);
  if (t.persons[name].parent) {
    t.persons[name].parent!.clones = t.persons[name].parent!.clones.filter((clone) => clone.name !== name); // remove from list of clones
  }
  delete t.persons[name];
  updateCloneCanvases();
}

export async function deleteAllPersons() {
  if (!t) return;
  const persons = Object.values(t.persons); // enumerate ahead since array is changing
  for (const person of persons) await deletePerson(person.name);
}

export async function createFrame(name: string): Promise<Frame | null> {
  if (!t) return null;
  log('frame delete:', { name });
  t.frames[name] = new Frame(name, t); // create default person
  t.shadows.addShadowCaster(t.frames[name].rootNode as Mesh, true);
  return t.frames[name];
}

export async function showInspector() {
  if (!t || !t.scene) return;
  log('inspector show');
  const globalRoot = document.getElementById('inspector') as HTMLDivElement;
  if (t.scene.debugLayer.isVisible()) t.scene.debugLayer.hide();
  else t.scene.debugLayer.show({ embedMode: true, overlay: false, showExplorer: true, showInspector: true, globalRoot });
  if (document.querySelector('#sceneExplorer')) {
    const div = document.querySelector('#sceneExplorer') as HTMLDivElement;
    div.style.fontFamily = 'CenturyGothic';
    div.style.fontVariant = 'small-caps';
    div.style.background = settings.menu.backgroundColor;
  }
  if (document.querySelector('#inspector-host')) {
    const div = document.querySelector('#inspector-host') as HTMLDivElement;
    div.style.fontFamily = 'CenturyGothic';
    div.style.fontVariant = 'small-caps';
    div.style.background = settings.menu.backgroundColor;
  }
  if (document.querySelector('#actionTabs .tabs')) {
    const div = document.querySelector('#actionTabs .tabs') as HTMLDivElement;
    div.style.fontFamily = 'CenturyGothic';
    div.style.fontVariant = 'small-caps';
    div.style.background = settings.menu.backgroundColor;
    div.style.mixBlendMode = 'screen';
  }
}

export function getSceneMeshData() {
  const meshes: MeshData[] = [];
  if (!t) return meshes;
  for (const mesh of t.scene.meshes) {
    if (mesh instanceof Mesh) { // skip InstancedMesh and AbstractMesh
      if (mesh instanceof LinesMesh) continue; // internal scene meshes
      if (mesh.name.startsWith('glyph')) continue; // skip dynamically generated letters
      if (mesh.name.startsWith('text:')) continue; // skip dynamically generated letters
      if (!mesh.parent || !mesh.parent.parent) continue; // skip meshes without parents
      if (!mesh.parent.parent.name.startsWith('person:')) continue; // skip meshes that are not part of parent
      meshes.push({ parent: mesh.parent.parent.name, name: mesh.name, position: [mesh.position.x, mesh.position.y, mesh.position.z] });
    }
  }
  return meshes;
}

export function setSceneMeshData(meshes: MeshData[]) {
  for (const mesh of meshes) {
    const active = t.scene.meshes.find((m) => (m.parent?.parent?.name === mesh.parent) && (m.name === mesh.name));
    if (active) active.position = new Vector3(...mesh.position);
    else log('set scene mesh error:', mesh);
  }
}

export function getPersons(): PersonData[] {
  const persons: PersonData[] = [];
  if (!t) return persons;
  const active = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  for (const person of active) {
    persons.push({
      id: person.id,
      name: person.rootNode.name,
      position: [person.rootNode.position.x, person.rootNode.position.y, person.rootNode.position.z],
      rotation: [person.rootNode.rotation.x, person.rootNode.rotation.y, person.rootNode.rotation.z],
      options: person.options,
      telemetry: {
        rotation: person.telemetry.visibleRotation,
        trace: person.telemetry.visibleTrace,
        chart: person.telemetry.visibleChart,
      },
      offsets: person.offsets,
      current: person.current,
      interpolated: person.interpolated,
      normalized: person.normalized,
      normalizedOffsets: person.normalizedOffsets,
      bbox: person.bbox,
      image: person.image,
    });
  }
  log('persons get:', persons);
  return persons;
}

export function setPersons(persons: PersonData[]) {
  if (!t) return persons;
  log('persons set:', persons);
  const active = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  for (let i = 0; i < active.length; i++) {
    active[i].id = persons[i].id;
    active[i].rootNode.name = persons[i].name;
    active[i].rootNode.position = new Vector3(...persons[i].position);
    active[i].rootNode.rotation = new Vector3(...persons[i].rotation);
    active[i].options = persons[i].options;
    active[i].telemetry.visibleChart = persons[i].telemetry.chart;
    active[i].telemetry.visibleRotation = persons[i].telemetry.rotation;
    active[i].telemetry.visibleTrace = persons[i].telemetry.trace;
    active[i].offsets = persons[i].offsets;
    active[i].current = persons[i].current;
    active[i].interpolated = persons[i].interpolated;
    active[i].normalized = persons[i].normalized;
    active[i].normalizedOffsets = persons[i].normalizedOffsets;
    active[i].bbox = persons[i].bbox;
    active[i].image = persons[i].image;
    active[i].shouldUpdate = true;
  }
  t.shouldUpdate = true;
  return persons;
}

export async function showVectors(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled() && person.active);
  for (const person of persons) {
    log('telemetry vectors:', { person: person.rootNode.name, show });
    person.options.showVectors = show;
    person.shouldUpdate = true;
  }
}

export async function showTracing(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled() && person.active);
  for (const person of persons) {
    log('telemetry trace:', { person: person.rootNode.name, show });
    person.options.showTracing = show;
    person.shouldUpdate = true;
  }
}

export async function showCharts(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled() && person.active);
  for (const person of persons) {
    log('telemetry chart:', { person: person.rootNode.name, show });
    person.options.showCharts = show;
    person.shouldUpdate = true;
  }
}

export async function showHighlights(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled() && person.active);
  for (const person of persons) {
    log('limits highligh:', { person: person.rootNode.name, show });
    person.options.showHighlights = show;
    person.shouldUpdate = true;
  }
}

export async function showMaximums(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled() && person.active);
  for (const person of persons) {
    log('limits maximums:', { person: person.rootNode.name, show });
    person.options.showMaximums = show;
    person.shouldUpdate = true;
  }
}

export async function showTracking(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled() && person.active);
  for (const person of persons) {
    log('motion tracking:', { person: person.rootNode.name, show });
    person.options.showTrack = show;
    person.shouldUpdate = true;
  }
}

export async function showShaders(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled() && person.active);
  for (const person of persons) {
    log('limits shaders:', { person: person.rootNode.name, show });
    person.options.showShaders = show;
    person.shouldUpdate = true;
  }
}

export async function trackPosition(track: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled() && person.active);
  for (const person of persons) {
    log('telemetry track:', { person: person.rootNode.name, track });
    person.options.updatePosition = track;
    person.shouldUpdate = true;
  }
}

export const updateImageMap = () => adjustImageMap();

export async function showRotation(show: boolean) {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled() && person.active);
  for (const person of persons) {
    log('telemetry rotation:', { person: person.rootNode.name, show });
    person.options.showRotation = show;
    person.telemetryRotations.setEnabled(show);
    if (show) person.telemetry.updateTelemetry();
  }
}

export async function updateGround(initial: boolean) {
  if (!t) return;
  t.ground.updatePlane(initial);
}

export async function idleScene(runIdle: boolean) {
  if (runIdle) {
    const persons = Object.values(t.persons);
    if (!persons || persons.length !== 1) return;
    const range = new AnimationRange('idle-walk-run-strafe', 0, 212);
    for (const mesh of persons[0].skeletonMesh) {
      mesh.position = new Vector3(0, -1, 0);
      mesh.rotation = new Vector3(0, Math.PI, 0);
    }
    t.scene.beginAnimation(persons[0].skeleton, range.from, range.to, true, 0.3);
  } else {
    for (const person of Object.values(t.persons)) {
      for (const mesh of person.skeletonMesh) {
        mesh.position = new Vector3(0, 0, 0);
        mesh.rotation = new Vector3(0, 0, 0);
      }
    }
    await t.scene.stopAllAnimations();
    t.options.showAnchors = true;
    if (dom.btnAnchors) dom.btnAnchors.style.backgroundColor = t.options.showAnchors ? settings.menu.btnCheckedColor : settings.menu.btnUncheckedColor;
  }
}

export async function skeletonAutoScale() {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled());
  if (persons.length < 1) return;
  persons[0].autoScale();
}

export function refreshScene() {
  if (!t) return;
  const persons = Object.values(t.persons).filter((person) => person.rootNode.isEnabled() && person.active);
  for (const person of persons) {
    person.shouldUpdate = true;
    person.current.timestamp = Date.now();
  }
  t.shouldUpdate = true;
  t.beforeRender();
  log('scene refresh');
}

export async function createScene(canvas: HTMLCanvasElement, options?: Partial<MotionOptions>): Promise<Motion> {
  if (t) {
    t.scene.dispose();
    t.engine.dispose();
    t.pipeline.dispose();
    Object.values(t.persons).forEach((p) => p.rootNode.dispose());
  }
  if (!t || t.scene.isDisposed) {
    log('scene create start');
    const engine = await createEngine(settings.engine, canvas);
    t = new Motion(engine, canvas); // create new scene
    if (options) t.setOptions(options, false);
    await initFont();
    if (t.options.skeletonAutoLoad) await t.load();
    if (t.options.createDefaultPerson) {
      await createPerson(`${t.options.personNamePrefix}1`);
      idleScene(t.options.idleAnimate);
      setTimeout(() => t.ground.updatePlane(), 1000);
    }
    t.scene.registerBeforeRender(() => t.beforeRender());
    log('scene create finish');
  }

  return t;
}
