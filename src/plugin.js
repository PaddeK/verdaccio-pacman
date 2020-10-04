'use strict';

const
    ModuleLoader = require('./api/ModuleLoader'),
    StaticFiles = require('./api/StaticFiles'),
    Injector = require('./api/Injector'),
    Pacman = require('./api/Pacman'),
    Utils = require('./Utils'),
    Defaults = {
        enabled: true,
        protectedTags: [
            'latest'
        ]
    };

class Plugin
{
    /**
     * @return {{enabled: boolean, protectedTags: [string]}}
     * @constructor
     */
    static get Defaults ()
    {
        return Defaults;
    }

    /**
     * @param {object} config
     */
    constructor (config)
    {
        config = Object.assign({}, Defaults, Utils.validateConfig(config));
        // noinspection JSCheckFunctionSignatures
        config.protectedTags = Array.from(new Set(Defaults.protectedTags.concat(config.protectedTags)));

        this.enabled = config.enabled;
        this.protectedTags = config.protectedTags;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} app
     * @param {object} auth
     * @param {{getPackage: function}} storage
     */
    register_middlewares (app, auth, storage)
    {
        if (!this.enabled) {
            return;
        }

        ModuleLoader.register(app);
        Injector.register(app, {protectedTags: this.protectedTags});
        StaticFiles.register(app);
        Pacman.register(app, storage, {protectedTags: this.protectedTags});
    }
}

module.exports = Plugin;