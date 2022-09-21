import buttonIcon from './svg/button-icon.svg';

/**
 * Class for working with UI:
 *  - rendering base structure
 *  - show/hide preview
 *  - apply tune view
 */
export default class Ui {
    /**
     * @param {object} ui - image tool Ui module
     * @param {object} ui.api - Editor.js API
     * @param {ImageConfig} ui.config - user config
     * @param {Function} ui.onSelectFile - callback for clicks on Select file button
     * @param {boolean} ui.readOnly - read-only mode flag
     */
    constructor({api, config, onSelectFile, readOnly}) {
        this.api = api;
        this.config = config;
        this.onSelectFile = onSelectFile;
        this.readOnly = readOnly;
        this.nodes = {
            wrapper: make('div', [this.CSS.baseClass, this.CSS.wrapper]),
            listContainer: make('div', [this.CSS.listContainer]),
            uploaderContainer: make('div', [this.CSS.uploaderContainer]),
            imageContainer: make('div', [this.CSS.imageContainer]),
            fileButton: this.createFileButton(),
            // imageElement: undefined,
            imagePreloader: make('div', this.CSS.imagePreloader),
            // caption: make('div', [this.CSS.input, this.CSS.caption], { contentEditable: !this.readOnly, }),
        };

        this.nodes.uploaderContainer.appendChild(this.nodes.imageContainer);
        this.nodes.uploaderContainer.appendChild(this.nodes.fileButton);

        this.nodes.wrapper.appendChild(this.nodes.listContainer);
        this.nodes.wrapper.appendChild(this.nodes.uploaderContainer);
    }

    /**
     * CSS classes
     *
     * @returns {object}
     */
    get CSS() {
        return {
            baseClass: this.api.styles.block,
            loading: this.api.styles.loader,
            input: this.api.styles.input,
            button: this.api.styles.button,

            /**
             * Tool's classes
             */
            wrapper: 'image-list-tool',
            listContainer: 'image-list-tool__list-container',
            uploaderContainer: 'image-list-tool__uploader-container',
            imageContainer: 'image-list-tool__image',
            imageRemoveButton: 'image-list-tool__image__remove-button',
            imagePreloader: 'image-list-tool__image-preloader',
            imageElementContainer: 'image-list-tool__image-picture-container',
            imageElement: 'image-list-tool__image-picture',
            caption: 'image-list-tool__caption',
            sortable: 'image-list-tool__sortable',
            sortableCurrent: 'image-list-tool__sortable-current',
            sortableHint: 'image-list-tool__sortable-hint',
            sortableActive: 'image-list-tool__sortable-active',
        };
    };

    /**
     * Ui statuses:
     * - empty
     * - uploading
     * - filled
     *
     * @returns {{EMPTY: string, UPLOADING: string, FILLED: string}}
     */
    static get status() {
        return {
            EMPTY: 'empty',
            UPLOADING: 'loading',
            FILLED: 'filled',
        };
    }

    /**
     * Renders tool UI
     *
     * @param {ImageListToolData} toolData - saved tool data
     * @returns {Element}
     */
    render(toolData) {
        if (!toolData.file || Object.keys(toolData.file).length === 0) {
            this.toggleStatus(Ui.status.EMPTY);
        } else {
            this.toggleStatus(Ui.status.UPLOADING);
        }

        return this.nodes.wrapper;
    }

    renderItem(item, hash, mode) {
        const {url} = item.file;

        let isImageContainerExist = false;
        let imageContainer;

        if (typeof hash !== undefined) {
            imageContainer = this.nodes.wrapper.querySelector(`.${this.CSS.imageContainer}[data-hash='${hash}']`);
        }

        if (imageContainer) {
            isImageContainerExist = true;
        }

        if (!isImageContainerExist) {
            imageContainer = make('div', [this.CSS.imageContainer]);
            this.nodes.listContainer.appendChild(imageContainer);
        }

        if (mode === 'preload' && typeof hash !== undefined) {
            imageContainer.dataset.hash = hash;

            const imagePreloader = make('div', this.CSS.imagePreloader);
            imagePreloader.style.backgroundImage = `url(${url})`;

            const imageElementContainer = make('div', [this.CSS.imageElementContainer]);
            imageElementContainer.appendChild(imagePreloader);

            imageContainer.append(imageElementContainer);

        } else {
            imageContainer.innerHTML = '';
            imageContainer.dataset.hash = '-';
            imageContainer.dataset.item = JSON.stringify(item);

            const caption = make('div', [this.CSS.input, this.CSS.caption], {
                contentEditable: !this.readOnly,
                innerHTML: item.caption || '',
            });
            caption.dataset.placeholder = this.config.captionPlaceholder;

            const attributes = {
                src: url,
            };

            const removeButton = make('div', [this.CSS.imageRemoveButton]);
            removeButton.addEventListener('click', () => {
                imageContainer.remove();
            });

            /**
             * Compose tag with defined attributes
             *
             * @type {Element}
             */
            const imageElement = make('img', this.CSS.imageElement, attributes);

            /**
             * Add load event listener
             */
            imageElement.addEventListener('load', () => {

            });

            const imageElementContainer = make('div', [this.CSS.imageElementContainer]);
            imageElementContainer.appendChild(removeButton);
            imageElementContainer.appendChild(imageElement);
            imageContainer.appendChild(imageElementContainer);
            imageContainer.appendChild(caption);
        }

        this.initSorting(this.nodes.listContainer);
    }

    preloadItem(url, hash) {
        this.renderItem({file: {url}}, hash, 'preload')
    }

    /**
     * Creates upload-file button
     *
     * @returns {Element}
     */
    createFileButton() {
        const button = make('div', [this.CSS.button]);

        button.innerHTML = this.config.buttonContent || `${buttonIcon} ${this.api.i18n.t('Select an Image')}`;

        button.addEventListener('click', () => {
            this.onSelectFile();
        });

        return button;
    }

    /**
     * Shows uploading preloader
     *
     * @param {string} src - preview source
     * @param {string} hash - item hash
     * @returns {void}
     */
    showPreloader(src, hash) {
        this.renderItem({
            caption: '',
            file: {
                url: src
            }
        }, hash);
    }

    /**
     * Hide uploading preloader
     *
     * @returns {void}
     */
    hidePreloader() {
    }

    /**
     * Changes UI status
     *
     * @param {string} status - see {@link Ui.status} constants
     * @returns {void}
     */
    toggleStatus(status) {
        /*
        for (const statusType in Ui.status) {
            if (Object.prototype.hasOwnProperty.call(Ui.status, statusType)) {
                this.nodes.wrapper.classList.toggle(`${this.CSS.wrapper}--${Ui.status[statusType]}`, status === Ui.status[statusType]);
            }
        } */
    }

    /**
     * Apply visual representation of activated tune
     *
     * @param {string} tuneName - one of available tunes {@link Tunes.tunes}
     * @param {boolean} status - true for enable, false for disable
     * @returns {void}
     */
    applyTune(tuneName, status) {
        this.nodes.wrapper.classList.toggle(`${this.CSS.wrapper}--${tuneName}`, status);
    }

    initSorting() {
        const target = this.nodes.listContainer;
        // (A) SET CSS + GET ALL LIST ITEMS
        target.classList.add(this.CSS.sortable);
        let items = target.querySelectorAll(`.${this.CSS.imageContainer}`),
            current = null;

        // (B) MAKE ITEMS DRAGGABLE + SORTABLE
        for (let i of items) {
            // (B1) ATTACH DRAGGABLE
            i.draggable = true;

            // (B2) DRAG START - YELLOW HIGHLIGHT DROPZONES
            i.ondragstart = (ev) => {
                current = i;
                current.classList.add(this.CSS.sortableCurrent);
                for (let it of items) {
                    if (it !== current) {
                        it.classList.add(this.CSS.sortableHint);
                    }
                }
            };

            // (B3) DRAG ENTER - RED HIGHLIGHT DROPZONE
            i.ondragenter = (ev) => {
                if (i !== current) {
                    i.classList.add(this.CSS.sortableActive);
                }
            };

            // (B4) DRAG LEAVE - REMOVE RED HIGHLIGHT
            i.ondragleave = () => {
                i.classList.remove(this.CSS.sortableActive);
            };

            // (B5) DRAG END - REMOVE ALL HIGHLIGHTS
            i.ondragend = () => {
                for (let it of items) {
                    it.classList.remove(this.CSS.sortableHint);
                    it.classList.remove(this.CSS.sortableActive);
                    it.classList.remove(this.CSS.sortableCurrent);
                }
            };

            // (B6) DRAG OVER - PREVENT THE DEFAULT "DROP", SO WE CAN DO OUR OWN
            i.ondragover = (evt) => {
                evt.preventDefault();
            };

            // (B7) ON DROP - DO SOMETHING
            i.ondrop = (evt) => {
                // evt.preventDefault();
                if (i !== current) {
                    let currentPos = 0, droppedPos = 0;
                    for (let it = 0; it < items.length; it++) {
                        if (current === items[it]) {
                            currentPos = it;
                        }
                        if (i === items[it]) {
                            droppedPos = it;
                        }
                    }

                    if (currentPos < droppedPos) {
                        i.parentNode.insertBefore(current, i.nextSibling);
                    } else {
                        i.parentNode.insertBefore(current, i);
                    }

                    items = target.querySelectorAll(`.${this.CSS.imageContainer}`)
                }
            };
        }
    }
}

/**
 * Helper for making Elements with attributes
 *
 * @param  {string} tagName           - new Element tag name
 * @param  {Array|string} classNames  - list or name of CSS class
 * @param  {object} attributes        - any attributes
 * @returns {Element}
 */
export const make = function make(tagName, classNames = null, attributes = {}) {
    const el = document.createElement(tagName);

    if (Array.isArray(classNames)) {
        el.classList.add(...classNames);
    } else if (classNames) {
        el.classList.add(classNames);
    }

    for (const attrName in attributes) {
        el[attrName] = attributes[attrName];
    }

    return el;
};
