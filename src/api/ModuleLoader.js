'use strict';

const
    ROUTE = '/node_modules/zinggrid/:path?/:file',
    {join, sep} = require('path'),
    ZINGGRID_RGX = new RegExp('^(dist\\/zinggrid(\\.es[56])?\\.min|(es[56]|index))\\.js$'.replace(/\//g, sep), 'i');

class ModuleLoader
{
    /**
     * @param {Request} req
     * @param {Response} res
     * @private
     */
    static _moduleLoader (req, res)
    {
        const
            {file, path} = req.params,
            filename = join(path || '', file);

        ZINGGRID_RGX.test(filename) ? res.sendFile(require.resolve(join('zinggrid', filename))) : res.sendStatus(404);
    }

    /**
     * @param {object} node
     */
    static inject (node)
    {
        node.append('<script type="module" src="/node_modules/zinggrid/es6.js"></script>');
    }

    /**
     * @param {object} app
     */
    static register (app)
    {
        app.get(ROUTE, ModuleLoader._moduleLoader);
    }
}

module.exports = ModuleLoader;