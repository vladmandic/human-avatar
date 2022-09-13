import type { Telemetry } from './Telemetry';
import type { Person } from '../person/Person';
import { settings } from '../settings';

let el: HTMLDivElement;

type MotionDef = { name: string, count: number, step: number, time: number };

const motions: Array<MotionDef> = [
  { name: 'hands up', step: 0, count: 0, time: 0 },
  { name: 'arms open', step: 0, count: 0, time: 0 },
  { name: 'feet wide', step: 0, count: 0, time: 0 },
];

async function analyzeMotion(m: MotionDef, p: Person) {
  let res = '';
  if (m.name === 'hands up') {
    if ((m.step === 0) && (p.getBone('LeftHand').getAbsolutePosition().y < p.getBone('Head').getAbsolutePosition().y)) m.step = 1;
    if ((m.step === 1) && (p.getBone('RightHand').getAbsolutePosition().y < p.getBone('Head').getAbsolutePosition().y)) m.step = 2;
    if ((m.step === 2) && (p.getBone('LeftHand').getAbsolutePosition().y > p.getBone('Head').getAbsolutePosition().y)) m.step = 3;
    if ((m.step === 3) && (p.getBone('LeftHand').getAbsolutePosition().y > p.getBone('Head').getAbsolutePosition().y)) m.step = 4;
    if (m.step === 4) {
      m.count += 1;
      m.step = 0;
      if (m.time === 0) m.time = Date.now();
    }
    res += `<div>${m.name}: ${m.count}`;
    if (m.count > 0) res += ` in ${Math.round((Date.now() - m.time) / 100) / 10} sec</div>`;
  }
  if (m.name === 'feet wide') {
    if ((m.step === 0) && Math.abs(p.getBone('LeftFoot').getAbsolutePosition().x - p.getBone('RightFoot').getAbsolutePosition().x) < 0.25) m.step = 1;
    if ((m.step === 1) && Math.abs(p.getBone('LeftFoot').getAbsolutePosition().x - p.getBone('RightFoot').getAbsolutePosition().x) > 0.40) m.step = 2;
    if (m.step === 2) {
      m.count += 1;
      m.step = 0;
      if (m.time === 0) m.time = Date.now();
    }
    res += `<div>${m.name}: ${m.count}`;
    if (m.count > 0) res += ` in ${Math.round((Date.now() - m.time) / 100) / 10} sec</div>`;
  }
  if (m.name === 'arms open') {
    if ((m.step === 0) && Math.abs(p.getBone('LeftHand').getAbsolutePosition().x - p.getBone('RightHand').getAbsolutePosition().x) < 0.25) m.step = 1;
    if ((m.step === 1) && Math.abs(p.getBone('LeftHand').getAbsolutePosition().x - p.getBone('RightHand').getAbsolutePosition().x) > 0.40) m.step = 2;
    if (m.step === 2) {
      m.count += 1;
      m.step = 0;
      if (m.time === 0) m.time = Date.now();
    }
    res += `<div>${m.name}: ${m.count}`;
    if (m.count > 0) res += ` in ${Math.round((Date.now() - m.time) / 100) / 10} sec</div>`;
  }
  return res;
}

export async function trackMotion(t: Telemetry) {
  if (!el) {
    el = document.createElement('div') as HTMLDivElement;
    el.id = 'telemetry-tracking';
    el.style.display = 'none';
    el.style.position = 'fixed';
    el.style.zIndex = '10';
    el.style.top = '100px';
    el.style.right = '10px';
    el.style.padding = '8px';
    el.style.minWidth = '200px';
    el.style.lineHeight = '26px';
    el.style.backgroundColor = settings.menu.backgroundColor;
    document.body.appendChild(el);
  }
  if (!t.person.options.showTrack) {
    el.style.display = 'none';
    for (const motion of motions) {
      motion.count = 0;
      motion.step = 0;
      motion.time = 0;
    }
  } else {
    el.style.display = 'block';
    let html = '';
    html += '<div style="letter-spacing: 2px; font-weight: 800; padding: 4px">motion tracking</div>';
    for (const motion of motions) html += await analyzeMotion(motion, t.person);
    el.innerHTML = html;
  }
}
