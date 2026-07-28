const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const mobileRoot = path.resolve(projectRoot, 'apps/mobile');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [mobileRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(mobileRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
  '@': path.resolve(mobileRoot, 'src'),
};

module.exports = config;
