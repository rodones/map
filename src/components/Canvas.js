import { LitElement, html, css } from "lit";
import { cache } from "lit/directives/cache.js";
import { ref, createRef } from "lit/directives/ref.js";
import { CanvasController } from "./Canvas.controller";

export class Canvas extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    canvas {
      width: 100%;
      height: 100%;
    }

    .blocker {
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      user-select: none;
    }

    .instructions {
      width: 100%;
      height: 100%;

      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      text-align: center;
      font-size: 14px;
      cursor: pointer;

      color: whitesmoke;
    }

    .keys tr {
      height: 24px;
    }

    .keys td:nth-child(2n + 1) {
      text-align: left;
      min-width: 90px;
    }

    .key {
      background-color: #414952;
      border: 1px solid black;
      border-radius: 4px;
      padding: 1px 2px;
      margin: 1px;
    }

    .imageViewer {
      position: absolute;
      bottom: 4px;
      left: 4px;

      background-color: #414952;
      border: 1px solid #8699a6;
      border-radius: 2px;

      margin: 0;
      padding: 0;

      cursor: pointer;
    }

    .imageViewer img {
      width: 100%;
      height: 100%;
    }

    .imageViewer.small {
      width: 150px;
      height: 100px;
    }

    .imageViewer.medium {
      width: 300px;
      height: 200px;
    }

    .imageViewer.large {
      width: 600px;
      height: 400px;
    }
  `;

  static properties = {
    control: { type: String },
    model: { type: String },
    camera: { type: Object },
    stats: { type: Boolean },
    _imageSize: { type: String, state: true },
    _imageSrc: { type: String, state: true },
  };

  static #controlValues = Object.freeze([
    "pointer-lock",
    "map",
    "orbit",
    "trackball",
  ]);

  static #imageSizeValues = Object.freeze(["small", "medium", "large"]);

  canvasRef = createRef();
  blockerRef = createRef();
  instructionsRef = createRef();
  imageViewerRef = createRef();

  #control;

  constructor() {
    super();
    this.controller = new CanvasController(this);
    this._imageSize = "small";
    this._imageSrc = "";
  }

  set control(value) {
    if (!Canvas.#controlValues.includes(value)) {
      throw new Error(
        `The 'control' property accepts only ${Canvas.#controlValues
          .map((v) => `'${v}'`)
          .join(", ")} but '${value}' was passed.`,
      );
    }

    const oldValue = this.#control;
    this.#control = value;
    this.requestUpdate("control", oldValue);
  }

  get control() {
    return this.#control;
  }

  async firstUpdated() {
    this.addEventListener("imageChanged", this.#handleImageChange);
    this.controller.createScene();
    this.controller.createRenderer();
    this.controller.createCamera();
    await this.controller.loadMap();

    // Lets wait for a short time for better quality (for progrressive loading map)
    setTimeout(this.#onFileLoaded, 250);
  }

  disconnectedCallback() {
    this.removeEventListener("imageChanged", this.#handleImageChange);
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has("control")) {
      this.#changeController(this.control).then(() => {
        this.controller.createControls();
        this.controller.animate();
      });
    }

    if (changedProperties.has("camera")) {
      this.controller.updateCamera(this.camera);
    }

    if (changedProperties.has("stats")) {
      this.controller.toggleStats();
    }
  }

  #onFileLoaded = () => {
    this.dispatchEvent(
      new CustomEvent("mapLoaded", { bubbles: true, composed: true }),
    );
  };

  async #changeController(control) {
    const ControlProvider = await this.#loadProviderClass(control);
    this.controller.setControlProvider(new ControlProvider());
  }

  async #loadProviderClass(control) {
    const module = await (() => {
      switch (control) {
        case "pointer-lock":
          return import(
            /* webpackChunkName: "PointerLockControl" */ "../controls/PointerLockControlsProvider"
          );
        case "map":
          return import(
            /* webpackChunkName: "MapControl" */ "../controls/MapControlsProvider"
          );
        case "orbit":
          return import(
            /* webpackChunkName: "OrbitControl" */ "../controls/OrbitControlsProvider"
          );
        case "trackball":
          return import(
            /* webpackChunkName: "TrackballControl" */ "../controls/TrackballControlsProvider"
          );
        default:
          throw new Error("The 'control' property is invalid.");
      }
    })();

    return module.default;
  }

  #renderBlocker() {
    return html`<div class="blocker" ${ref(this.blockerRef)}>
      <div class="instructions" ${ref(this.instructionsRef)}>
        <div style="font-size:36px">Click to start</div>
        <table class="keys">
          <tbody>
            <tr>
              <td>Move</td>
              <td>
                <span class="key">W</span><span class="key">A</span
                ><span class="key">S</span><span class="key">D</span>
              </td>
            </div>
            <tr>
              <td>Jump</td>
              <td><span class="key">SPACE</span></td>
            </tr>
            <tr>
              <td>Look</td>
              <td><span class="key">MOUSE</span></td>
            </tr>
            <tr>
              <td>Exit</td>
              <td><span class="key">M</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
  }

  #handleImageResize() {
    const index = Canvas.#imageSizeValues.indexOf(this._imageSize);
    this._imageSize =
      Canvas.#imageSizeValues[(index + 1) % Canvas.#imageSizeValues.length];
  }

  #handleImageChange(event) {
    this._imageSrc = event.detail.src;
  }

  #renderImageViewer() {
    return html`
      <div
        class="imageViewer ${this._imageSize}"
        @click="${this.#handleImageResize}"
      >
        <rodo-imagekit src="${this._imageSrc}"></rodo-imagekit>
      </div>
    `;
  }

  #renderCanvas() {
    return html`<canvas ${ref(this.canvasRef)}></canvas>`;
  }

  render() {
    return html`
      ${this.control === "pointer-lock" ? this.#renderBlocker() : ""}
      ${cache(this.control === "pointer-lock" ? this.#renderImageViewer() : "")}
      ${cache(this.#renderCanvas())}
    `;
  }
}

window.customElements.define("rodo-canvas", Canvas);
