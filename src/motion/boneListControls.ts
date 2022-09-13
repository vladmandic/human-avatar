import { dom } from '../app/domElements';
import { BoneTelemetryList } from '../shared/modelConstants';
import { settings } from '../settings';
import type { Motion, Person } from '../shared/types';

let motion: Motion;
const activeBones: Record<string, boolean> = {};
let lastBoneIdx = -1;

function getPersons(): Person[] {
  if (!motion) return [];
  const persons = Object.values(motion.persons).filter((person) => person.rootNode.isEnabled() && person.active);
  return persons;
}

export function boneListSetAll(enabled: boolean) {
  for (const person of getPersons()) {
    if (!person.skeleton) continue;
    for (const bone of person.skeleton.bones) {
      person.telemetry.setActive(bone.name, enabled);
    }
  }
}

function addBoneTextElement(boneName: string, boneLabel: string) {
  // const bone = this.getBone(boneName);
  // if (!bone) return;
  let span = document.getElementById(boneName) as HTMLSpanElement;
  if (!span) {
    span = document.createElement('span');
    span.id = boneName;
    span.innerHTML = boneLabel;
    span.className = 'menuBone';
    span.style.cursor = 'pointer';
    span.style.backgroundColor = 'transparent';
    span.style.paddingLeft = '8px';
    span.style.width = '140px';
    dom.boneList.appendChild(span);
  }
  span.onmouseover = () => { // highlight bone on hove
    span.style.color = settings.theme.telemetryMenuHighlight;
    span.style.letterSpacing = '1px';
    for (const person of getPersons()) {
      const boneIdx = person.getBone(boneName).getIndex();
      lastBoneIdx = boneIdx;
      person.setBoneColor(boneIdx, true); // highlight bone
    }
  };
  span.onmouseout = () => {
    span.style.color = 'white';
    span.style.letterSpacing = '0';
    for (const person of getPersons()) {
      person.setBoneColor(lastBoneIdx, person.telemetry.visibleShader[boneName]); // remove highlight if shader is not enabled
    }
  };
  span.onclick = () => {
    const checked = span.style.backgroundColor === 'transparent';
    span.style.backgroundColor = checked ? '#555555' : 'transparent';
    activeBones[span.id] = checked;
    for (const person of getPersons()) {
      person.telemetry.setActive(span.id, checked);
    }
  };
}

const imageMapAreas = `
  <area class="menuImageMapArea" id="menuMapHips" title="Hips" href="" coords="522,484,786,592" shape="rect">
  <area class="menuImageMapArea" id="menuMapSpine" title="Lower Spine" href="" coords="560,380,754,467" shape="rect">
  <area class="menuImageMapArea" id="menuMapSpine2" title="Upper Spine" href="" coords="582,208,722,328,1008,509" shape="rect">
  <area class="menuImageMapArea" id="menuMapNeck" title="Neck" href="" coords="610,170,697,202" shape="rect">
  <area class="menuImageMapArea" id="menuMapHead" title="Head" href="" coords="589,11,719,160" shape="rect">
  <area class="menuImageMapArea" id="menuMapLeftShoulder" title="Left Shoulder" href="" coords="739,199,792,317" shape="rect">
  <area class="menuImageMapArea" id="menuMapRightShoulder" title="Right Shoulder" href="" coords="504,197,565,324" shape="rect">
  <area class="menuImageMapArea" id="menuMapLeftArm" title="Left Upper Arm" href="" coords="803,215,949,304" shape="rect">
  <area class="menuImageMapArea" id="menuMapRightArm" title="Right Upper Arm" href="" coords="494,213,356,308" shape="rect">
  <area class="menuImageMapArea" id="menuMapLeftForeArm" title="Left Forearm" href="" coords="959,215,1131,304" shape="rect">
  <area class="menuImageMapArea" id="menuMapRightForeArm" title="Right Forearm" href="" coords="343,213,176,306" shape="rect">
  <area class="menuImageMapArea" id="menuMapLeftHand" title="Left Hand" href="" coords="1141,213,1289,310" shape="rect">
  <area class="menuImageMapArea" id="menuMapRightHand" title="Right Hand" href="" coords="163,211,18,306" shape="rect">
  <area class="menuImageMapArea" id="menuMapLeftUpLeg" title="Left Upper Leg" href="" coords="661,603,779,840" shape="rect">
  <area class="menuImageMapArea" id="menuMapRightUpLeg" title="Right Upper Leg" href="" coords="520,603,643,833" shape="rect">
  <area class="menuImageMapArea" id="menuMapLeftLeg" title="Left Lower Leg" href="" coords="663,854,778,1116" shape="rect">
  <area class="menuImageMapArea" id="menuMapRightLeg" title="Right Lower Leg" href="" coords="529,852,637,1116" shape="rect">
  <area class="menuImageMapArea" id="menuMapLeftFoot" title="Left Foot" href="" coords="663,1123,780,1211" shape="rect">
  <area class="menuImageMapArea" id="menuMapRightFoot" title="Right Foot" href="" coords="528,1127,635,1209" shape="rect">
  `;

export async function adjustImageMap() {
  const map = document.getElementById('menuBoneImageMap') as HTMLMapElement;
  const scale = dom.imageBone.offsetWidth / (dom.imageBone.naturalWidth || dom.imageBone.width);
  const areas = Array.from(map.getElementsByTagName('area'));
  for (const area of areas) {
    const coords = area.coords.split(',').map((s) => parseInt(s));
    area.coords = coords.map((coord) => Math.round(coord * scale)).join(',');
    area.onclick = (e) => {
      e.preventDefault();
      const id = area.id.replace('menuMap', '');
      if (!activeBones[id]) activeBones[id] = false;
      activeBones[id] = !activeBones[id];
      for (const person of getPersons()) person.telemetry.setActive(id, activeBones[id]);
    };
    area.onmousemove = (e) => {
      dom.imageBone.style.background = `radial-gradient(circle at ${e.clientX - dom.imageBone.offsetLeft}px ${e.clientY - dom.imageBone.offsetTop + window.pageYOffset}px, white 4px, transparent 40px)`;
      const boneName = area.id.replace('menuMap', '');
      for (const person of getPersons()) {
        const boneIdx = person.getBone(boneName).getIndex();
        lastBoneIdx = boneIdx;
        person.boneShaderInfo?.thresholds.fill(0);
        person.setBoneColor(boneIdx, true); // blue highlight
      }
    };
    area.onmouseleave = () => {
      dom.imageBone.style.background = '';
      const boneName = area.id.replace('menuMap', '');
      for (const person of getPersons()) {
        person.boneShaderInfo?.thresholds.fill(0.99);
        person.setBoneColor(lastBoneIdx, person.telemetry.visibleShader[boneName]); // remove highlight if shader is not enabled
      }
    };
  }
}

function createImageMap() {
  if (!dom.imageBone) return;
  let imageMap = document.getElementById('menuBoneImageMap') as HTMLMapElement;
  if (!imageMap) {
    imageMap = document.createElement('map') as HTMLMapElement;
    imageMap.name = 'menuBoneImageMap';
    imageMap.id = 'menuBoneImageMap';
    imageMap.innerHTML = imageMapAreas;
    dom.imageBone.parentElement!.append(imageMap);
    dom.imageBone.useMap = '#menuBoneImageMap';
  }
  adjustImageMap();
}

export async function createBoneDomElements(instance: Motion) {
  motion = instance;
  for (const [boneName, boneLabel] of Object.entries(BoneTelemetryList)) addBoneTextElement(boneName, boneLabel);
  createImageMap();
}
