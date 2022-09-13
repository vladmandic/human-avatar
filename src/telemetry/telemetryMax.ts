import type { Telemetry } from './Telemetry';
import type { Point } from '../shared/types';
import { log } from '../shared/log';
import { settings } from '../settings';

let el: HTMLDivElement;
let switchShortLong = true;

export async function updateMaximums(t: Telemetry, boneName: string, overall: number, angles: Point) {
  if (t.person.options.showMaximums) {
    if (!t.maximums[boneName]) t.maximums[boneName] = [-Math.PI, -Math.PI, -Math.PI, 0, Math.PI, Math.PI, Math.PI];
    if (angles[0] > t.maximums[boneName][0]) t.maximums[boneName][0] = angles[0];
    if (angles[1] > t.maximums[boneName][1]) t.maximums[boneName][1] = angles[1];
    if (angles[2] > t.maximums[boneName][2]) t.maximums[boneName][2] = angles[2];
    if (overall > t.maximums[boneName][3]) t.maximums[boneName][3] = overall;
    if (angles[0] < t.maximums[boneName][4]) t.maximums[boneName][4] = angles[0];
    if (angles[1] < t.maximums[boneName][5]) t.maximums[boneName][5] = angles[1];
    if (angles[2] < t.maximums[boneName][6]) t.maximums[boneName][6] = angles[2];
  } else {
    for (const key of Object.keys(t.maximums)) delete t.maximums[key];
  }
}

const deg = (rad: number) => `${Math.round(180 * rad / Math.PI)}`.padStart(3, ' ');

export async function drawMaximums(t: Telemetry) {
  if (!el) {
    el = document.createElement('div') as HTMLDivElement;
    el.id = 'telemetry-max';
    el.style.position = 'fixed';
    el.style.zIndex = '10';
    el.style.bottom = '10px';
    el.style.right = '10px';
    el.style.padding = '8px';
    el.style.backgroundColor = settings.menu.backgroundColor;
    el.addEventListener('click', () => {
      switchShortLong = !switchShortLong;
      log('telemetry maximums', { switchShortLong });
    });
    document.body.appendChild(el);
  }
  if (!t.person.options.showMaximums) {
    el.style.display = 'none';
  } else {
    el.style.display = 'block';
    let html = '';
    html += '<div style="letter-spacing: 2px">joint rotation maximums</div>';
    html += switchShortLong
      ? '<table><thead><tr><th>bone</th><th>overall</th><th>roll</th></tr></thead><tbody>'
      : '<table><thead><tr><th>bone</th><th>overall</th><th>roll</th><th>pitch</th><th>yaw</th></tr></thead><tbody>';
    for (const [key, val] of Object.entries(t.maximums)) {
      html += switchShortLong
        ? `<tr><td>${key}</td><td>${val[3]}°</td><td>${deg(val[4])}° / ${deg(val[0])}°</td></tr>`
        : `<tr><td>${key}</td><td>${val[3]}°</td><td>${deg(val[4])}° / ${deg(val[0])}°</td><td>${deg(val[5])}° / ${deg(val[1])}°</td><td>${deg(val[6])}° / ${deg(val[2])}°</td></tr>`;
    }
    html += '</tbody></table>';
    el.innerHTML = html;
  }
}
