'use strict';

const Plugin = require('./src/plugin');

module.exports = (config, options) => new Plugin(config, options);