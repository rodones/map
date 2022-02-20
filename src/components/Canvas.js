import { LitElement, html, css } from "lit";
import { cache } from "lit/directives/cache.js";
import { ref, createRef } from "lit/directives/ref.js";
import {
  MapBaseController,
  MapControlProvider,
  OrbitControlProvider,
  PointerLockControlProvider,
  TrackballControlProvider,
} from "./MapBaseController";

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
  `;

  static properties = {
    control: { type: String },
    model: { type: String },
  };

  canvasRef = createRef();
  blockerRef = createRef();
  instructionsRef = createRef();

  constructor() {
    super();
    this.controller = new MapBaseController(this);
  }

  updated(changedProperties) {
    if (changedProperties.has("control")) {
      this.#changeController(this.control);
      this.controller.createControls();
      this.controller.animate();
    }
  }

  firstUpdated() {
    this.#changeController(this.control);

    if (!this.model) throw new Error("The 'model' property cannot be empty!");

    this.controller.createScene();
    this.controller.createRenderer();
    this.controller.createCamera();
    this.controller.loadMap();
    this.controller.createControls();
    this.controller.animate();
  }

  #getProviderClass(control) {
    return {
      "pointer-lock": PointerLockControlProvider,
      map: MapControlProvider,
      orbit: OrbitControlProvider,
      trackball: TrackballControlProvider,
    }[control];
  }

  #changeController(control) {
    const ControlProvider = this.#getProviderClass(control);
    if (ControlProvider) {
      this.controller.useController(new ControlProvider());
    } else {
      throw new Error("The 'control' property is invalid.");
    }
  }

  #renderBlocker() {
    return html`<div class="blocker" ${ref(this.blockerRef)}>
      <div class="instructions" ${ref(this.instructionsRef)}>
        <p style="font-size:36px">Click to start</p>
        <p>
          Move: WASD<br />
          Jump: SPACE<br />
          Look: MOUSE
        </p>
      </div>
    </div>`;
  }

  #renderCanvas() {
    return html`<canvas ${ref(this.canvasRef)}></canvas>`;
  }

  render() {
    return html`
      ${cache(this.control === "pointer-lock" ? this.#renderBlocker() : "")}
      ${cache(this.#renderCanvas())}
    `;
  }
}

window.customElements.define("rodo-canvas", Canvas);
