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

  canvasRef = createRef();
  blockerRef = createRef();
  instructionsRef = createRef();

  #control;

  constructor() {
    super();
    this.controller = new CanvasController(this);
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
    this.controller.createScene();
    this.controller.createRenderer();
    this.controller.createCamera();
    await this.controller.loadMap();

    // Lets wait for a short time for better quality (for progrressive loading map)
    setTimeout(this.#onFileLoaded, 250);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has("control")) {
      this.#changeController(this.control).then(() => {
        this.controller.createControls();
        this.controller.animate();
        this.requestUpdate();
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

  #renderCanvas() {
    return html`<canvas ${ref(this.canvasRef)}></canvas>`;
  }

  render() {
    return html`
      ${cache(this.controller.renderStaticContent())}
      ${cache(this.#renderCanvas())}
    `;
  }
}

window.customElements.define("rodo-canvas", Canvas);
