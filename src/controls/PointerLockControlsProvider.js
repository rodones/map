import { ControlProvider } from "../components/Canvas.controller";
import PointerLockControls from "./PointerLockControls";
import { withSkip } from "./PointerLockControlUtils";

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
    this.controls.addEventListener("change", this.#imageQueryHandler);
  }

  #removeKeyboardListeners() {
    document.removeEventListener("keydown", this.controls.onKeyDown);
    document.removeEventListener("keyup", this.controls.onKeyUp);
    this.controls.removeEventListener("change", this.#imageQueryHandler);
  }

  #imageQuery = async (position) => {
    const { x, y, z } = position;

    fetch(
      `https://imba.eu-central-1.elasticbeanstalk.com/images?x=${x}0&y=${y}&z=${z}&radius=9.0`,
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.data[0]) {
          this.controller.host.dispatchEvent(
            new CustomEvent("imageChanged", {
              detail: {
                src: res.data[0],
              },
              bubbles: true,
              composed: true,
            }),
          );
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
}
