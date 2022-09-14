/**
 * Image Tool for the Editor.js
 *
 * @author CodeX <team@codex.so>
 * @license MIT
 * @see {@link https://github.com/editor-js/image}
 *
 * To developers.
 * To simplify Tool structure, we split it to 4 parts:
 *  1) index.js — main Tool's interface, public API and methods for working with data
 *  2) uploader.js — module that has methods for sending files via AJAX: from device, by URL or File pasting
 *  3) ui.js — module for UI manipulations: render, showing preloader, etc
 *  4) tunes.js — working with Block Tunes: render buttons, handle clicks
 *
 * For debug purposes there is a testing server
 * that can save uploaded files and return a Response {@link UploadResponseFormat}
 *
 *       $ node dev/server.js
 *
 * It will expose 8008 port, so you can pass http://localhost:8008 with the Tools config:
 *
 * image: {
 *   class: ImageListTool,
 *   config: {
 *     endpoints: {
 *       byFile: 'http://localhost:8008/uploadFile',
 *       byUrl: 'http://localhost:8008/fetchUrl',
 *     }
 *   },
 * },
 */

/**
 * @typedef {object} ImageListToolData
 * @description Image Tool's input and output data format
 * @property {ImageListItem[]} items — image caption
 */

/**
 * @typedef {object} ImageListItem
 * @description Image Tool's input and output data format
 * @property {string} caption — image caption
 * @property {object} file — Image file data returned from backend
 * @property {string} file.url — image URL
 */

// eslint-disable-next-line
import css from './index.scss';
import Ui from './ui';
import Tunes from './tunes';
import ToolboxIcon from './svg/toolbox.svg';
import Uploader from './uploader';

/**
 * @typedef {object} ImageConfig
 * @description Config supported by Tool
 * @property {object} endpoints - upload endpoints
 * @property {string} endpoints.byFile - upload by file
 * @property {string} endpoints.byUrl - upload by URL
 * @property {string} field - field name for uploaded image
 * @property {string} types - available mime-types
 * @property {string} captionPlaceholder - placeholder for Caption field
 * @property {object} additionalRequestData - any data to send with requests
 * @property {object} additionalRequestHeaders - allows to pass custom headers with Request
 * @property {string} buttonContent - overrides for Select File button
 * @property {object} [uploader] - optional custom uploader
 * @property {function(File): Promise.<UploadResponseFormat>} [uploader.uploadByFile] - method that upload image by File
 * @property {function(string): Promise.<UploadResponseFormat>} [uploader.uploadByUrl] - method that upload image by URL
 */

/**
 * @typedef {object} UploadResponseFormat
 * @description This format expected from backend on file uploading
 * @property {number} success - 1 for successful uploading, 0 for failure
 * @property {object} file - Object with file data.
 *                           'url' is required,
 *                           also can contain any additional data that will be saved and passed back
 * @property {string} file.url - [Required] image source URL
 */
export default class ImageListTool {
  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: `<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16.723 9.602V5.997c0-.95-.77-1.72-1.72-1.72H5.997c-.95 0-1.72.77-1.72 1.72v2.138L7.676 5.9l4.067 3.624 2.868-1.475 2.112 1.554Zm-.017 2.611-2.14-1.53-2.849 1.512L7.63 8.809l-3.353 2.004v1.154c0 .95.77 1.72 1.72 1.72h9.006a1.72 1.72 0 0 0 1.703-1.474ZM5.997 2h9.006A3.997 3.997 0 0 1 19 5.997v5.97a3.997 3.997 0 0 1-3.997 3.997H5.997A3.997 3.997 0 0 1 2 11.967v-5.97A3.997 3.997 0 0 1 5.997 2Z" fill="#000"/><path d="M16.723 9.602V5.997c0-.95-.77-1.72-1.72-1.72H5.997c-.95 0-1.72.77-1.72 1.72v2.138L7.676 5.9l4.067 3.624 2.868-1.475 2.112 1.554Zm-.017 2.611-2.14-1.53-2.849 1.512L7.63 8.809l-3.353 2.004v1.154c0 .95.77 1.72 1.72 1.72h9.006a1.72 1.72 0 0 0 1.703-1.474ZM5.997 2h9.006A3.997 3.997 0 0 1 19 5.997v5.97a3.997 3.997 0 0 1-3.997 3.997H5.997A3.997 3.997 0 0 1 2 11.967v-5.97A3.997 3.997 0 0 1 5.997 2Z" stroke="#fff"/><mask id="a" maskUnits="userSpaceOnUse" x="4" y="7" width="19" height="16" fill="#000"><path fill="#fff" d="M4 7h19v16H4z"/><path d="M19.723 15.601v-3.604c0-.95-.77-1.72-1.72-1.72H8.997c-.95 0-1.72.77-1.72 1.72v2.138l3.399-2.236 4.067 3.624 2.868-1.474 2.112 1.553Zm-.017 2.612-2.14-1.53-2.849 1.512-4.087-3.386-3.353 2.004v1.154c0 .95.77 1.72 1.72 1.72h9.006a1.72 1.72 0 0 0 1.703-1.474ZM8.997 8h9.006A3.997 3.997 0 0 1 22 11.997v5.97a3.997 3.997 0 0 1-3.997 3.997H8.997A3.997 3.997 0 0 1 5 17.967v-5.97A3.997 3.997 0 0 1 8.997 8Z"/><path d="m17.5 13.5 1 .5.5-1-.5-2H8v2l3-1.5 4 3.5 2.5-1.5ZM8 18.5l1.5 1 9-.5v-1l-1-.5-1.5.5-2 .5-3-3L8 17v1.5Z"/></mask><path d="M19.723 15.601v-3.604c0-.95-.77-1.72-1.72-1.72H8.997c-.95 0-1.72.77-1.72 1.72v2.138l3.399-2.236 4.067 3.624 2.868-1.474 2.112 1.553Zm-.017 2.612-2.14-1.53-2.849 1.512-4.087-3.386-3.353 2.004v1.154c0 .95.77 1.72 1.72 1.72h9.006a1.72 1.72 0 0 0 1.703-1.474ZM8.997 8h9.006A3.997 3.997 0 0 1 22 11.997v5.97a3.997 3.997 0 0 1-3.997 3.997H8.997A3.997 3.997 0 0 1 5 17.967v-5.97A3.997 3.997 0 0 1 8.997 8Z" fill="#000"/><path d="m17.5 13.5 1 .5.5-1-.5-2H8v2l3-1.5 4 3.5 2.5-1.5ZM8 18.5l1.5 1 9-.5v-1l-1-.5-1.5.5-2 .5-3-3L8 17v1.5Z" fill="#fff"/><path d="m19.723 15.601-.592.806a1 1 0 0 0 1.592-.806h-1ZM7.277 14.136h-1a1 1 0 0 0 1.55.836l-.55-.836Zm3.399-2.236.665-.746a1 1 0 0 0-1.215-.089l.55.835Zm4.067 3.624-.665.747a1 1 0 0 0 1.123.142l-.458-.89Zm2.868-1.474.593-.806a1 1 0 0 0-1.05-.084l.457.89Zm2.095 4.164.99.142a1 1 0 0 0-.409-.955l-.581.813Zm-2.14-1.53.581-.813a1 1 0 0 0-1.05-.07l.469.883Zm-2.849 1.512-.638.77a1 1 0 0 0 1.107.113l-.469-.883Zm-4.087-3.386.638-.77a1 1 0 0 0-1.15-.088l.512.858Zm-3.353 2.004-.513-.858a1 1 0 0 0-.487.858h1ZM18.5 14l-.447.894.894.448.447-.895L18.5 14Zm-1-.5.447-.894-.49-.246-.472.283.515.857ZM15 15l-.659.753.549.48.624-.376L15 15Zm-4-3.5.659-.753-.506-.442-.6.3.447.895ZM8 13H7v1.618l1.447-.724L8 13Zm0-2v-1H7v1h1Zm10.5 0 .97-.242-.19-.758h-.78v1Zm.5 2 .894.447.166-.33-.09-.36L19 13Zm-9.5 6.5-.555.832.278.185.332-.018L9.5 19.5Zm-1.5-1H7v.535l.445.297L8 18.5ZM8 17l-.447-.894-.553.276V17h1Zm3-1.5.707-.707-.51-.51-.644.323.447.894Zm3 3-.707.707.4.4.55-.137L14 18.5Zm2-.5.242.97.038-.01.036-.011L16 18Zm1.5-.5.447-.894-.37-.186-.393.131.316.949Zm1 .5h1v-.618l-.553-.276L18.5 18Zm0 1 .055.998.945-.052V19h-1Zm2.223-3.399v-3.604h-2v3.604h2Zm0-3.604a2.72 2.72 0 0 0-2.72-2.72v2a.72.72 0 0 1 .72.72h2Zm-2.72-2.72H8.997v2h9.006v-2Zm-9.006 0a2.72 2.72 0 0 0-2.72 2.72h2a.72.72 0 0 1 .72-.72v-2Zm-2.72 2.72v2.138h2v-2.138h-2Zm1.55 2.974 3.398-2.236-1.099-1.671L6.727 13.3l1.1 1.67Zm2.184-2.325 4.067 3.623 1.33-1.493-4.067-3.623-1.33 1.493Zm5.19 3.766 2.868-1.474-.915-1.779-2.868 1.474.915 1.78Zm1.818-1.558 2.112 1.553 1.185-1.611-2.112-1.553-1.185 1.611Zm3.268 2.546-2.14-1.53-1.163 1.627 2.14 1.53 1.163-1.627Zm-3.19-1.6-2.849 1.512.938 1.766 2.848-1.512-.937-1.766Zm-1.742 1.625-4.087-3.386-1.276 1.54 4.087 3.386 1.276-1.54Zm-5.238-3.474-3.353 2.004L7.79 17.67l3.353-2.004-1.026-1.716Zm-3.84 2.862v1.154h2v-1.154h-2Zm0 1.154a2.72 2.72 0 0 0 2.72 2.72v-2a.72.72 0 0 1-.72-.72h-2Zm2.72 2.72h9.006v-2H8.997v2Zm9.006 0a2.72 2.72 0 0 0 2.693-2.332l-1.98-.284a.72.72 0 0 1-.713.616v2ZM8.997 9h9.006V7H8.997v2Zm9.006 0A2.997 2.997 0 0 1 21 11.997h2A4.997 4.997 0 0 0 18.003 7v2ZM21 11.997v5.97h2v-5.97h-2Zm0 5.97a2.997 2.997 0 0 1-2.997 2.997v2A4.997 4.997 0 0 0 23 17.967h-2Zm-2.997 2.997H8.997v2h9.006v-2Zm-9.006 0A2.997 2.997 0 0 1 6 17.967H4a4.997 4.997 0 0 0 4.997 4.997v-2ZM6 17.967v-5.97H4v5.97h2Zm0-5.97A2.997 2.997 0 0 1 8.997 9V7A4.997 4.997 0 0 0 4 11.997h2Zm12.947 1.109-1-.5-.894 1.788 1 .5.894-1.788Zm-1.962-.463-2.5 1.5 1.03 1.714 2.5-1.5-1.03-1.714Zm-1.326 1.604-4-3.5-1.318 1.506 4 3.5 1.318-1.506Zm-5.106-3.641-3 1.5.894 1.788 3-1.5-.894-1.788ZM9 13v-2H7v2h2Zm8.53-1.758.5 2 1.94-.485-.5-2-1.94.486Zm.576 1.31-.5 1 1.788.895.5-1-1.788-.894Zm-8.051 6.116-1.5-1-1.11 1.664 1.5 1 1.11-1.664ZM9 18.5V17H7v1.5h2Zm1.293-2.293 3 3 1.414-1.414-3-3-1.414 1.414Zm3.95 3.263 2-.5-.485-1.94-2 .5.485 1.94Zm2.073-.521 1.5-.5-.632-1.898-1.5.5.632 1.898Zm.737-.555 1 .5.894-1.788-1-.5-.894 1.788ZM17.5 18v1h2v-1h-2Zm.945.002-9 .5.11 1.997 9-.5-.11-1.997ZM8 12h10.5v-2H8v2Zm.447 5.894 3-1.5-.894-1.788-3 1.5.894 1.788Z" fill="#fff" mask="url(#a)"/></svg>`,
      title: 'Image List',
    };
  }

  /**
   * @param {object} tool - tool properties got from editor.js
   * @param {ImageListToolData} tool.data - previously saved data
   * @param {ImageConfig} tool.config - user config for Tool
   * @param {object} tool.api - Editor.js API
   * @param {boolean} tool.readOnly - read-only mode flag
   */
  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;

    /**
     * Tool's initial config
     */
    this.config = {
      endpoints: config.endpoints || '',
      additionalRequestData: config.additionalRequestData || {},
      additionalRequestHeaders: config.additionalRequestHeaders || {},
      field: config.field || 'image',
      types: config.types || 'image/*',
      captionPlaceholder: this.api.i18n.t(config.captionPlaceholder || 'Caption'),
      buttonContent: config.buttonContent || '',
      uploader: config.uploader || undefined,
      actions: config.actions || [],
    };

    /**
     * Module for file uploading
     */
    this.uploader = new Uploader({
      config: this.config,
      onUpload: (response) => this.onUpload(response),
      onError: (error) => this.uploadingFailed(error),
    });

    /**
     * Module for working with UI
     */
    this.ui = new Ui({
      api,
      config: this.config,
      onSelectFile: () => {
        this.uploader.uploadSelectedFile({
          onPreview: (src) => {
            this.ui.showPreloader(src);
          },
        });
      },
      readOnly,
    });

    /**
     * Module for working with tunes
     */
    this.tunes = new Tunes({
      api,
      actions: this.config.actions,
      onChange: (tuneName) => this.tuneToggled(tuneName),
    });

    /**
     * Set saved state
     */
    this._data = {
      items: []
    };
    this.data = data || { items: [] };
  }

  /**
   * Renders Block content
   *
   * @public
   *
   * @returns {HTMLDivElement}
   */
  render() {
    return this.ui.render(this.data);
  }

  /**
   * Validate data: check if Image exists
   *
   * @param {ImageListToolData} savedData — data received after saving
   * @returns {boolean} false if saved data is not correct, otherwise true
   * @public
   */
  validate(savedData) {
    return savedData.items && savedData.items.length > 0;
  }

  /**
   * Return Block data
   *
   * @public
   *
   * @returns {ImageListToolData}
   */
  save() {
    // const caption = this.ui.nodes.caption;

    // this._data.caption = caption.innerHTML;

    const imageContainers = document.querySelectorAll(`.${this.ui.CSS.imageContainer}`);
    this._data.items = [];
    for (let i = 0; i < imageContainers.length; i++) {
      let imageContainer = imageContainers[i];
      if (imageContainer.dataset.item) {
        let caption = imageContainer.querySelector(`.${this.ui.CSS.caption}`);
        let item = JSON.parse(imageContainer.dataset.item);
        item.caption = caption.innerHTML;
        this._data.items.push(item);
      }
    }

    return this.data;
  }

  /**
   * Makes buttons with tunes: add background, add border, stretch image
   *
   * @public
   *
   * @returns {Element}
   */
  renderSettings() {
    // return this.tunes.render(this.data);
  }

  /**
   * Fires after clicks on the Toolbox Image Icon
   * Initiates click on the Select File button
   *
   * @public
   */
  appendCallback() {
    // this.ui.nodes.fileButton.click();
  }

  /**
   * Specify paste substitutes (disabled)
   *
   * @see {@link https://github.com/codex-team/editor.js/blob/master/docs/tools.md#paste-handling}
   * @returns {{tags: string[], patterns: object<string, RegExp>, files: {extensions: string[], mimeTypes: string[]}}}
   */
  static get pasteConfig() {
    return {};
  }

  /**
   * Specify paste handlers
   *
   * @public
   * @see {@link https://github.com/codex-team/editor.js/blob/master/docs/tools.md#paste-handling}
   * @param {CustomEvent} event - editor.js custom paste event
   *                              {@link https://github.com/codex-team/editor.js/blob/master/types/tools/paste-events.d.ts}
   * @returns {void}
   */
  async onPaste(event) {

  }

  /**
   * Private methods
   * ̿̿ ̿̿ ̿̿ ̿'̿'\̵͇̿̿\з= ( ▀ ͜͞ʖ▀) =ε/̵͇̿̿/’̿’̿ ̿ ̿̿ ̿̿ ̿̿
   */

  /**
   * Stores all Tool's data
   *
   * @private
   *
   * @param {ImageListToolData} data - data in Image Tool format
   */
  set data(data) {
    const items = data.items || [];
    this.items = items;
    items.forEach(item => this.ui.renderItem(item));
  }

  /**
   * Return Tool data
   *
   * @private
   *
   * @returns {ImageListToolData}
   */
  get data() {
    return this._data;
  }

  /**
   * Add new image file
   *
   * @private
   *
   * @param {{url: string}} file - uploaded file data
   */
  set image(file) {
    if (file && file.url) {

      const item = {
        caption: '',
        file
      };
      this._data.items.push(item);
      this.items = this._data.items;
      this.ui.renderItem(item);
    }
  }

  /**
   *
   * @param {object[]} items
   */
  set items(items) {
    this._data.items = items;
  }

  /**
   * File uploading callback
   *
   * @private
   *
   * @param {UploadResponseFormat} response - uploading server response
   * @returns {void}
   */
  onUpload(response) {
    if (response.success && response.file) {
      this.image = response.file;
    } else {
      this.uploadingFailed('incorrect response: ' + JSON.stringify(response));
    }
  }

  /**
   * Handle uploader errors
   *
   * @private
   * @param {string} errorText - uploading error text
   * @returns {void}
   */
  uploadingFailed(errorText) {
    this.api.notifier.show({
      message: this.api.i18n.t('Couldn’t upload image. Please try another.'),
      style: 'error',
    });
    this.ui.hidePreloader();
  }

  /**
   * Callback fired when Block Tune is activated
   *
   * @private
   *
   * @param {string} tuneName - tune that has been clicked
   * @returns {void}
   */
  tuneToggled(tuneName) {
    // inverse tune state
    this.setTune(tuneName, !this._data[tuneName]);
  }

  /**
   * Set one tune
   *
   * @param {string} tuneName - {@link Tunes.tunes}
   * @param {boolean} value - tune state
   * @returns {void}
   */
  setTune(tuneName, value) {
    this._data[tuneName] = value;

    this.ui.applyTune(tuneName, value);

    if (tuneName === 'stretched') {
      /**
       * Wait until the API is ready
       */
      Promise.resolve().then(() => {
        const blockId = this.api.blocks.getCurrentBlockIndex();

        this.api.blocks.stretchBlock(blockId, value);
      })
        .catch(err => {
          console.error(err);
        });
    }
  }

  /**
   * Show preloader and upload image file
   *
   * @param {File} file - file that is currently uploading (from paste)
   * @returns {void}
   */
  uploadFile(file) {
    this.uploader.uploadByFile(file, {
      onPreview: (src) => {
        this.ui.showPreloader(src);
      },
    });
  }

  /**
   * Show preloader and upload image by target url
   *
   * @param {string} url - url pasted
   * @returns {void}
   */
  uploadUrl(url) {
    this.ui.showPreloader(url);
    this.uploader.uploadByUrl(url);
  }
}
