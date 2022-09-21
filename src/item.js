import buttonIcon from './svg/button-icon.svg';
import Ui from "./ui";
import {make} from "./ui";

/**
 * Class for working with UI:
 *  - rendering base structure
 *  - show/hide preview
 *  - apply tune view
 */
export default class Item {
    /**
     * @param {Ui} ui - image tool Ui module
     * @param {object} ui.api - Editor.js API
     * @param {object} ui.css - Plugin CSS
     * @param {Uploader} uploader - Editor.js API
     * @param {File} file - Uploading file
     * @param {object} item - Uploaded item
     */
    constructor({ui, uploader, file, item}) {
        this.ui = ui;
        this.uploader = uploader;
        this.file = file;
        this.item = item;
        this.wasRendered = false;
        this.nodes = {
            imageContainer: make('div', [this.ui.CSS.imageContainer]),
            imagePreloader: make('div', this.ui.CSS.imagePreloader),
            imageElementContainer: make('div', this.ui.CSS.imageElementContainer),
            imageElement: make('img', this.ui.CSS.imageElement),
            caption: make('div', [this.ui.CSS.input, this.ui.CSS.caption], {
                contentEditable: true,
                innerHTML: '',
            }),
            removeButton: make('div', [this.ui.CSS.imageRemoveButton])
        };
    }

    /**
     *
     * @param {File} file
     * @param {function} callback
     */
    previewFile(file, callback)  {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            callback(e.target.result);
        };
    };

    render() {

        if (!this.item && this.file) {
            // File preload
            [...this.nodes.imageContainer.childNodes].forEach(el => el.remove());
            this.nodes.imageContainer.dataset.uploading = 1;
            this.nodes.imageElementContainer.appendChild(this.nodes.imagePreloader);
            this.nodes.imageContainer.append(this.nodes.imageElementContainer);
            this.previewFile(this.file, (url) => {
                this.nodes.imagePreloader.style.backgroundImage = `url(${url})`;
            })
        } else {
            // File uploaded
            [...this.nodes.imageContainer.childNodes].forEach(el => el.remove());

            this.nodes.imagePreloader.remove();

            this.nodes.imageContainer.dataset.uploading = 0;
            this.nodes.imageContainer.dataset.item = JSON.stringify(this.item);

            // Caption
            this.nodes.caption.innerHTML = this.item.caption || '';
            this.nodes.caption.dataset.placeholder = this.ui.config.captionPlaceholder;
            // Remove button
            this.nodes.removeButton.addEventListener('click', () => {
                this.nodes.imageContainer.remove();
            });
            // Image
            this.nodes.imageElement.src = this.item.file.url;
            this.nodes.imageElement.addEventListener('load', () => {
                // Some logic
            });
            // Build final structure
            this.nodes.imageElementContainer.appendChild(this.nodes.removeButton);
            this.nodes.imageElementContainer.appendChild(this.nodes.imageElement);
            this.nodes.imageContainer.appendChild(this.nodes.imageElementContainer);
            this.nodes.imageContainer.appendChild(this.nodes.caption);
        }

        if (!this.wasRendered) {
            this.ui.nodes.listContainer.appendChild(this.nodes.imageContainer);
            this.wasRendered = true;
        }

        this.ui.initSorting();
    }

}