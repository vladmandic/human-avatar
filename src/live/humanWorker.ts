/**
 * Used by live.html/live.ts as a web worker
 */

/// <reference lib="webworker" />

import * as H from '@vladmandic/human';

let human: H.Human; // instance of human that performs actual detection

onmessage = async (msg) => { // receive message from main thread
  if (!human) {
    human = new H.Human(msg.data.config as H.Config);
    await human.validate(msg.data.config);
    await human.init();
    await human.load();
    const models = Object.values(human.models).filter((m) => m).map((m) => m.modelUrl);
    postMessage({ state: JSON.stringify(human.tf.engine().state), models }); // post result back to main thread
  }
  let result: H.Result | undefined;
  if (msg.data.image) {
    const tensor = human.tf.tensor(msg.data.image, [1, human.config.filter.height, human.config.filter.width, 3], 'float32'); // recreate tensor from typed array received from main thread
    result = await human.detect(tensor as H.Tensor, msg.data.config as H.Config); // perform detection
    human.tf.dispose(tensor);
    postMessage({ result }); // post result back to main thread
  } else {
    await human.warmup();
    postMessage({ warmup: true });
  }
};
