/**
 * Helper method that tries to determine correct skeleton scale based on input data match
 */

import { log } from '../shared/log';
import { dom } from '../app/domElements'; // only external dependency is add person to html select element
import type { Point, Person } from '../shared/types';

export async function skeletonAutoScale(person: Person) {
  // person.normalized[person.kinematics.model.leftKnee] => person.kinematics.anchor.LeftUpLeg.position
  const l0 = person.getBone('LeftLeg').getAbsolutePosition();
  const r0 = person.getBone('RightLeg').getAbsolutePosition();
  const l1 = person.kinematics.anchor.LeftUpLeg.position;
  const r1 = person.kinematics.anchor.RightUpLeg.position;
  const tgt = l1.subtract(r1);
  const src = l0.subtract(r0);
  const scale = src.divide(tgt);
  const x = person.motion.options.scalePerson[0] * (src.x > 0.1 ? scale.x : 1);
  const y = person.motion.options.scalePerson[1] * (src.y > 0.1 ? scale.y : 1);
  const scalePerson: Point = [x, y, (x + y) / 2];
  if (x > 0.5 && y > 1) {
    log('skeleton auto-scale:', person.motion.options.scalePerson, scalePerson);
    person.motion.setOptions({ scalePerson });
    if (dom.scalePersonX && dom.scalePersonX.oninput) { dom.scalePersonX.valueAsNumber = person.motion.options.scalePerson[0]; dom.scalePersonX.oninput(new Event('input')); }
    if (dom.scalePersonY && dom.scalePersonY.oninput) { dom.scalePersonY.valueAsNumber = person.motion.options.scalePerson[1]; dom.scalePersonY.oninput(new Event('input')); }
    if (dom.scalePersonZ && dom.scalePersonZ.oninput) { dom.scalePersonZ.valueAsNumber = person.motion.options.scalePerson[2]; dom.scalePersonZ.oninput(new Event('input')); }
  } else {
    log('skeleton auto-scale fail:', person.motion.options.scalePerson, scalePerson);
  }
}
