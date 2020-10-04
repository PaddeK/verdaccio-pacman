/* global document, CustomEvent */

class TagType
{
    /**
     * @return {string}
     * @constructor
     */
    static get TYPE ()
    {
        return 'tag';
    }

    /**
     * @param {object} options
     * @param {string} mRawData
     * @return {Node}
     */
    static renderer (options, mRawData)
    {
        const
            data = Array.isArray(mRawData) ? mRawData : (mRawData || '').replace(/\s/g, '').split(',').filter(Boolean),
            tpl = document.createElement('template');

        data.sort((a, b) => {
            const
                aProtected = options.protectedTags.includes(a),
                bProtected = options.protectedTags.includes(b);

            return aProtected ^ bProtected ? ~~bProtected - ~~aProtected : a.localeCompare(b);
        });

        tpl.innerHTML =
            `<ul>
                ${data.map(tag =>
                    `<li data-tag="${tag}">
                        <span class="text">${tag}</span>
                        ${options.protectedTags.includes(tag) ? '' : '<span class="close">x</span>'} 
                    </li>`
                ).join('')}
            </ul>`;

        const html = tpl.content.cloneNode(true);

        Array.from(html.querySelectorAll('span.close')).forEach(el => {
            const event = new CustomEvent('tagdelete', {detail: el});
            el.addEventListener('click', () => el.closest('zing-grid').dispatchEvent(event));
        });

        return html;
    }
}

export default TagType;