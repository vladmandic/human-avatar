import type { Settings } from '../settings';
import type { PersonOptions } from '../person/Person';
import type { Point, MotionData } from '../shared/types';

export type ActionData = { action: string, data: unknown };
export type CameraData = { name: string, radius: number, position: Point, target: Point };
export type TelemetryData = { rotation: Record<string, boolean>, trace: Record<string, boolean>, chart: Record<string, boolean> };
export type MeshData = { parent: string, name: string, position: Point };
export type InputData = { media: string | undefined, timestamp: number };
export type PersonData = {
  id: number,
  name: string,
  position: Point,
  rotation: Point,
  offsets: Point,
  options: PersonOptions
  telemetry: TelemetryData
  image: string | null,
  current: MotionData,
  interpolated: MotionData,
  normalized: Point[],
  normalizedOffsets: Point[],
  bbox: { min: Point, max: Point, avg: Point },
};

export type Project = {
  settings: Settings,
  input: InputData,
  actions: ActionData[],
  persons: PersonData[],
  cameras: CameraData[],
  meshes: MeshData[],
}
