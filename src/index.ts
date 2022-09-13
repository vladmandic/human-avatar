/**
 * Main app used by live.html
 */

import * as H from '@vladmandic/human';
import { settings } from './settings';
import { dom } from './app/domElements';
import { log } from './shared/log';
import { initControls } from './app/domEvents';
import { initWebCam } from './app/domMedia';
import { createScene, createPerson } from './motion/motionInstance';
import { initVideoPlayer } from './app/videoPlayer';
import type { Motion, Point, Person } from './shared/types';

const humanConfig: Partial<H.Config> = {
  backend: 'webgl' as const,
  modelBasePath: 'https://vladmandic.github.io/human-models/models/',
  cacheSensitivity: 0,
  filter: { enabled: true, equalization: true, return: false, width: 256, height: 256 },
  body: { enabled: true, minConfidence: 0.1, maxDetected: 1, modelPath: 'blazepose-heavy.json' },
  face: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
};

let motion: Motion;
let tensors = 0; // monitors tensor counts inside web worker
const human = new H.Human(humanConfig); // local instance of human used only to prepare input and interpolate results
const workerDetector = new Worker('../dist/worker.js'); // processing is done inside web worker
let busy = false; // busy flag set when posted message to worker and cleared when received message from worker
let person: Person;

async function updateHumanData(result: H.Result) {
  if (result.body && result.body[0]) {
    const keypoints: Point[] = result.body[0].keypoints.map((kpt) => [kpt.positionRaw[0], 1 - kpt.positionRaw[1], kpt.positionRaw[2] as number]);
    person.updateData(keypoints, result.body[0].score); // send updated frame data and box score
  }
}

export async function requestDetect() { // detect loop runs as fast as results are received
  if (busy) return; // already processing
  if (dom.video.readyState < 2) { // video not yet ready
    dom.status.innerText = 'initializing';
    setTimeout(() => requestDetect(), 100); // retry
    return;
  }
  busy = true;
  const processed = await human.image(dom.video); // process input in main thread
  const image = await processed.tensor?.data() as Float32Array; // download data to use as transferrable object
  human.tf.dispose(processed.tensor);
  workerDetector.postMessage({ image, config: humanConfig }, [image.buffer]); // immediately request next frame
}

export async function receiveMessage(msg: MessageEvent) {
  busy = false;
  if (msg?.data?.state) {
    const state = JSON.parse(msg?.data?.state);
    if (state.numTensors > (tensors + 10)) log(`state: tensors: ${state.numTensors.toLocaleString()} | bytes: ${state.numBytes.toLocaleString()} | ${human.env.webgl.version?.toLowerCase()}`);
    tensors = state.numTensors;
    dom.status.innerText = 'warming up';
  }
  if (msg?.data?.result) {
    const result = msg?.data?.result as H.Result;
    updateHumanData(result);
    dom.status.innerText = `FPS ${(1000 / result.performance.total).toFixed(1).padStart(4)}`;
  }
  if (msg?.data?.models) log(`models: ${msg.data.models.join(' | ')}`);
  if (msg?.data?.warmup) dom.status.innerText = 'ready';
  if (!dom.video.paused) await requestDetect(); // if not paused request detection of next frame
  else dom.status.innerText = 'paused';
}

async function init() {
  dom.status.innerText = 'loading';
  // presets for live module
  settings.motion.interpolationSteps = 60;
  settings.motion.scalePerson = [1.6, 2.0, 1.8];
  settings.motion.showAxisTitle = false;
  settings.motion.showPersonTitle = false;
  settings.motion.groundVisibility = 0;
  settings.person.updatePosition = false;
  settings.telemetry.rotation = false;
  settings.limits.highlight = false;
  settings.limits.shader = true;
  settings.person.showHighlights = settings.limits.highlight;
  settings.person.showShaders = settings.limits.shader;
  settings.person.showRotation = settings.telemetry.rotation;
  // init video
  await initVideoPlayer();
  // create scene
  if (motion) motion.scene.dispose();
  motion = await createScene(dom.output, { createDefaultPerson: false, groundAutoRotation: 0 });
  motion.setAutoRotate(false);
  person = await createPerson('LIVE') as Person;
  person.kinematics?.setModelType('BlazePoseKeypoints');
  await initControls(motion);
  dom.status.innerText = 'ready';
  dom.btnBoneListAll.click();
}

async function main() {
  await init();
  dom.status.innerText = 'loading';
  await human.validate(humanConfig);
  await human.init(); // requires explicit init since were not using any of the auto functions
  log('human', human.version, '| tfjs', human.tf.version.tfjs, '|', human.env.webgl.version?.toLowerCase());
  log(`platform ${human.env.platform.toLowerCase()} | agent ${human.env.agent.toLowerCase()}`);
  dom.status.innerText = 'initializing';
  workerDetector.onmessage = receiveMessage; // listen to messages from worker thread
  await initWebCam(requestDetect);
}

window.onload = main;
