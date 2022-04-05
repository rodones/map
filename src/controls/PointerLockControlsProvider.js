import { ControlProvider } from "../components/Canvas.controller";
import PointerLockControls from "./PointerLockControls";

export default class PointerLockControlProvider extends ControlProvider {
  createControls() {
    this.controls = new PointerLockControls(
      this.controller.camera,
      this.controller.canvas,
      this.controller.scene,
    );

    this.#initPointerLockInterface();

    this.controller.scene.add(this.controls.getObject());

    this.#addKeyboardListeners();
  }

  animate() {
    this.animationRequestId = requestAnimationFrame(this.animate.bind(this));

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
    console.log("PointerLockControlExtender destroyControls");

    if (this.animationRequestId) cancelAnimationFrame(this.animationRequestId);

    this.#removeKeyboardListeners();

    if (this.controls) {
      this.scene?.remove(this.controls.getObject());
      this.controls.dispose();
    }
  }

  #initPointerLockInterface() {
    this.controller.instructions.addEventListener("click", () => {
      this.controls.lock();
    });

    this.controls.addEventListener("lock", () => {
      this.controller.instructions.style.display = "none";
      this.controller.blocker.style.display = "none";
    });

    this.controls.addEventListener("unlock", () => {
      this.controller.blocker.style.display = "block";
      this.controller.instructions.style.display = "";
    });
  }

  #addKeyboardListeners() {
    document.addEventListener("keydown", this.controls.onKeyDown);
    document.addEventListener("keyup", this.controls.onKeyUp);
  }

  #removeKeyboardListeners() {
    document.removeEventListener("keydown", this.controls.onKeyDown);
    document.removeEventListener("keyup", this.controls.onKeyUp);
  }
}
