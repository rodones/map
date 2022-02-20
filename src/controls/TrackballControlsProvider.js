import { ControlProvider } from "../components/Canvas.controller";
import TrackballControls from "./TrackballControls";

export default class TrackballControlProvider extends ControlProvider {
  createControls() {
    this.controls = new TrackballControls(
      this.controller.camera,
      this.controller.canvas,
    );

    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;

    this.controls.keys = ["KeyA", "KeyS", "KeyD"];

    this.controls.addEventListener("change", () => {
      this.reDraw = true;
    });
  }

  animate() {
    this.animationRequestId = requestAnimationFrame(this.animate.bind(this));

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
    console.log("Trackball destroyControls");
    if (this.animationRequestId) cancelAnimationFrame(this.animationRequestId);

    this.controls?.dispose();
  }
}
