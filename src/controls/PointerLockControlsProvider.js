import "../components/ImageKit";
import "../components/ImageViewer";
import { html } from "lit";
import { classMap } from "lit-html/directives/class-map.js";
import { ControlProvider } from "../components/Canvas.controller";
import PointerLockControls from "./PointerLockControls";

export default class PointerLockControlProvider extends ControlProvider {
  #HISTORY_LENGTH = 500;

  #imageSrc;
  #imageData;
  #imagePos;
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
    //this.timerId = setInterval(this.#imageQueryHandler, 2000);
  }

  #removeKeyboardListeners() {
    document.removeEventListener("keydown", this.controls.onKeyDown);
    document.removeEventListener("keyup", this.controls.onKeyUp);
    //this.timerId = void clearInterval(this.timerId);
  }

  #imageQuery = (position) => {
    const handle = this.#handleImageData(position);

    if (
      this.#imagePos &&
      this.#imagePos.x === position.x &&
      this.#imagePos.y === position.y &&
      this.#imagePos.z === position.z
    ) {
      handle({ data: this.#imageData });
    } else {
      fetch(
        `https://imba.eu-central-1.elasticbeanstalk.com/images?x=${position.x}0&y=${position.y}&z=${position.z}&radius=30.0`,
      )
        .then((res) => res.json())
        .then(handle);
    }
  };

  #handleImageData =
    ({ x, y, z }) =>
    ({ data }) => {
      const img =
        data.find(
          (currentImage) => !this.#imageHistory.includes(currentImage),
        ) || data[0];

      if (img) {
        this.#imagePos = { x, y, z };
        this.#imageData = data;
        this.#imageSrc = img;
        if (this.#imageHistory.length > this.#HISTORY_LENGTH)
          this.#imageHistory.splice(0, 1);
        this.#imageHistory.push(img);
      } else if (
        this.#imagePos &&
        Math.pow(this.#imagePos.x - x, 2) +
          Math.pow(this.#imagePos.y - y, 2) +
          Math.pow(this.#imagePos.z - z, 2) >
          30000
      ) {
        this.#imageSrc = "";
      }

      this.controller.host.requestUpdate();
    };

  #imageQueryHandler = () => {
    const position = this.controller.camera.position.clone();

    return this.#imageQuery(position);
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
      //this.#renderImageViewer(),
    ];
  }
}
