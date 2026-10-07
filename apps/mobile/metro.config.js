// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// content.db is bundled as an asset and copied into the app's SQLite folder on first launch.
config.resolver.assetExts.push('db');

module.exports = config;
