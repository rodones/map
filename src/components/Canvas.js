import { LitElement, html, css } from "lit";
import { cache } from "lit/directives/cache.js";
import { ref, createRef } from "lit/directives/ref.js";
import {
  MapBaseController,
  MapControlExtender,
  OrbitControlExtender,
  PointerLockControlExtender,
  TrackballControlExtender,
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

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(name, oldValue, newValue);

    this[name] = newValue;

    if (name === "control") {
      this.extendController(newValue);
      try {
        this.controller.createControls();
        this.controller.animate();
      } catch (e) {
        // console.error(e);
      }
    }
  }

  extendController(control) {
    if (control === "pointer-lock") {
      this.controller.extendController(PointerLockControlExtender);
    } else if (control === "map") {
      this.controller.extendController(MapControlExtender);
    } else if (control === "orbit") {
      this.controller.extendController(OrbitControlExtender);
    } else if (control === "trackball") {
      this.controller.extendController(TrackballControlExtender);
    }
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  firstUpdated() {
    this.extendController(this.control);

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
        <p style="font-size:36px">Click to play</p>
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
