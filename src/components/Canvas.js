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
      this.changeController(this.control);
      try {
        this.controller.createControls();
        this.controller.animate();
      } catch (e) {
        console.error(e);
      }
    }
  }

  changeController(control) {
    console.log("changeController", control);
    if (control === "pointer-lock") {
      this.controller.useController(new PointerLockControlProvider());
    } else if (control === "map") {
      this.controller.useController(new MapControlProvider());
    } else if (control === "orbit") {
      this.controller.useController(new OrbitControlProvider());
    } else if (control === "trackball") {
      this.controller.useController(new TrackballControlProvider());
    }
  }

  firstUpdated() {
    this.changeController(this.control);

    if (!this.model) throw new Error("model cannot be empty!");

    this.controller.createScene();
    this.controller.createRenderer();
    this.controller.createCamera();
    this.controller.loadMap();
    this.controller.createControls();
    this.controller.animate();
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
    console.log("render", this.control);

    return html`
      ${cache(this.control === "pointer-lock" ? this.#renderBlocker() : "")}
      ${cache(this.#renderCanvas())}
    `;
  }
}

window.customElements.define("rodo-canvas", Canvas);
