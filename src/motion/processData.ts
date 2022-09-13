/**
 * Methods invoked via scene method only
 * Invokes impure methods that interact with DOM
 */

import { log } from '../shared/log';
import { settings } from '../settings';
import { createPerson, createFrame, updateGround } from './motionInstance';
import { pointsDistance } from '../shared/mathCalculations';
import { cameraPresets } from '../motion/cameraControls';
import type { Motion, Person, Frame, Data, Point } from '../shared/types';

export type FrameData = { keypoints: Point[], score: number, edges: [number, number][], joints: string[], timestamp: number };

let dataCache: Array<FrameData> = [];
let lastFrame: number = -1;

export function clearCache() {
  log('data clear cache');
  dataCache = [];
}

function matchPersonData(motion: Motion, dataInput?: Data, frame?: number): Array<FrameData | null> {
  if (typeof frame !== 'undefined') lastFrame = frame;
  if (dataInput) {
    const now = Date.now();
    // parse input data into new format
    const dataNew: Array<FrameData> = [];
    for (let i = 0; i < dataInput.poses[lastFrame].length; i++) {
      const frameData: FrameData = { keypoints: dataInput!.poses[lastFrame][i], score: dataInput!.boxes[lastFrame][i][4], edges: dataInput.edges, joints: dataInput.joints, timestamp: now }; // create a new unified object
      dataNew[i] = frameData;
    }
    if (dataNew.length > dataCache.length) {
      // if we get more people than we already know about just use that
      dataCache = dataNew;
    } else {
      // calculate all distances between new data and cached data
      const distances: { src: number, dst: number, dist: number }[] = [];
      for (let i = 0; i < dataNew.length; i++) {
        for (let j = 0; j < dataCache.length; j++) {
          distances.push({ src: i, dst: j, dist: pointsDistance(dataNew[i].keypoints[0], dataCache[j].keypoints[0]) });
        }
      }
      distances.sort((a, b) => a.dist - b.dist); // sort by distance
      // match new data with best cached data
      let candidates = distances.filter((dist) => dist.src !== -1);
      while (candidates.length > 0) {
        dataCache[candidates[0].dst] = dataNew[candidates[0].src];
        const samePerson = distances.filter((dist) => dist.src === candidates[0].src);
        for (const candidate of samePerson) candidate.src = -1; // took care of this person so remove it from candidates
        candidates = distances.filter((dist) => dist.src !== -1); // only look at unused records
      }
      dataCache.filter((entry) => entry.timestamp !== now).forEach((candidate) => { candidate.score = 0; }); // reset score for cached entries we did not find
    }
  }
  // create filtered slice from cache
  const maxPersons = Math.min(dataInput?.poses[lastFrame].length || Number.MAX_SAFE_INTEGER, dataCache.length, motion.options.maxPersons);
  const dataSlice = dataCache.slice(0, maxPersons);
  return dataSlice;
}

export async function setScenePresets(motion: Motion) {
  if (motion.options.inputChangeResetCamera) {
    log('scene set presets:', settings.scene.presets);
    for (const preset of settings.scene.presets) cameraPresets(preset);
    // motion.center();
  }
  updateGround(true);
}

export async function processData(motion: Motion, detectionData?: Data, frame?: number) {
  const data = matchPersonData(motion, detectionData, frame);
  const numPersons = data.length;
  if (frame === 0) log('data process:', { persons: numPersons, skeleton: motion.options.showSkeleton, frame: motion.options.showSimpleModel });
  for (let i = 0; i < numPersons; i++) { // loop though pose data for each person
    // update skeletons
    let name = `${motion.options.personNamePrefix}${i + 1}`;
    if (motion.options.showSkeleton) {
      if (!motion.persons[name]) motion.persons[name] = await createPerson(name) as Person; // create person if one does not exist // initial person always exists
      motion.persons[name].updateData(data[i]!.keypoints, data[i]!.score); // send updated frame data and box score
    }
    if (motion.persons[name]) motion.persons[name].rootNode.setEnabled(motion.options.showSkeleton);
    // update frames
    name = `${motion.options.frameNamePrefix}${i + 1}`;
    if (motion.options.showSimpleModel) {
      if (!motion.frames[name]) motion.frames[name] = await createFrame(name) as Frame; // create wireframe if one does not exist
      motion.frames[name].updateRawDetection(data[i]!.keypoints, data[i]!.edges, data[i]!.joints); // send updated frame data to wireframe
    }
    if (motion.frames[name]) motion.frames[name].rootNode.setEnabled(motion.options.showSimpleModel);
  }
  // hide skeletons and frames that are not updated
  const allPersons = Object.values(motion.persons).filter((p) => p.name.startsWith(`${motion.options.personNamePrefix}`));
  for (let i = numPersons; i < allPersons.length; i++) allPersons[i].rootNode.setEnabled(false); // hide remaining people
  const allFrames = Object.values(motion.frames).filter((f) => f.name.startsWith(`${motion.options.frameNamePrefix}`));
  for (let i = numPersons; i < allFrames.length; i++) allFrames[i].rootNode.setEnabled(false); // hide remaining people
}
