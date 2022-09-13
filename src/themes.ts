/**
 * JSON with Theme configuration
 */

export const darkTheme = {
  // default
  defaultTextColor: '#FFFFFF',
  defaultFont: './assets/century-gothic.ttf',

  // sky
  skyboxColor: '#000000',
  ambientColor: '#000000',
  axisTextSize: 100,

  // ground
  groundColor: '#373737',

  // person skin: themed per material choice
  glass: {
    jointsAlbedoColor: '#9D9D9D',
    skinClonedTintColor: '#A7E8FF',
    skinDetachedTintColor: '#FFA6A6',
  },
  metal: {
    skinClonedTintColor: '#A7E8FF',
    skinDetachedTintColor: '#FFA6A6',
  },
  standard: {
    skinDiffuseColor: '#684141',
    jointsDiffuseColor: '#725959', // joint spheres main color
    skinDetachedDiffuseColor: '#CAA08E', // used by glass material
    skinClonedDiffuseColor: '#ACBEE8',
  },

  // person title and center anchor
  personTitleSize: 50, // title above a person when viewing multiple persons
  centerColor: '#D7B6A5', // body center sphere

  // person anchor position and target location joint spheres
  jointPositionColor: '#D7B6A5', // joint spheres
  jointPositionSize: 0.1, // size of joint spheres
  jointTargetColor: '#770033', // joint target spheres
  jointTargetSize: 0.1, // size of joint spheres
  jointFont: '20px Segoe UI', // text on joint spheres
  jointFontColor: '#FFFFFF', // joint target spheres

  // frame mesh model
  tubesColor: '#242424',

  // context menu
  btnBackColor: '#76DEF2',
  btnBackAlpha: 0.8,
  btnFontColor: '#000000',
  btnHighlighColor: '#FBFFA4',
  btnHighlightAlpha: 0.8,

  // telemetry display
  telemetryFont: './assets/century-gothic.ttf',
  telemetryFontSize: 20,
  telemetryAxisSize: 20,
  telemetryBackgroundColor: '#7BFF90',

  telemetryTextColor: '#FFFFFF',
  telemetryMenuHighlight: '#FD006C',
  // telemetry on mouse over highlights
  telemetryTextHighlight: '#770033',
  telemetryColorBase: '#FFFFAA', // used by telemery selector as base color for non-affected bones
  telemetryColorZero: '#FFFF55', // used by telemery selector as highlight color by weight from zero
  telemetryColorQuarter: '#00FF33', // ... to quarter
  telemetryColorHalf: '#3300FF', // ... to half
  telemetryColorFull: '#FF0033', // ... to full
};
