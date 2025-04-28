const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom configuration for path aliases
config.resolver.alias = {
  '@': '.',
};

module.exports = config;