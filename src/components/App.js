import { LitElement, html, css } from "lit";
import { ref, createRef } from "lit/directives/ref.js";
import info from "../icons/info";

export class App extends LitElement {
  static properties = {
    control: { type: String },
    model: { type: String },
    _showAbout: { state: true },
    _camera: { state: true },
  };

  static styles = css`
    rodo-canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;

  canvasRef = createRef();

  constructor() {
    super();
    this._showAbout = false;
    this._camera = { position: [20, -10, 20] };
  }

  #changeMode(event) {
    this.control = event.detail.control;
  }

  #showAbout() {
    this._showAbout = true;
  }

  #hideAbout() {
    this._showAbout = false;
  }

  #warp() {
    const position = window
      .prompt("Position", "500,-10,20")
      .split(",")
      .filter((x) => x !== "" && !Number.isNaN(x))
      .concat([0, 0, 0])
      .slice(0, 3);

    this._camera = { position };
    this.canvasRef.value.requestUpdate("camera", null);
  }

  #renderLayout() {
    return html`
      <rodo-rectangular-layout position="right" align="right">
        <rodo-button title="About" @click="${this.#showAbout}">
          ${info}
        </rodo-button>
      </rodo-rectangular-layout>

      <rodo-rectangular-layout position="right" align="left">
        <rodo-button title="Warp" @click="${this.#warp}"> W </rodo-button>
      </rodo-rectangular-layout>

      <rodo-rectangular-layout position="bottom" align="right">
        <rodo-change-control-button
          @controlChanged="${this.#changeMode}"
          control=${this.control}
        ></rodo-change-control-button>
      </rodo-rectangular-layout>
    `;
  }

  #renderCanvas() {
    return html`<rodo-canvas
      control="${this.control}"
      model="${this.model}"
      camera="${JSON.stringify(this._camera)}"
      ${ref(this.canvasRef)}
    ></rodo-canvas>`;
  }

  #renderModalProvider() {
    return html`<rodo-modal-portal></rodo-modal-portal>`;
  }

  #renderAboutModal() {
    return html`<rodo-about-modal
      @close=${this.#hideAbout}
    ></rodo-about-modal>`;
  }

  render() {
    return [
      this.#renderModalProvider(),
      this.#renderLayout(),
      this.#renderCanvas(),
      this._showAbout && this.#renderAboutModal(),
    ];
  }
}

window.customElements.define("rodo-app", App);
