/* global document, location, XMLHttpRequest, ZingGrid */

import TagType from './TagType.js';
import ListGrid from './ListGrid.js';
import PackageGrid from './PackageGrid.js';

class Pacman
{
    constructor ()
    {
        const
            button = document.createElement('button'),
            toolbarLeftSide = document.querySelector('header div[class*="LeftSide"]'),
            homeButton = document.querySelector('a[class*="StyledLink"]');

        button.setAttribute('class', 'pacman open');
        button.addEventListener('click', this._load.bind(this));

        toolbarLeftSide.append(button);
        homeButton.addEventListener('click', () => location.assign('/'));
    }

    /**
     * @private
     */
    _load ()
    {
        const xhr = new XMLHttpRequest();

        xhr.addEventListener('load', this._inject.bind(this, xhr));
        xhr.open('GET', '/-/pacman/web/index.html');
        xhr.send();
    }

    /**
     * @param {object} xhr
     * @return {Promise}
     * @private
     */
    async _inject (xhr)
    {
        document.querySelector('div.container.content').innerHTML = xhr.responseText;

        const options = JSON.parse((document.querySelector('#pacman-options') || {}).value || '{}');

        ZingGrid.registerCellType(TagType.TYPE, {renderer: TagType.renderer.bind(null, options)});

        new ListGrid(document, '#main', '#child');
        new PackageGrid(document, '#main', '#child', options);
    }
}

new Pacman();