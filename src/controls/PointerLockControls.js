/**
 * This code taken from threejs examples. It might be refactored or edit.
 * Source: https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/PointerLockControls.js
 */

import { Matrix4, Raycaster } from "three";
import { Euler, EventDispatcher, Vector3, MathUtils } from "three";

export default class PointerLockControls extends EventDispatcher {
  constructor(camera, element, scene) {
    super();

    if (!camera) throw new Error("The parameter 'camera' is required!");
    if (!element) throw new Error("The parameter 'element' is required!");

    this.camera = camera;
    this.element = element;
    this.scene = scene

    this.isLocked = false; // parameter for checking can camera move

    // Constants
    this.minPolarAngle = 0;
    this.maxPolarAngle = Math.PI;
    this.delta = 0.165

    this.keys = [0, 0, 0, 0] // keys pressed, w a s d

    this.velocity = new Vector3(0, -1, 0); // Velocity to world
    this.relativeVelocity = new Vector3(0, 0, 0); // This indicates of camera's relative w a s d walk. a-d = x direction, w-s = z direction.

    this.direction = new Vector3(0, 0, -1); // Camera direction vector
    this.up = this.camera.up; // Camera up Vector
    this.right = new Vector3(); // Camera right Vector
    this.euler = new Euler(0, 0, 0, "YXZ"); // camera angle in euler format

    this.raycaster = new Raycaster( // TODO: Gelecekte bunu değiştir. Gökberke sor şu alltaki sikleri hep updatelemem gerekiyor mu?
      this.camera.position,
      this.direction,
      0,
      10,
    );

    this.connect();
  }

  move = (v) => {
    this.camera.position.x += v.x * this.delta;
    this.camera.position.y += v.y * this.delta;
    this.camera.position.z += v.z * this.delta;
  };

  #raycast() {
    this.raycaster.ray.origin = this.camera.position.clone();
    this.raycaster.ray.origin.y -= 5; // insan gözü gibi olsun yeri aşşağı indiriyor bu
    return this.raycaster.intersectObject(
      this.scene.getObjectByName("MAP_START"),
    );
  }

  animate() {
    const intersections = this.#raycast();

    if (intersections.length) {
      let intersectedVelo = this.calculateIntersectedVelocity(intersections);
      this.move(intersectedVelo);
    } else {
      this.move(this.velocity);
    }
  }

  calculateIntersectedVelocity(intersections) { // calculate intersected velocity
    let newVelocity = this.velocity.clone();
    let k = new Vector3();

    intersections.forEach((inter) => { // TODO Intersectionlar 1 olarak çıkıyor hep :(
      newVelocity.add(inter.face.normal);
      k.add(inter.face.normal);
    });

    return newVelocity;
  }

  calculateVelocity() { // calculate world velocity 
    this.calculateRelativeVelocity();
    this.calculateRightVector();

    let dirVector = this.direction.clone()
    let rightVector = this.right.clone()

    dirVector.multiplyScalar(-this.relativeVelocity.z).add(rightVector.multiplyScalar(this.relativeVelocity.x))
    this.velocity.x = dirVector.x;
    this.velocity.z = dirVector.z;
  }

  calculateRelativeVelocity() { // calculate relative velocity gathered from wasd keys
    this.relativeVelocity.x = this.keys[3] - this.keys[1]; // a - d
    this.relativeVelocity.z = this.keys[2] - this.keys[0]; // w - s
  }

  calculateNewDirection() { // calculate world direction
    this.calculateUpVector();
    this.camera.getWorldDirection(this.direction);
  }

  calculateUpVector() { // calculates camera up vector
    var rotationMatrix = new Matrix4().extractRotation(this.camera.matrixWorld);
    this.camera.up = new Vector3(0, 1, 0).applyMatrix4(rotationMatrix).normalize();
    this.up = this.camera.up
  }

  calculateRightVector() { // calculate camera right vector
    this.right.crossVectors(this.direction, this.up);
  }

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

    this.calculateNewDirection();
    this.changed();
  };

  onKeyDown = (event) => {
    event.preventDefault();

    switch (event.code) {
      case "KeyW":
        this.keys[0] = 1;
        break;
      case "KeyA":
        this.keys[1] = 1;
        break;
      case "KeyS":
        this.keys[2] = 1;
        break;
      case "KeyD":
        this.keys[3] = 1;
        break;
    }
    this.calculateVelocity();
  }

  onKeyUp = (event) => {
    event.preventDefault();

    switch (event.code) {
      case "KeyW":
        this.keys[0] = 0;
        break;
      case "KeyA":
        this.keys[1] = 0;
        break;
      case "KeyS":
        this.keys[2] = 0;
        break;
      case "KeyD":
        this.keys[3] = 0;
        break;
    }
    this.calculateVelocity();
  }

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
