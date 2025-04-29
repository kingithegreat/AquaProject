const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom configuration for path aliases
config.resolver.alias = {
  '@': '.',
};

// Add support for CommonJS modules used by Firebase
config.resolver.sourceExts.push('cjs');

module.exports = config;