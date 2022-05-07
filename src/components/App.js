import { LitElement, html, css } from "lit";
import { ref, createRef } from "lit/directives/ref.js";
import { when } from "lit/directives/when.js";
import info from "../icons/info";
import arrowsExpand from "../icons/arrows-expand";
import chartSquareBar from "../icons/chart-square-bar";
import officeBuilding from "../icons/office-building";

export class App extends LitElement {
  static properties = {
    control: { type: String },
    model: { type: String },
    stats: { type: Boolean },
    _showAbout: { state: true },
    _warp: { state: true },
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
    this._warp = {
      shouldRender: false,
      isModalOpened: false,
      places: [],
    };
    this._camera = { position: [20, -10, 20] };
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("warp", this.#onWarp);
    this.addEventListener("enablePlaces", this.#handleEnablePlaces);
  }

  disconnectedCallback() {
    this.removeEventListener("warp", this.#handleEnablePlaces);
    this.removeEventListener("warp", this.#onWarp);
    super.disconnectedCallback();
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

  #showWarp() {
    this._warp = { ...this._warp, isModalOpened: true };
  }

  #hideWarp() {
    this._warp = { ...this._warp, isModalOpened: false };
  }

  #onWarp(event) {
    const { position } = event.detail;

    this._camera = { position };
    this.canvasRef.value.requestUpdate("camera", null);
  }

  #handleEnablePlaces(event) {
    const { places } = event.detail;

    this._warp = {
      ...this._warp,
      places,
      shouldRender: true,
    };
  }

  #toggleStats() {
    this.stats = !this.stats;
  }

  #toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen({ navigationUI: "hide" })
        .catch(console.error);
    } else {
      document.exitFullscreen();
    }
  }

  #renderLayout() {
    return html`
      <rodo-rectangular-layout position="right" align="right">
        ${when(
          this._warp.shouldRender,
          () => html`
            <rodo-button title="Places" @click="${this.#showWarp}">
              ${officeBuilding}
            </rodo-button>
          `,
        )}
        <rodo-button title="FPS Counter" @click="${this.#toggleStats}">
          ${chartSquareBar}
        </rodo-button>
        <rodo-button title="Full screen" @click="${this.#toggleFullScreen}">
          ${arrowsExpand}
        </rodo-button>
        <rodo-button title="About" @click="${this.#showAbout}">
          ${info}
        </rodo-button>
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
      ?stats="${this.stats}"
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

  #renderWarpModal() {
    return html`<rodo-warp-modal
      places="${JSON.stringify(this._warp.places)}"
      @close=${this.#hideWarp}
    ></rodo-warp-modal>`;
  }

  render() {
    return [
      this.#renderModalProvider(),
      this.#renderLayout(),
      this.#renderCanvas(),
      this._showAbout && this.#renderAboutModal(),
      this._warp.isModalOpened && this.#renderWarpModal(),
    ];
  }
}

window.customElements.define("rodo-app", App);
