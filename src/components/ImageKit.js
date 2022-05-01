import { LitElement, html, css } from "lit";
import { ref, createRef } from "lit/directives/ref.js";

export class ImageKit extends LitElement {
  static styles = css`
    img {
      width: 100%;
      height: 100%;
    }
  `;

  static properties = {
    src: { type: String },
    _size: { type: Object, state: true },
  };

  #imgRef = createRef();

  constructor() {
    super();
    this._imageSize = "small";

    this.resizeObserver = new ResizeObserver((entries) => {
      const [img] = entries;
      const { width, height } = img.contentRect;
      this._size = { width, height };
    });
  }

  firstUpdated() {
    super.connectedCallback();
    this.resizeObserver.observe(this.#imgRef.value);
  }

  disconnectedCallback() {
    this.resizeObserver.unobserve(this.#imgRef.value);

    super.disconnectedCallback();
  }

  get imageKitSrc() {
    try {
      const file = new URL(this.src).pathname;
      return `https://ik.imagekit.io/akdeniz${file}?tr=w-${this._size.width},h-${this._size.height}`;
    } catch (_) {
      return "";
    }
  }

  render() {
    return html`<img src="${this.imageKitSrc}" ${ref(this.#imgRef)} />`;
  }
}

window.customElements.define("rodo-imagekit", ImageKit);
