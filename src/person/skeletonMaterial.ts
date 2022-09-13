/**
 * Helper method that sets properties of a skeleton
 */

import { Color3, MultiMaterial, Mesh } from '@babylonjs/core';
import { CustomMaterial, PBRCustomMaterial } from '@babylonjs/materials';
import { log } from '../shared/log';
import { settings } from '../settings';
import type { Person, Point } from '../shared/types';

export type BoneShaderInfo = {
  enabled: Array<number>,
  colorsBase: Array<Point>,
  colorsFocus: Array<Point>
  sensitivity: Array<number>
  thresholds: Array<number>
}

export function setSkeletonMaterials(person: Person, skeletonMesh: Mesh[], material: string) {
  let materialSkin: PBRCustomMaterial | CustomMaterial;
  let materialJoints: PBRCustomMaterial | CustomMaterial;

  if (material === 'glass') {
    // set skin material
    materialSkin = new PBRCustomMaterial('skin:surface', person.scene);
    materialSkin.metallic = 0;
    materialSkin.roughness = 0;
    materialSkin.alpha = 1.0;
    materialSkin.subSurface.isRefractionEnabled = true;
    materialSkin.wireframe = person.motion.options.wireframeBone;
    // set joint material
    materialJoints = new PBRCustomMaterial('skin:joints', person.scene);
    materialJoints.metallic = 0.25;
    materialJoints.roughness = 0.1;
    materialJoints.alpha = 0.05;
    materialJoints.albedoColor = Color3.FromHexString(settings.theme.glass.jointsAlbedoColor);
    materialJoints.wireframe = person.motion.options.wireframeJoint;
    // predefine detached and cloned materials
    const materialDetached = materialSkin.clone('skin:detached');
    materialDetached.subSurface.tintColor = Color3.FromHexString(settings.theme.glass.skinDetachedTintColor);
    const materialCloned = materialSkin.clone('skin:cloned');
    materialCloned.subSurface.tintColor = Color3.FromHexString(settings.theme.glass.skinClonedTintColor);
  } else if (material === 'metal') {
    // set skin material
    materialSkin = new PBRCustomMaterial('skin:surface', person.scene);
    materialSkin.metallic = 0.9;
    materialSkin.roughness = 0.1;
    materialSkin.alpha = 1.0;
    materialSkin.subSurface.isRefractionEnabled = true;
    materialSkin.wireframe = person.motion.options.wireframeBone;
    // set joint material
    materialJoints = new PBRCustomMaterial('skin:joints', person.scene);
    materialJoints.metallic = 0.9;
    materialJoints.roughness = 0.3;
    materialJoints.alpha = 0.1;
    materialJoints.subSurface.isRefractionEnabled = true;
    materialJoints.wireframe = person.motion.options.wireframeJoint;
    // predefine detached and cloned materials
    const materialDetached = materialSkin.clone('skin:detached');
    materialDetached.emissiveColor = Color3.FromHexString(settings.theme.metal.skinDetachedTintColor);
    const materialCloned = materialSkin.clone('skin:cloned');
    materialCloned.reflectionColor = Color3.FromHexString(settings.theme.metal.skinClonedTintColor);
  } else if (material === 'standard') { // use standard skeleton material
    // set skin material
    materialSkin = new CustomMaterial('skin:surface', person.scene);
    materialSkin.diffuseColor = Color3.FromHexString(settings.theme.standard.skinDiffuseColor);
    materialSkin.wireframe = person.motion.options.wireframeBone;
    materialSkin.alpha = 0.9;
    // set joint material
    materialJoints = new CustomMaterial('skin:joints', person.scene);
    materialJoints.diffuseColor = Color3.FromHexString(settings.theme.standard.jointsDiffuseColor);
    materialJoints.wireframe = person.motion.options.wireframeJoint;
    materialJoints.alpha = 0.2;
    materialJoints.transparencyMode = 2; // alphaBlend
    // predefine detached and cloned materials
    const materialDetached = materialSkin.clone('skin:detached');
    materialDetached.diffuseColor = Color3.FromHexString(settings.theme.standard.skinDetachedDiffuseColor);
    const materialCloned = materialSkin.clone('skin:cloned');
    materialCloned.diffuseColor = Color3.FromHexString(settings.theme.standard.skinClonedDiffuseColor);
  }

  // @ts-ignore
  if (!materialSkin || !materialJoints) {
    log('skeleton material: default');
    return;
  }

  if (materialSkin instanceof PBRCustomMaterial) {
    const numBones = person.skeleton?.bones.length || 0;
    person.boneShaderInfo = {
      enabled: Array(numBones).fill(-1), // -1 disabled | 1 enabled
      colorsBase: Array(numBones).fill([0, 1, 0]), // col3 green
      colorsFocus: Array(numBones).fill([1, 0, 0]), // col3 red
      sensitivity: Array(numBones).fill(2), // value sensitivity factor
      thresholds: Array(numBones).fill(0.99), // bone weights thresholds for weighted bones
    };
    // initialize variable arrays to shader uniforms
    materialSkin.AddUniform('boneThresholds', `float[${numBones}]`, person.boneShaderInfo.thresholds);
    materialSkin.AddUniform('boneIndexes', `float[${numBones}]`, person.boneShaderInfo.enabled);
    materialSkin.AddUniform('boneColorsBase', `vec3[${numBones}]`, person.boneShaderInfo.colorsBase.flat());
    materialSkin.AddUniform('boneColorsFocus', `vec3[${numBones}]`, person.boneShaderInfo.colorsFocus.flat());
    // if VERTEXCOLOR is defined then shader defines vColor as varying output from vertex to fragment shader
    materialSkin.VertexShader = materialSkin.VertexShader.replace('#define CUSTOM_VERTEX_BEGIN', '#define VERTEXCOLOR');
    // append shader to create color match per skeleton
    // note that matricesIndices are defined only for bones, so check for NUM_BONE_INFLUENCERS
    // boneIndex is offset by 2 since there are issues passing zero as uniform
    materialSkin.VertexShader = materialSkin.VertexShader.replace('#define CUSTOM_VERTEX_MAIN_END', `
      // vColor = vec4(.0, .0, .0, 1.); // set default if needed
      #if NUM_BONE_INFLUENCERS > 0 // sanity check if bone matrix is defined
        for (int boneIdx = 0; boneIdx < ${numBones}; boneIdx++) { // loop through bones
          for (int channel = 0; channel < 4; channel++) { // loop through matrix channels
            int matricesIdx = int(matricesIndices[channel]); // index is stored as float and we need int
            if ((matricesIdx == boneIdx) && (boneIndexes[boneIdx] > .0) && (matricesWeights[channel] > boneThresholds[boneIdx])) { // if current bone is actual bone in matrix, bone is enabled and weights are above threshold
              if (boneColorsFocus[boneIdx] == vec3(.0, .0, .0)) { // skip shader if target color is zeroed
                break;
              }
              vec3 color3 = mix(boneColorsBase[boneIdx].xyz, boneColorsFocus[boneIdx].xyz, 1.2 * matricesWeights[channel]); // weighted color
              vColor = vec4(color3, .0); // set color to output varying variable which is linked to fragment shader, alpha is stripped later
              break;
            }
          }
        }
      #endif
    `);
    // if VERTEXCOLOR is defined then shader defines vColor as varying input from vertex to fragment shader
    materialSkin.FragmentShader = materialSkin.FragmentShader.replace('#define CUSTOM_FRAGMENT_BEGIN', '#define VERTEXCOLOR');
    // simply apply color from vertex shader in fragment shader is possible
    materialSkin.FragmentShader = materialSkin.FragmentShader.replace('#define CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION', `
      finalEmissive.rgb = vec3(vColor).rgb;
    `);
    // upload variables to uniforms on each frame so they are constantly bound
    materialSkin.onBindObservable.add(() => {
      if (person.boneShaderInfo) {
        const effect = materialSkin.getEffect();
        effect.setArray('boneIndexes', person.boneShaderInfo.enabled);
        effect.setArray('boneThresholds', person.boneShaderInfo.thresholds);
        effect.setArray3('boneColorsBase', person.boneShaderInfo.colorsBase.flat());
        effect.setArray3('boneColorsFocus', person.boneShaderInfo.colorsFocus.flat());
      }
    });
  }

  if (skeletonMesh[0] && skeletonMesh[0].material) {
    if (skeletonMesh[0].material instanceof MultiMaterial) {
      const materials = (skeletonMesh[0].material as MultiMaterial).getChildren();
      materials[0] = materialSkin;
      materials[1] = materialJoints;
      log('skeleton material:', { material });
    } else {
      skeletonMesh[0].material = materialSkin;
    }
  }
  if (skeletonMesh[1] && skeletonMesh[1].material) {
    skeletonMesh[1].material = materialJoints;
  }
}
