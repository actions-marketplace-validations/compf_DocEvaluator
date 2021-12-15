// jest.config.js
// Sync object
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  verbose: true,
  moduleDirectories: ['node_modules', './src'],
  testPathIgnorePatterns: [".d.ts", ".js"],
  transformIgnorePatterns: [
    "node_modules/(?!(syllable)/)"
  ]
};

module.exports = config;


