/* global fetch, ZingGrid */

const ERROR_MSG = 'The server encountered an error and the tag could not be deleted.';

class PackageGrid
{
    /**
     * @param {object} doc
     * @param {string} mainId
     * @param {string} childId
     * @param {object} options
     */
    constructor (doc, mainId, childId, options)
    {
        this._el = doc.querySelector(childId);
        this._main = doc.querySelector(mainId);
        this._doc = doc;
        this._opts = options;

        this._el.beforeDeleteDialog = this._beforeDeleteDialog.bind(this);

        ZingGrid.registerMethod(this._versionSorter, 'versionSorter', this);

        this._el.executeOnLoad(() => {
            this._fixDialog();

            const
                cleanupTagsButton = this._el.querySelector('zg-button.icon-remove-tag'),
                cleanupVersionsButton = this._el.querySelector('zg-button.icon-remove-version');

            cleanupTagsButton.addEventListener('click', this._cleanupTags.bind(this));
            cleanupVersionsButton.addEventListener('click', this._cleanupVersions.bind(this));

            this._el.addEventListener('cell:openedit', this._openEditor.bind(this));
            this._el.addEventListener('data:record:beforedelete', this._beforeDeleteRecordData.bind(this));
            this._el.addEventListener('data:record:beforechange', this._beforeChangeRecordData.bind(this));
            this._el.addEventListener('tagdelete', this._tagDeleteHandler.bind(this));
            this._el.addEventListener('data:load', () => this._el.sortColumn('version','desc'));
        });
    }

    /**
     * @param {string} a
     * @param {string} b
     * @return {number}
     * @private
     */
    _versionSorter (a, b)
    {
        return ~~a.version.replaceAll('.', '') - ~~b.version.replaceAll('.', '');
    }

    /**
     * @private
     */
    _cleanupTags ()
    {
        const
            name = this._el.ZG.data[0].name,
            tags = this._opts.protectedTags.sort().join('", "').replace(/,(?!.*,)/, ' and');

        this._warnDialog(`This will remove all tags except "${tags}" !`, async () => {
            await fetch(`/-/pacman/api/${name}/cleanup/tags`, {method: 'PATCH'});
            this._el.refresh();
        });
    }

    /**
     * @private
     */
    _cleanupVersions ()
    {
        const name = this._el.ZG.data[0].name;

        this._warnDialog(`This will remove all versions with no assigned tags!`, async () => {
            await fetch(`/-/pacman/api/${name}/cleanup/versions`, {method: 'PATCH'});
            this._el.refresh();
        });
    }

    /**
     * @param {string} event
     * @private
     */
    _beforeDeleteDialog (event)
    {
        const
            rowEl = event.target.closest('zg-row'),
            rowIndex = rowEl.rowIndex,
            recordEl = this._el.row(rowIndex),
            tags = recordEl.record.tags.replace(/\s/g, '').split(',').filter(Boolean);

        if (tags.some(tag => this._opts.protectedTags.includes(tag))) {
            event.stopImmediatePropagation();
            return this._warnDialog('This version cant be deleted because it has protected tags assigned!');
        }
    }

    /**
     * @param {object} event
     * @private
     */
    _openEditor (event)
    {
        const
            {tags} = event.detail.ZGData.data,
            value = (tags || '').replace(/\s/g, '').split(',').filter(t => t && !this._opts.protectedTags.includes(t));

        value.sort((a, b) => a.localeCompare(b));

        this._el.oDOMDialog.$bodycontent.querySelector('input').value = value.join(', ');
    }

    /**
     * @param {string} text
     * @param {string} label
     * @private
     */
    _errorDialog (text, label = 'Error')
    {
        const
            wrapper = this._doc.createElement('wrapper'),
            dialog = this._el.ZG.dialogArr.find(d => d.type === 'view-error');

        wrapper.innerHTML = dialog.body;
        wrapper.querySelector('p').innerText = text;
        dialog.body = wrapper.innerHTML;
        this._el.customizeDialog('view-error', {label});
        this._el.ZG.oDOMDialog.setDialog('view-error');
    }

    /**
     * @param {string} text
     * @param {boolean|function} cancel
     * @param {string} label
     * @private
     */
    _warnDialog (text, cancel = false, label = 'Warning')
    {
        const
            callback = typeof cancel === 'function' ? cancel.bind(this) : false,
            wrapper = this._doc.createElement('wrapper'),
            dialogWarn = this._el.ZG.dialogArr.find(d => d.type === 'view-warn');

        wrapper.innerHTML = dialogWarn.body;
        wrapper.querySelector('p').innerText = text;
        dialogWarn.body = wrapper.innerHTML;
        dialogWarn.cancel.show = cancel === true || callback;

        callback && this._el.oDOMDialog.$confirm.addEventListener('click', callback, {once: true});

        this._el.customizeDialog('view-warn', {label});
        this._el.ZG.oDOMDialog.setDialog('view-warn');
    }

    /**
     * @private
     */
    _fixDialog ()
    {
        const
            wrapper = this._doc.createElement('wrapper'),
            dialogRecordDelete = this._el.ZG.dialogArr.find(d => d.type === 'record-delete');

        wrapper.innerHTML = dialogRecordDelete.body;
        wrapper.querySelector('p').innerText = 'Are you sure you want to delete this version?';
        dialogRecordDelete.body = wrapper.innerHTML;

        this._el.querySelector('zg-dialog').$form.style.overflow = 'hidden';
        this._el.customizeDialog('record-update', {label: 'Update tags'});
    }

    /**
     * @param {object} event
     * @return {Promise<boolean>}
     * @private
     */
    async _beforeDeleteRecordData (event)
    {
        const data = event.detail.ZGData.data;

        try {
            const {status} = await fetch(`/-/pacman/api/${data.name}/version/${data.version}`, {method: 'DELETE'});

            this._el.refresh();

            if (status === 422) {
                setTimeout(() => this._errorDialog('Cant delete version, protected tags assigned!'), 500);
            }
            return false;
        } catch (err) {
            return false;
        }
    }

    /**
     * @param {object} event
     * @return {Promise}
     * @private
     */
    async _beforeChangeRecordData (event)
    {
        const
            rawData = event.detail.ZGData,
            before = rawData.oldData.tags.replace(/\s/g, '').split(','),
            protectedTags = before.filter(tag => this._opts.protectedTags.includes(tag)),
            after = rawData.data.tags.replace(/\s/g, '').split(','),
            tags = after.concat(protectedTags);

        event.detail.ZGData.data.tags = tags.join(', ');

        if (tags.length !== before.length || !tags.every(tag => before.includes(tag))) {
            try {
                const {status} = await fetch(`/-/pacman/api/${rawData.data.name}/${rawData.data.version}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({tags})
                });

                this._el.refresh();

                if (status === 409) {
                    setTimeout(() => this._errorDialog('Cant remove protected tags!'), 500);
                }
            } catch (err) {
                this._el.widget.statusManager.setStatus({msg: 'Error while updating tags'});
            }
        }

        return event;
    }

    /**
     * @param {object} event
     * @return {Promise}
     * @private
     */
    async _tagDeleteHandler (event)
    {
        const
            elem = event.detail,
            deleteTag = elem.closest('li').dataset.tag,
            rowIndex = elem.closest('zg-row').rowIndex,
            data = this._el.row(rowIndex).getData();

        try {
            const {status} = await fetch(`/-/pacman/api/${data.name}/tag/${deleteTag}`, {method: 'DELETE'});

            this._el.refresh();

            if (status === 409) {
                setTimeout(() => this._errorDialog('Cant remove protected tags!'), 500);
            }
        } catch (err) {
            this._main.widget.statusManager.setStatus({msg: ERROR_MSG});
        }
    }
}

export default PackageGrid;