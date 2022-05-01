import { ControlProvider } from "../components/Canvas.controller";
import MapControls from "./MapControls";

export default class MapControlProvider extends ControlProvider {
  createControls() {
    this.controls = new MapControls(
      this.controller.camera,
      this.controller.canvas,
    );

    this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    // this.controls.minDistance = 100;
    // this.controls.maxDistance = 500;
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
