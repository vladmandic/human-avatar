/**
 * Standalone math methods
 * No external dependencies
 */

import type { MotionData, MotionOptions, Point } from '../types';

export const calcAngle = (sx: number, sy: number, dx: number, dy: number) => Math.atan2((dy - sy), (dx - sx));

export const calcDiff = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export const calcMiddle = (a: Point, b: Point, aw = 1, bw = 1): Point => [(aw * a[0] + bw * b[0]) / (aw + bw), (aw * a[1] + bw * b[1]) / (aw + bw), (aw * a[2] + bw * b[2]) / (aw + bw)];

export const calcSum = (a: Point, b: Point): Point => [(a[0] + b[0]), (a[1] + b[1]), (a[2] + b[2])];

export const calcYawPitchRoll = (a: Point, b: Point): Point => [
  calcAngle(a[2], a[0], b[2], b[0]) % (2 * Math.PI), // yaw: x & z
  calcAngle(a[2], a[1], b[2], b[1]) % (2 * Math.PI), // pitch: z & y
  calcAngle(a[0], a[1], b[0], b[1]) % (2 * Math.PI), // roll: x & y
];

export const interpolateData = (current: MotionData, interpolated: MotionData, options: MotionOptions): MotionData => {
  interpolated.keypoints = current.keypoints.map((kpt, idx) => {
    const previous = interpolated.keypoints[idx] || kpt;
    return [
      (options.interpolationSteps * previous[0] + (kpt[0] || 0)) / (options.interpolationSteps + 1),
      (options.interpolationSteps * previous[1] + (kpt[1] || 0)) / (options.interpolationSteps + 1),
      (options.interpolationSteps * previous[2] + (kpt[2] || 0)) / (options.interpolationSteps + 1),
    ];
  });
  interpolated.score = current.score;
  interpolated.scores = current.scores;
  interpolated.timestamp = Date.now(); // only update timestamp if above minscore
  return interpolated;
};

export const normalizeKeypoints = (kpts: Point[], targetScale: Point, personOffset: Point, normalizedOffsets: Point[]): Point[] => {
  let xyz = [kpts.map((kpt) => kpt[0]), kpts.map((kpt) => kpt[1]), kpts.map((kpt) => kpt[2])];
  let max = [Math.max(...xyz[0]), Math.max(...xyz[1]), Math.max(...xyz[2])] as Point;
  let min = [Math.min(...xyz[0]), Math.min(...xyz[1]), Math.min(...xyz[2])] as Point;
  const size = [(max[0] - min[0]), (max[1] - min[1]), (max[2] - min[2])];
  const scale = Math.sqrt((size[0] * size[0]) + (size[1] * size[1]));
  const center = [(max[0] + min[0]) / 2, (max[1] + min[1]) / 2, (max[2] + min[2]) / 2];
  const normalized: Point[] = kpts.map((kpt, i) => [ // scale and rotate; relative to hips
    targetScale[0] * ((kpt[0] || 0) - center[0]) / scale + normalizedOffsets[i][0],
    targetScale[1] * ((kpt[1] || 0) - center[1]) / scale + normalizedOffsets[i][1],
    targetScale[2] * ((kpt[2] || 0) - center[2]) / scale + normalizedOffsets[i][2],
  ]);
  xyz = [normalized.map((kpt) => kpt[0]), kpts.map((kpt) => kpt[1]), kpts.map((kpt) => kpt[2])];
  max = [Math.max(...xyz[0]), Math.max(...xyz[1]), Math.max(...xyz[2])];
  min = [Math.min(...xyz[0]), Math.min(...xyz[1]), Math.min(...xyz[2])];
  // center = [(max[0] + min[0]) / 2, (max[1] + min[1]) / 2, (max[2] + min[2]) / 2];
  normalized.push(min); // append minimums to results
  normalized.push(max); // append maximums to results
  const position: Point = [
    targetScale[0] * center[0] / scale + personOffset[0],
    targetScale[1] * center[1] / scale + personOffset[1],
    targetScale[2] * center[2] / scale + personOffset[2],
  ];
  normalized.push(position); // append center to results, used to position a person
  return normalized;
};

export const relativeAngle = (angle1: number, angle2: number) => {
  const modulo = (x: number, y: number) => (x % y + y) % y;
  return modulo((angle2 - angle1 + Math.PI), 2 * Math.PI) - Math.PI;
};

export const radians2degrees = (n: number) => Math.round(180 * n / Math.PI);

export const pointsDistance = (a: Point, b: Point): number => { // distance between two points
  const coord = a.map((axisCoord, axisIdx) => axisCoord - b[axisIdx]);
  return Math.hypot(...coord);
};
