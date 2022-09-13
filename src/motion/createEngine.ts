import { Engine, EngineOptions, WebGPUEngine, WebGPUEngineOptions, NullEngine, NullEngineOptions, GlslangOptions, TwgslOptions, GPUParticleSystem } from '@babylonjs/core';
import { log } from '../shared/log';

export type E = Engine | WebGPUEngine | NullEngine;

export async function createEngine(engineType: 'webgl' | 'webgpu' | 'null', canvas: HTMLCanvasElement): Promise<E> {
  let engine: E;
  if (engineType === 'webgl') {
    const options: EngineOptions = { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false, doNotHandleContextLost: true, audioEngine: false };
    engine = new Engine(canvas, true, options);
    engine.enableOfflineSupport = false;
    log(`engine: babylonjs ${Engine.Version}`);
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    log(`renderer: ${engine._glRenderer.toLowerCase()}`);
    log('gpu acceleration:', GPUParticleSystem.IsSupported);
  } else if (engineType === 'webgpu') {
    const webGPUSupported = await WebGPUEngine.IsSupportedAsync;
    if (!webGPUSupported) log('engine: webgpu is not supported by browser');
    const options: WebGPUEngineOptions = {
      // deviceDescriptor: {
      //   requiredFeatures: ['depth-clip-control', 'depth24unorm-stencil8', 'depth32float-stencil8', 'texture-compression-bc', 'texture-compression-etc2', 'texture-compression-astc', 'timestamp-query', 'indirect-first-instance'],
      // },
    };
    engine = new WebGPUEngine(canvas, options);
    engine.enableOfflineSupport = false;
    const glslangOptions: GlslangOptions = { jsPath: './assets/glslang.js' };
    const twgslOptions: TwgslOptions = { jsPath: './assets/twgsl.js' };
    await (engine as WebGPUEngine).initAsync(glslangOptions, twgslOptions);
    log(`engine: babylonjs ${WebGPUEngine.Version}`);
    log('gpu acceleration:', GPUParticleSystem.IsSupported);
  } else {
    const options: NullEngineOptions = { renderWidth: 640, renderHeight: 480, textureSize: 1024, deterministicLockstep: false, lockstepMaxSteps: 1 };
    engine = new NullEngine(options);
  }
  return engine;
}
