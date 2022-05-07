/**
 * This code based from threejs examples. It is highly changed and refactored.
 * Source: https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/PointerLockControls.js
 */

import { Matrix4, Raycaster } from "three";
import { Euler, EventDispatcher, Vector3 } from "three";

export default class PointerLockControls extends EventDispatcher {
  constructor(camera, element, scene) {
    super();

    if (!camera) throw new Error("The parameter 'camera' is required!");
    if (!element) throw new Error("The parameter 'element' is required!");

    this.camera = camera;
    this.element = element;
    this.scene = scene;

    this.isLocked = false; // parameter for checking can camera move
    this.hasMouse = true; // parameter for disabling mouse move handler

    // Constants
    this.minPolarAngle = 0;
    this.maxPolarAngle = Math.PI;
    this.delta = 0.25;
    this.distance = 5;
    this.jumpOffset = 25;

    // Controller values
    this.canJump = false; // Formed as [is jumping, can jump]
    this.sprint = 1;
    this.keys = [0, 0, 0, 0]; // Keys pressed, w a s d

    this.finalVelocity = new Vector3(0, -1, 0); // Final Velocity which will effect move function
    this.velocity = new Vector3(0, -1, 0); // Velocity to world
    this.relativeVelocity = new Vector3(0, 0, 0); // This indicates of camera's relative w a s d walk. a-d = x direction, w-s = z direction.
    this.jumpValue = 0;

    this.direction = new Vector3(0, 0, -1); // Camera direction Vector
    this.up = this.camera.up; // Camera up Vector
    this.right = new Vector3(); // Camera right Vector
    this.euler = new Euler(0, 0, 0, "YXZ"); // Camera angle in euler format
    this.belowDistance = this.distance; // Distance between camera and above face. Can between [0,distance]

    this.raycaster = new Raycaster(
      this.camera.position,
      this.direction,
      0,
      this.distance,
    );

    this.connect();
  }

  animate() {
    const intersections = this.#raycast();

    if (intersections.length) {
      this.finalVelocity = this.calculateIntersectedVelocity(intersections);
    }
    this.move(this.finalVelocity);

    this.finalVelocity = this.velocity;
  }

  #raycast() {
    this.raycaster.ray.origin = this.camera.position;
    this.raycaster.ray.direction = this.finalVelocity;

    let inter = this.raycaster.intersectObject(this.scene, true);

    this.raycaster.ray.direction = new Vector3(0, -1, 0);
    let belowInter = this.raycaster.intersectObject(this.scene, true);

    return this.unifyIntersections(inter, belowInter);
  }

  move = (v) => {
    this.camera.position.x += v.x * this.delta * this.sprint;
    this.camera.position.y += this.calculateY(v);
    this.camera.position.z += v.z * this.delta * this.sprint;
  };

  // Calculate y component of final velocity
  calculateY = (v) => {
    if (!this.canJump && this.jumpValue != 0) {
      this.jumpValue -= 0.5;
      return this.delta;
    }

    if (this.belowDistance == -1) {
      this.canJump = false;
      return v.y * this.delta;
    }

    this.canJump = true;
    return this.belowDistance <= this.distance
      ? this.distance - this.belowDistance - 0.1
      : 0;
  };

  // Merge intersections from two raycast, remove duplicate intersections.
  unifyIntersections(inter, belowInter) {
    inter.push(...belowInter);

    this.belowDistance = belowInter.length ? belowInter[0].distance : -1;

    const isadded = {};
    const unifiedIntersections = [];

    inter.forEach((int) => {
      let face_id = `${int.face.normal.x},${int.face.normal.y},${int.face.normal.z}`;

      if (!isadded[face_id]) {
        isadded[face_id] = true;
        unifiedIntersections.push(int);
      }
    });
    return unifiedIntersections;
  }

  // Calculate the intersected velocity with World Velocity and intersections
  calculateIntersectedVelocity(intersections) {
    let blockedVelocity = new Vector3(0, 0, 0);

    intersections.forEach((inter) => {
      blockedVelocity.add(inter.face.normal);
    });

    let yComp =
      blockedVelocity.y > 0.2 ? 0 : this.velocity.y - blockedVelocity.y;

    return new Vector3(
      this.blockVelocity(this.velocity.x, blockedVelocity.x),
      yComp,
      this.blockVelocity(this.velocity.z, blockedVelocity.z),
    );
  }

  blockVelocity(value, blockValue) {
    return Math.abs(blockValue) > Math.abs(value) ? 0 : value + blockValue;
  }

  // Calculate World Velocity
  calculateWorldVelocity() {
    this.calculateRelativeVelocity();
    this.calculateRightVector();

    let dirVector = this.direction.clone();
    let rightVector = this.right.clone();

    dirVector
      .multiplyScalar(-this.relativeVelocity.z)
      .add(rightVector.multiplyScalar(this.relativeVelocity.x));

    this.velocity.x = dirVector.x;
    this.velocity.z = dirVector.z;
  }

  // Calculate Relative Velocity gathered from wasd keys
  calculateRelativeVelocity() {
    this.relativeVelocity.x = this.keys[3] - this.keys[1]; // a - d
    this.relativeVelocity.z = this.keys[2] - this.keys[0]; // w - s
  }

  // Calculate World direction
  calculateWorldDirecton() {
    this.calculateUpVector();
    this.camera.getWorldDirection(this.direction);
  }

  // Calculate Camera up Vector
  calculateUpVector() {
    var rotationMatrix = new Matrix4().extractRotation(this.camera.matrixWorld);
    this.camera.up = new Vector3(0, 1, 0)
      .applyMatrix4(rotationMatrix)
      .normalize();
    this.up = this.camera.up;
  }

  // Calculate Camera right Vector
  calculateRightVector() {
    this.right.crossVectors(this.direction, this.up);
  }

  onMouseMove = (event) => {
    if (this.isLocked === false) return;
    if (!this.hasMouse && !event.relatedTarget?.tagName?.startsWith?.("RODO"))
      return;

    const movementX =
      event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY =
      event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    this.euler.setFromQuaternion(this.camera.quaternion);

    this.euler.y -= movementX * 0.002;
    this.euler.x -= movementY * 0.002;

    this.euler.x = Math.max(
      Math.PI / 2 - this.maxPolarAngle,
      Math.min(Math.PI / 2 - this.minPolarAngle, this.euler.x),
    );

    this.camera.quaternion.setFromEuler(this.euler);

    this.calculateWorldDirecton();
    this.calculateWorldVelocity();
    this.changed();
  };

  onKeyDown = (event) => {
    event.preventDefault();

    let flag = false;
    switch (event.code) {
      case "KeyW":
        flag = this.keys[0] == 0;
        this.keys[0] = 1;
        break;
      case "KeyA":
        flag = this.keys[1] == 0;
        this.keys[1] = 1;
        break;
      case "KeyS":
        flag = this.keys[2] == 0;
        this.keys[2] = 1;
        break;
      case "KeyD":
        flag = this.keys[3] == 0;
        this.keys[3] = 1;
        break;
      case "ShiftLeft":
        this.sprint = 30;
        break;
      case "Space":
        if (this.canJump) {
          this.jumpValue = this.jumpOffset;
          this.canJump = false;
          flag = true;
        }
        break;
    }

    if (flag) this.calculateWorldVelocity();
    this.changed();
  };

  onKeyUp = (event) => {
    event.preventDefault();

    let flag = false;
    switch (event.code) {
      case "KeyW":
        flag = this.keys[0] == 1;
        this.keys[0] = 0;
        break;
      case "KeyA":
        flag = this.keys[1] == 1;
        this.keys[1] = 0;
        break;
      case "KeyS":
        flag = this.keys[2] == 1;
        this.keys[2] = 0;
        break;
      case "KeyD":
        flag = this.keys[3] == 1;
        this.keys[3] = 0;
        break;
      case "KeyM":
        this.unlock();
        break;
      case "ShiftLeft":
        this.sprint = 1;
        break;
      default:
        flag = false;
    }

    if (flag) this.calculateWorldVelocity();
  };

  dispose = () => {
    return this.disconnect();
  };

  lock = () => {
    this.element.requestPointerLock();
  };

  unlock = () => {
    this.element.ownerDocument.exitPointerLock();
  };

  disconnect = () => {
    this.element.ownerDocument.removeEventListener(
      "mousemove",
      this.onMouseMove,
    );
    this.element.ownerDocument.removeEventListener(
      "pointerlockchange",
      this.onPointerlockChange,
    );
    this.element.ownerDocument.removeEventListener(
      "pointerlockerror",
      this.onPointerlockError,
    );
  };

  connect = () => {
    this.element.ownerDocument.addEventListener("mousemove", this.onMouseMove);
    this.element.ownerDocument.addEventListener(
      "pointerlockchange",
      this.onPointerlockChange,
    );
    this.element.ownerDocument.addEventListener(
      "pointerlockerror",
      this.onPointerlockError,
    );
  };

  onPointerlockError = () => {
    console.error("Unable to use Pointer Lock API");
  };

  onPointerlockChange = (_event) => {
    if (this.element.ownerDocument.pointerLockElement) {
      this.locked();
    } else {
      this.unlocked();
    }
  };

  getObject = () => {
    return this.camera;
  };

  changed = () => {
    this.dispatchEvent({ type: "change" });
  };

  locked = () => {
    this.isLocked = true;

    this.dispatchEvent({ type: "lock" });
  };

  unlocked = () => {
    this.isLocked = false;

    this.dispatchEvent({ type: "unlock" });
  };
}
