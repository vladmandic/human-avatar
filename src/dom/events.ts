import { dom } from './elements';
import { log } from '../log';
import { settings } from '../settings';
import { setMenuVisibilityDefaults, setMenuDefaults } from './defaults';
import { initMenuControls, bindMenuRangeControls } from './controls';
import type { Motion } from '../types';

let motion: Motion;

const menuResize = (size: number) => {
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
