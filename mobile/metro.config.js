// Types, rules, defaults and API wire types live in the Next.js app and are shared, not copied.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const shared = path.resolve(__dirname, "../webapp/src/lib");

config.watchFolders = [...(config.watchFolders ?? []), shared];
config.resolver.extraNodeModules = { ...config.resolver.extraNodeModules, "@shared": shared };

module.exports = config;
