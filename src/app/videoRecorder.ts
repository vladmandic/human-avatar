import { VideoRecorder, CreateScreenshotUsingRenderTarget } from '@babylonjs/core';
import { dom } from './domElements';
import { log } from '../shared/log';
import type { Motion } from '../shared/types';

let recorder: VideoRecorder;

export async function recordVideo(motion: Motion) {
  if (!motion) return;
  if (!VideoRecorder.IsSupported(motion.engine)) {
    log('video recording not supported');
    return;
  }
  const fps = dom.recordFPS.valueAsNumber;
  const options = { fps, audioTracks: [], mimeType: 'video/webm', recordChunckSize: 3000 };
  if (!recorder) recorder = new VideoRecorder(motion.engine, options);
  if (recorder.isRecording) {
    log('video record stopping');
    dom.btnRecordVideo.innerText = 'recording video';
    dom.btnRecordVideo.style.backgroundColor = '#50555C';
    recorder.stopRecording();
  } else {
    log('video record starting', { ...options });
    dom.btnRecordVideo.style.backgroundColor = 'maroon';
    dom.btnRecordVideo.innerText = 'stop recording';
    recorder.startRecording('motion.webm', 0);
  }
}

export async function recordScreenshot(motion: Motion) {
  if (!motion || !motion.scene.activeCamera) return;
  log('screenshot resolution:');
  CreateScreenshotUsingRenderTarget(motion.engine, motion.scene.activeCamera, { width: dom.recordResolutionX.valueAsNumber, height: dom.recordResolutionY.valueAsNumber });
}
