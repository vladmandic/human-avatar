import { dom } from './domElements';
import { log } from '../shared/log';
import { updateVideoBar, setVideoTimestamp } from './videoPlayer';
import type { Data } from '../shared/types';

// eslint-disable-next-line no-unused-vars
type TCallback = (data: Data | null, previousFrame?: number) => void;

export const getInputTimestamp = (): number => ((dom.video && dom.video.currentTime) ? dom.video.currentTime : -1);
export const getInputSrc = (): string => ((dom.video && dom.video.src) ? dom.video.src : dom.image.src);
export const setInputTimestamp = (ts: number) => {
  log('set input timestamp:', ts);
  if (ts > -1) setVideoTimestamp(ts);
};

export async function initWebCam(callback: TCallback) {
  const constraints = { audio: false, video: { facingMode: 'user', resizeMode: 'crop-and-scale', width: { ideal: 1280 }, height: { ideal: 1280 } } };
  const stream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  dom.video.srcObject = stream;
  log('media stream:', { stream });
  await new Promise((resolve) => { dom.video.oncanplaythrough = () => resolve(true); });
  dom.video.style.visibility = 'visible';
  dom.video.onplay = () => {
    updateVideoBar();
    callback(null);
  };
  dom.video.play();
}
