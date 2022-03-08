import { Vector3, Color, Raycaster } from "three";
import { ControlProvider } from "../components/Canvas.controller";
import PointerLockControls from "./PointerLockControls";

export default class PointerLockControlProvider extends ControlProvider {
  createControls() {
    this.canJump = false; // makes %50 sense
    this.runOffset = 1; // makes sense
    // this.walkOrbit = 0;
    // this.walkOffset = 1;
    // this.canWalk = false;
    this.relativeWalk = new Vector3(); // This indicates of camera's relative w a s d walk. a-d = x direction, w-s = z direction.
    this.gravityOffset = 10;

    this.prevTime = performance.now();
    this.velocity = new Vector3();
    this.direction = new Vector3();
    // this.vertex = new Vector3();
    // this.color = new Color();

    this.controls = new PointerLockControls(
      this.controller.camera,
      this.controller.canvas,
    );

    this.#initPointerLockInterface();

    this.controller.scene.add(this.controls.getObject());

    this.#addKeyboardListeners();

    this.raycaster = new Raycaster( // TODO: Gelecekte bunu değiştir.
      new Vector3(),
      new Vector3(-1, -1, -1),
      0,
      1,
    );
  }

  onObject(intersects) {
    return intersects.some((inter) => inter.face.normal.y > 0.01);
  }

  calculateVelocity() {
    const {camera} = this.controller
    
    // TODO intersection alacak bu, az önceki dünyadaki hızını kullanarak çarpmaların yönüne göre sıfırlıycak bazı hızları (kaya kaya gitme)
  }

  animate() {
    this.animationRequestId = requestAnimationFrame(this.animate.bind(this));
    
    const time = performance.now();

    if (!this.controls.isLocked) {
      this.prevTime = time;

      this.controller.renderer.render(
        this.controller.scene,
        this.controller.camera,
      );

      return null;
    }

    const delta = (time - this.prevTime) / 1000;

    this.velocity.x -= this.velocity.x * delta;
    this.velocity.z -= this.velocity.z * delta;

    // TODO cam direction
    let camDirection = new Vector3(0, 0, 0);
    let cameraDirection = this.controller.camera.getWorldDirection(camDirection);
    this.m = this.m + 1;
    this.direction.copy(camDirection);
    // soar in the sky to the map

    const intersections = this.#raycast();

    if (this.canWalk) {
      this.velocity.z = this.direction.z * 900.0 * delta * this.runOffset;
      this.velocity.x = this.direction.x * 900.0 * delta * this.runOffset;
    }
    if (this.onObject(intersections) === true) {
      this.velocity.y = intersections[0].distance;
      if (this.velocity.x < 1 && this.velocity.z < 1) this.velocity.y = 0;
      this.canJump = true;
    } else {
      this.velocity.y -= this.gravityOffset * delta;
    }

    if (intersections.length) {
      intersections.forEach((inter) => {
        let tempNorm = new Vector3(0, 0, 0).copy(inter.face.normal);

        let tempCamDirection = new Vector3(0, 0, 0).copy(this.direction);

        let tempVelocity = tempNorm.add(tempCamDirection);

        if (tempVelocity.x > 0.9 || tempVelocity.x < -0.9)
          this.velocity.x = 0;
        if (tempVelocity.z > 0.9 || tempVelocity.z < -0.9)
          this.velocity.z = 0;

        this.velocity.x *= tempVelocity.x;
        this.velocity.y *= tempVelocity.y;
        this.velocity.z *= tempVelocity.z;
      });
    }

    this.controls.move(this.velocity, delta);

    this.prevTime = time;

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

  #raycast() {
    this.raycaster.ray.origin.copy(this.controls.getObject().position);
    this.raycaster.ray.origin.y -= 5; // insan gözü gibi olsun yeri aşşağı indiriyor bu
    return this.raycaster.intersectObject(
      this.controller.scene.getObjectByName("MAP_START"),
    );
  }

  // #walk(position, delta) {
  //   position.x += delta * this.walkOrbit;
  //   position.y += delta * this.walkOrbit;
  //   this.walkOrbit += this.walkOffset;
  //   if (10 < this.walkOrbit || this.walkOrbit < -10) this.walkOffset *= -1;
  // }

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
    document.addEventListener("keydown", this.#onKeyDown);
    document.addEventListener("keyup", this.#onKeyUp);
  }

  #removeKeyboardListeners() {
    document.removeEventListener("keydown", this.#onKeyDown);
    document.removeEventListener("keyup", this.#onKeyUp);
  }

  #onKeyDown = (event) => { // key pressed
    event.preventDefault();

    switch (event.code) {
      // case "KeyW" || "keyA" || "keyS" || "keyD": // No need for this currently.
      //   this.canWalk = true;
      case "KeyW":
        this.relativeWalk.setZ(1);
        break;
      case "KeyA":
        this.relativeWalk.setX(-1);
        break;
      case "KeyD":
        this.relativeWalk.setX(1);
        break;
      case "KeyS":
        this.relativeWalk.setZ(-1);
        break;
      case "ArrowUp":
        this.controls.euler.x += 0.2
        this.controls.camera.quaternion.setFromEuler(this.controls.euler);
        this.controls.calculateNewDirection()
        break;
      case "ArrowDown":
        this.controls.euler.x -= 0.2
        this.controls.camera.quaternion.setFromEuler(this.controls.euler);
        this.controls.calculateNewDirection()
        break;
      case "ArrowLeft":
        this.controls.euler.y += 0.2
        this.controls.camera.quaternion.setFromEuler(this.controls.euler);
        this.controls.calculateNewDirection()
        break;
      case "ArrowRight":
          this.controls.euler.y -= 0.2
          this.controls.camera.quaternion.setFromEuler(this.controls.euler);
          this.controls.calculateNewDirection()
          break;
      case "ShiftLeft":
        this.runOffset = 3.5;
        break;
      case "Space": // True garbage jumping control.
        if (this.canJump === true) this.velocity.y += 12;
        this.canJump = false;
        break;
    }
  };

  #onKeyUp = (event) => {
    event.preventDefault();

    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this.canWalk = false;
        break;
      case "ShiftLeft":
        this.runOffset = 1;
        break;
    }
  };
}
