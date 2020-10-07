
const ERROR_MSG = 'The server encountered an error and the data could not be red';

class ListGrid
{
    /**
     * @param {object} doc
     * @param {string} mainId
     * @param {string} childId
     * @param {object} options
     */
    constructor (doc, mainId, childId, options)
    {
        this._el = doc.querySelector(mainId);
        this._child = doc.querySelector(childId);
        this._doc = doc;

        this._el.setPageSize(options.pageSize);
        this._el.executeOnLoad(() => this._el.addEventListener('record:click', this._onRecordClick.bind(this)));
    }

    /**
     * @param {object} event
     * @return {Promise<void>}
     * @private
     */
    async _onRecordClick (event)
    {
        if (event.detail.ZGData.isHeader) {
            return;
        }

        try {
            const {name} = event.detail.ZGData.data;

            this._doc.getElementById('childCaptionText').textContent = name;

            this._child.setSrc(`/-/pacman/api/${name}?_nc=${Math.round(Math.random() * 9999) + 10000}`);
            [this._el, this._child].forEach(grid => grid.classList.toggle('active'));
        } catch (err) {
            this._el.widget.statusManager.setStatus({msg: ERROR_MSG});
        }
    }
}

export default ListGrid;