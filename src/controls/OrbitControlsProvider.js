import { ControlProvider } from "../components/Canvas.controller";
import OrbitControls from "./OrbitControls";

export default class OrbitControlProvider extends ControlProvider {
  createControls() {
    this.controls = new OrbitControls(
      this.controller.camera,
      this.controller.canvas,
    );
    this.controls.maxPolarAngle = Math.PI / 2;

    this.controls.listenToKeyEvents(window);
    this.controls.addEventListener("change", () => {
      this.reDraw = true;
    });
  }

  animate() {
    this.controls.update();
    if (this.reDraw) {
      this.controller.renderer.render(
        this.controller.scene,
        this.controller.camera,
      );
      this.reDraw = false;
    }
  }

  destroy() {
    this.controls?.dispose();
  }
}
