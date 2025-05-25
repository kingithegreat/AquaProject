const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom configuration for path aliases
config.resolver.alias = {
  '@': '.',
};

// Add support for CommonJS modules used by Firebase
config.resolver.sourceExts.push('cjs');
// Add support for MP4 video assets
config.resolver.assetExts.push('mp4');

module.exports = config;