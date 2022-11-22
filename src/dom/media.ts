import { dom } from './elements';
import { log } from '../log';
import { updateVideoBar } from './videoPlayer';
import type { Data } from '../types';

// eslint-disable-next-line no-unused-vars
type TCallback = (data: Data | null, previousFrame?: number) => void;

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

export async function initVideo(callback: TCallback) {
  dom.video.src = 'assets/excercise.mp4';
  // log('video stream:', { stream });
  await new Promise((resolve) => { dom.video.oncanplaythrough = () => resolve(true); });
  dom.video.style.visibility = 'visible';
  dom.video.onplay = () => {
    updateVideoBar();
    callback(null);
  };
  dom.video.play();
}
