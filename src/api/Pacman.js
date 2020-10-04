'use strict';

const
    {posix: {join: join}} = require('path'),
    {json} = require('body-parser'),
    Utils = require('./../Utils'),
    ROUTE = '/-/pacman/api';

class Pacman
{
    static _packageList (storage)
    {
        return Utils.buildRoute({}, async () => await Utils.getLocalDatabase(storage), 404);
    }

    static _packageDetail (storage)
    {
        return Utils.buildRoute({storage}, async (name, meta) => {
            const
                distTags = Object.entries(meta['dist-tags']),
                versions = Object.keys(meta.versions),
                tags = distTags.reduce((p, [tag, version]) => (p[version] = (p[version] || []).concat(tag), p), {});

            return versions.reduce((p, c) => p.concat({version: c, tags: (tags[c] || []).join(', '), name}), []);
        }, 404);
    }

    static _updatePackage (storage, opts)
    {
        return Utils.buildRoute({storage}, async (module, meta, {params: {version}, body}) => {
            const
                tags = (body || {}).tags || [],
                newTags = tags.map(tag => [tag, version]),
                currentTags = Object.entries(meta['dist-tags']).filter(([, v]) => v !== version);

            if (!Utils.protectedTagsPreserved(tags, meta, version, opts)) {
                throw new Error('Cant delete protected tags!');
            }

            meta['dist-tags'] = Object.fromEntries(currentTags.concat(newTags));

            await Utils.changePackage(storage, module, meta);
        }, 409);
    }

    static _deleteTag (storage, opts)
    {
        return Utils.buildRoute({storage}, async (module, meta, {params: {tag}}) => {

            if (opts.protectedTags.includes(tag)) {
                throw new Error('Cant delete protected tags!');
            }

            delete meta['dist-tags'][tag];

            await Utils.changePackage(storage, module, meta);
        }, 409);
    }

    static _deleteVersion (storage, opts)
    {
        return Utils.buildRoute({storage}, async (module, meta, {params: {version}}) => {

            if (!Utils.protectedTagsPreserved([], meta, version, opts)) {
                throw new Error('Cant delete version, protected tags assigned!');
            }

            meta.versions[version] = undefined;
            Object.entries(meta['dist-tags']).forEach(([tag, ver]) => ver === version && delete meta['dist-tags'][tag]);

            await Utils.changePackage(storage, module, meta);
        }, 409);
    }

    static _cleanupTags (storage, opts)
    {
        return Utils.buildRoute({storage}, async (module, meta) => {
            Object.keys(meta['dist-tags']).forEach(t => !opts.protectedTags.includes(t) && delete meta['dist-tags'][t]);
            await Utils.changePackage(storage, module, meta);
        }, 409);
    }

    static _cleanupVersions (storage)
    {
        return Utils.buildRoute({storage}, async (module, meta) => {
            const
                versionsWithTag = Object.values(meta['dist-tags']),
                versionsToRemove = Object.keys(meta.versions).filter(version => !versionsWithTag.includes(version));

            versionsToRemove.forEach(version => meta.versions[version] = undefined);
            await Utils.changePackage(storage, module, meta);
        }, 409);
    }

    static register (app, storage, opts)
    {
        app.get(ROUTE, Pacman._packageList(storage));
        app.get(join(ROUTE, ':scope?', ':package'), Pacman._packageDetail(storage));
        app.put(join(ROUTE, ':scope?', ':package', ':version'), json(), Pacman._updatePackage(storage, opts));
        app.delete(join(ROUTE, ':scope?', ':package', 'tag', ':tag'), Pacman._deleteTag(storage, opts));
        app.delete(join(ROUTE, ':scope?', ':package', 'version', ':version'), Pacman._deleteVersion(storage, opts));
        app.patch(join(ROUTE, ':scope?', ':package', 'cleanup', 'tags'), Pacman._cleanupTags(storage, opts));
        app.patch(join(ROUTE, ':scope?', ':package', 'cleanup', 'versions'), Pacman._cleanupVersions(storage));
    }
}

module.exports = Pacman;