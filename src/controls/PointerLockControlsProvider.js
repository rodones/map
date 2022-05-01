import { Vector3, Color, Raycaster } from "three";
import { ControlProvider } from "../components/Canvas.controller";
import PointerLockControls from "./PointerLockControls";
import { withSkip, withThrottled } from "./PointerLockControlUtils";

export default class PointerLockControlProvider extends ControlProvider {
  createControls() {
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canJump = false;
    this.runOffset = 1;
    this.walkOrbit = 0;
    this.walkOffset = 1;

    this.gravityOffset = 10;

    this.prevTime = performance.now();
    this.velocity = new Vector3();
    this.direction = new Vector3();
    this.vertex = new Vector3();
    this.color = new Color();

    this.controls = new PointerLockControls(
      this.controller.camera,
      this.controller.canvas,
    );

    this.#initPointerLockInterface();

    this.controller.scene.add(this.controls.getObject());

    this.#addKeyboardListeners();

    this.raycaster = new Raycaster(
      new Vector3(),
      new Vector3(-1, -1, -1),
      0,
      2,
    );

    this.controls.addEventListener("change", this.#imageQueryHandler);
  }

  animate() {
    this.animationRequestId = requestAnimationFrame(this.animate.bind(this));

    const time = performance.now();
    if (this.controls.isLocked) {
      this.raycaster.ray.origin.copy(this.controls.getObject().position);
      this.raycaster.ray.origin.y -= 5;
      const intersections = this.raycaster.intersectObject(
        this.controller.scene.getObjectByName("MAP_START"),
      );

      const onObject = intersections.length > 0;

      const delta = (time - this.prevTime) / 1000;

      this.velocity.x -= this.velocity.x * delta;
      this.velocity.z -= this.velocity.z * delta;

      // soar in the sky to the map

      this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
      this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
      this.direction.normalize(); // this ensures consistent movements in all directions

      if (this.moveForward || this.moveBackward)
        this.velocity.z = this.direction.z * 900.0 * delta * this.runOffset;
      if (this.moveLeft || this.moveRight)
        this.velocity.x = this.direction.x * 900.0 * delta * this.runOffset;

      if (onObject === true) {
        this.velocity.y = intersections[0].distance;
        if (this.velocity.x < 1 && this.velocity.z < 1) this.velocity.y = 0;
        this.canJump = true;
      } else {
        this.velocity.y -= this.gravityOffset * delta;
      }

      this.controls.moveRight(this.velocity.x * delta);
      this.controls.moveForward(this.velocity.z * delta);

      this.controls.getObject().position.y += this.velocity.y * delta; // new behavior

      // if (this.canWalk) {
      //   this._walk(this.controls.getObject().position, delta);
      // }
    }
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

  #walk(position, delta) {
    position.x += delta * this.walkOrbit;
    position.y += delta * this.walkOrbit;
    this.walkOrbit += this.walkOffset;
    if (10 < this.walkOrbit || this.walkOrbit < -10) this.walkOffset *= -1;
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
    document.addEventListener("keydown", this.#onKeyDown);
    document.addEventListener("keyup", this.#onKeyUp);
  }

  #removeKeyboardListeners() {
    document.removeEventListener("keydown", this.#onKeyDown);
    document.removeEventListener("keyup", this.#onKeyUp);
  }

  #onKeyDown = (event) => {
    event.preventDefault();

    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this.moveForward = true;
        this.canWalk = true;
        break;
      case "ArrowLeft":
      case "KeyA":
        this.moveLeft = true;
        this.canWalk = true;
        break;
      case "ArrowDown":
      case "KeyS":
        this.moveBackward = true;
        this.canWalk = true;
        break;
      case "ArrowRight":
      case "KeyD":
        this.moveRight = true;
        break;
      case "ShiftLeft":
        this.runOffset = 3.5;
        break;
      case "Space":
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
        this.moveForward = false;
        this.canWalk = false;
        break;
      case "ArrowLeft":
      case "KeyA":
        this.moveLeft = false;
        this.canWalk = false;
        break;
      case "ArrowDown":
      case "KeyS":
        this.moveBackward = false;
        this.canWalk = false;
        break;
      case "ArrowRight":
      case "KeyD":
        this.moveRight = false;
        this.canWalk = false;
        break;
      case "ShiftLeft":
        this.runOffset = 1;
        break;
    }
  };

  #imageQuery = async (position) => {
    const { x, y, z } = position;

    fetch(
      `https://shmb.eu-west-3.elasticbeanstalk.com/images?x=${x}0&y=${y}&z=${z}&radius=9.0`,
    )
      .then((res) => res.json())
      .then((res) => {
        console.log(res.data);

        if (res.data[0]) {
          const { width, height } = this.controller.host.imageViewerRef.value;
          const file = res.data[0].replaceAll(
            "https://rodones-images2.fra1.digitaloceanspaces.com/",
            "",
          );
          this.controller.host.imageViewerRef.value.src = `https://ik.imagekit.io/akdeniz/${file}?tr=w-${width},h-${height}`;
        }
      });
  };

  #imageQuerySkipCloseValues = (prevArgs, args) => {
    const [prevPos] = prevArgs;
    const [pos] = args;

    console.log(
      prevPos
        ? Math.abs(prevPos.x - pos.x) +
            Math.abs(prevPos.y - pos.y) +
            Math.abs(prevPos.z - pos.z)
        : -1000000,
    );

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

  #imageQueryHandler = withThrottled(() => {
    const position = this.controller.camera.position.clone();

    return this.#imageQueryWithSkip(position);
  }, 1000);
}
