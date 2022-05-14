import "../components/ImageKit";
import "../components/ImageViewer";
import { html } from "lit";
import { classMap } from "lit-html/directives/class-map.js";
import { ControlProvider } from "../components/Canvas.controller";
import PointerLockControls from "./PointerLockControls";
import { withSkip } from "./PointerLockControlUtils";

export default class PointerLockControlProvider extends ControlProvider {
  #imageSrc;
  #imageHistory;

  constructor() {
    super();
    this.#imageHistory = [];
  }

  get hasMouse() {
    if (!window.matchMedia) return true;

    return window.matchMedia("(any-pointer:fine)").matches;
  }

  createControls() {
    this.controls = new PointerLockControls(
      this.controller.camera,
      this.controller.canvas,
      this.controller.scene,
    );
    this.controls.hasMouse = this.hasMouse;

    this.controller.scene.add(this.controls.getObject());

    this.#addKeyboardListeners();

    if (this.hasMouse) {
      this.#initPointerLockInterface();
    } else {
      this.#initJoyStickInterface();
    }
  }

  animate() {
    if (!this.controls.isLocked) {
      this.controller.renderer.render(
        this.controller.scene,
        this.controller.camera,
      );

      return null;
    }

    this.controls.animate();

    this.controller.renderer.render(
      this.controller.scene,
      this.controller.camera,
    );
  }

  destroy() {
    this.#removeKeyboardListeners();

    if (this.controls) {
      this.scene?.remove(this.controls.getObject());
      this.controls.dispose();
    }
  }

  async #initJoyStickInterface() {
    this.controls.isLocked = true;

    await import(
      /* webpackChunkName: "PointerLockJoyStick" */ "./../components/PointerLockJoyStick"
    );

    this.controller.host.requestUpdate();
  }

  async #initPointerLockInterface() {
    await import(
      /* webpackChunkName: "PointerLockBlocker" */ "./../components/PointerLockBlocker"
    );

    this.controller.host.requestUpdate();

    this.controls.addEventListener("lock", () => {
      this.controller.host.requestUpdate();
    });
    this.controls.addEventListener("unlock", () => {
      this.controller.host.requestUpdate();
    });
  }

  #addKeyboardListeners() {
    document.addEventListener("keydown", this.controls.onKeyDown);
    document.addEventListener("keyup", this.controls.onKeyUp);
    this.controls.addEventListener("change", this.#imageQueryHandler);
  }

  #removeKeyboardListeners() {
    document.removeEventListener("keydown", this.controls.onKeyDown);
    document.removeEventListener("keyup", this.controls.onKeyUp);
    this.controls.removeEventListener("change", this.#imageQueryHandler);
  }

  #imageQuery = (position) => {
    const { x, y, z } = position;

    fetch(
      `https://imba.eu-central-1.elasticbeanstalk.com/images?x=${x}0&y=${y}&z=${z}&radius=9.0`,
    )
      .then((res) => res.json())
      .then(({ data }) => {
        const img =
          data.find(
            (currentImage) => !this.#imageHistory.includes(currentImage),
          ) || data[0];

        if (img) {
          this.#imageSrc = img;
          if (this.#imageHistory.length > 10) this.#imageHistory.splice(0, 1);
          this.#imageHistory.push(img);
          this.controller.host.requestUpdate();
        }
      });
  };

  #imageQuerySkipCloseValues = (prevArgs, args) => {
    const [prevPos] = prevArgs;
    const [pos] = args;

    return (
      !!prevPos &&
      Math.abs(prevPos.x - pos.x) +
        Math.abs(prevPos.y - pos.y) +
        Math.abs(prevPos.z - pos.z) <=
        10
    );
  };

  #imageQueryWithSkip = withSkip(
    this.#imageQuery,
    this.#imageQuerySkipCloseValues,
  );

  #imageQueryHandler = () => {
    const position = this.controller.camera.position.clone();

    return this.#imageQueryWithSkip(position);
  };

  #renderImageViewer() {
    return html`
      <rodo-image-viewer
        src="${this.#imageSrc}"
        class="${classMap({ hasMouse: this.hasMouse })}"
      ></rodo-image-viewer>
    `;
  }

  #renderBlocker() {
    return html`<rodo-pointer-lock-blocker
      @click=${this.controls.lock}
      ?lock=${this.controls.isLocked}
    ></rodo-pointer-lock-blocker>`;
  }

  #renderJoyStick() {
    return html`<rodo-pointer-lock-joystick></rodo-pointer-lock-joystick>`;
  }

  renderStaticContent() {
    return [
      this.hasMouse ? this.#renderBlocker() : this.#renderJoyStick(),
      this.#renderImageViewer(),
    ];
  }
}
