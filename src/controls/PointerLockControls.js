/**
 * This code taken from threejs examples. It might be refactored or edit.
 * Source: https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/PointerLockControls.js
 */

import { Euler, EventDispatcher, Vector3 } from "three";

export default class PointerLockControls extends EventDispatcher {
  constructor(camera, element) {
    super();

    if (!camera) throw new Error("The parameter 'camera' is required!");
    if (!element) throw new Error("The parameter 'element' is required!");

    this.camera = camera;
    this.element = element;

    this.isLocked = false;
    this.minPolarAngle = 0;
    this.maxPolarAngle = Math.PI;

    this.euler = new Euler(0, 0, 0, "YXZ");
    this.direction = new Vector3(0, 0, -1);
    this.vector = new Vector3();

    this.connect();
  }

  dispose = () => {
    return this.disconnect();
  };

  getObject = () => {
    return this.camera;
  };

  getDirection = (v) => {
    return v.copy(this.direction).applyQuaternion(this.camera.quaternion);
  };

  moveForward = (distance) => {
    this.vector.setFromMatrixColumn(this.camera.matrix, 0);
    this.vector.crossVectors(this.camera.up, this.vector);
    this.camera.position.addScaledVector(this.vector, distance);
  };

  moveRight = (distance) => {
    this.vector.setFromMatrixColumn(this.camera.matrix, 0);
    this.camera.position.addScaledVector(this.vector, distance);
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

  onMouseMove = (event) => {
    if (this.isLocked === false) return;

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

    this.changed();
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
