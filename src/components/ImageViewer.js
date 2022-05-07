import { LitElement, html, css } from "lit";
import { when } from "lit-html/directives/when.js";

export class ImageViewer extends LitElement {
  static get styles() {
    return css`
      :host {
        position: absolute;
      }

      :host(.hasMouse) {
        bottom: 4px;
        left: 4px;
      }

      :host(:not(.hasMouse)) {
        top: 4px;
        right: 4px;
      }

      .container {
        background-color: #414952;
        border: 1px solid #8699a6;
        border-radius: 2px;

        margin: 0;
        padding: 0;

        cursor: pointer;
      }

      .container img {
        width: 100%;
        height: 100%;
      }

      .container.small {
        width: 150px;
        height: 100px;
      }

      .container.medium {
        width: 300px;
        height: 200px;
      }

      .container.large {
        width: 600px;
        height: 400px;
      }
    `;
  }

  static properties = {
    src: { type: String },
    _size: { type: String, state: true, reflect: true },
  };

  static #imageSizeValues = Object.freeze(["small", "medium", "large"]);

  constructor() {
    super();
    this._size = "small";
  }

  #handleImageResize() {
    const values = ImageViewer.#imageSizeValues;

    this._size = values[(values.indexOf(this._size) + 1) % values.length];
  }

  render() {
    return html`<div
      class="container ${this._size}"
      @click="${this.#handleImageResize}"
    >
      ${when(
        !!this.src,
        () => html`<rodo-imagekit src="${this.src}"></rodo-imagekit>`,
      )}
    </div>`;
  }
}

window.customElements.define("rodo-image-viewer", ImageViewer);
