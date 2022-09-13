import { dom } from './domElements';
import { log } from '../shared/log';
import { settings } from '../settings';
import { setMenuVisibilityDefaults, setMenuDefaults } from './domDefaults';
import { initMenuControls, bindMenuRangeControls } from './domControls';
import type { Motion } from '../shared/types';

let motion: Motion;

export const menuResize = (size: number) => {
  const menuWidth = size - 12;
  const iconSize = Math.round(size / 7);
  const fontSize = Math.round(size / 18);
  log('menu resize:', { menuWidth, iconSize, fontSize });
  dom.menu.style.width = `${menuWidth}px`;
  document.body.style.fontSize = `${fontSize}px`;
  const elements = Array.from(document.getElementsByClassName('menuBtnIcon')) as HTMLElement[];
  for (const el of elements) {
    el.style.width = `${iconSize}px`;
    el.style.height = `${iconSize}px`;
  }
  /*
  const map = document.getElementById('menuBoneImageMap') as HTMLMapElement;
  const scale = dom.boneImage.offsetWidth / (dom.boneImage.naturalWidth || dom.boneImage.width);
  for (const area of Array.from(map.getElementsByTagName('area'))) {
    const coords = area.coords.split(',').map((s) => parseInt(s));
    area.coords = coords.map((coord) => Math.round(coord * scale)).join(',');
  }
  */
};

const bindMenuResizer = () => {
  // create event for all menu sections
  const menuSections = Array.from(document.getElementsByClassName('menuHide')) as HTMLSpanElement[];
  for (const el of menuSections) {
    el.onclick = () => {
      const parent = el.parentElement as HTMLDivElement;
      if (parent.style.height !== '1.4rem') parent.style.height = '1.4rem';
      else parent.style.height = '';
    };
  }
  if (dom.menu) {
    dom.menu.onclick = (evt: MouseEvent) => {
      if ((evt as PointerEvent).pointerId < 0) return;
      if (dom.menu.style.width === '0px') dom.menu.style.width = `${settings.menu.width}px`;
      else if (evt.clientX === 0) dom.menu.style.width = '0';
    };
  }
  if (dom.menuResize) {
    dom.menuResize.onmousedown = () => {
      dom.menu.onmousemove = (e: MouseEvent) => {
        if (e.buttons !== 1) return; // mouse button pressed
        menuResize(e.clientX);
      };
      dom.menuResize.onmouseup = () => { dom.menu.onmousemove = null; };
    };
  }
};

export async function initControls(motionInstance: Motion) {
  log('menu init controls');
  motion = motionInstance;
  bindMenuRangeControls();
  setMenuDefaults(motion);
  setMenuVisibilityDefaults();
  initMenuControls(motion);
  bindMenuResizer();
  menuResize(settings.menu.width);
}
