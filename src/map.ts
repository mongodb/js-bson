// We have an ES6 Map available, return the native instance

let exportedMap: MapConstructor;
if (typeof global.Map !== 'undefined') {
  exportedMap = global.Map;
} else {
  exportedMap = require('core-js/es/map');
}

export { exportedMap as Map };
