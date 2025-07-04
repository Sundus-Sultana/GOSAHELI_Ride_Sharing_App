// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const config = getDefaultConfig(__dirname);

// 👇 Tell Metro to ignore backend folder
config.resolver.blockList = exclusionList([
  /backend\/.*/,
]);

module.exports = config;
