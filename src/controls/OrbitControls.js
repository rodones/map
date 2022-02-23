/**
 * This code taken from threejs examples. It might be refactored or edit.
 * Source: https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/OrbitControls.js
 */

import {
  EventDispatcher,
  MOUSE,
  Quaternion,
  Spherical,
  TOUCH,
  Vector2,
  Vector3,
} from "three";

const _changeEvent = {
  type: "change",
};
const _startEvent = {
  type: "start",
};
const _endEvent = {
  type: "end",
};

const EPS = 0.000001;
const twoPI = 2 * Math.PI;

const OrbitControlsStateEnum = Object.freeze({
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6,
});

export default class OrbitControls extends EventDispatcher {
  #state = OrbitControlsStateEnum.NONE;
  #domElementKeyEvents = null;

  #spherical = new Spherical();
  #sphericalDelta = new Spherical();
  #scale = 1;
  #panOffset = new Vector3();
  #zoomChanged = false;
  #rotateStart = new Vector2();
  #rotateEnd = new Vector2();
  #rotateDelta = new Vector2();
  #panStart = new Vector2();
  #panEnd = new Vector2();
  #panDelta = new Vector2();
  #dollyStart = new Vector2();
  #dollyEnd = new Vector2();
  #dollyDelta = new Vector2();
  #pointers = [];
  #pointerPositions = {};

  #updateOffset = new Vector3();
  #updateQuat;
  #updateQuatInverse;
  #updateLastPosition;
  #updateLastQuaternion;

  constructor(camera, element) {
    super();

    if (!camera) throw new Error("The parameter 'camera' is required!");
    if (!element) throw new Error("The parameter 'element' is required!");

    this.camera = camera;
    this.domElement = element;
    this.domElement.style.touchAction = "none"; // disable touch scroll
    // Set to false to disable this control

    this.enabled = true; // "target" sets the location of focus, where the object orbits around

    this.target = new Vector3(); // How far you can dolly in and out ( PerspectiveCamera only )

    this.minDistance = 0;
    this.maxDistance = Infinity; // How far you can zoom in and out ( OrthographicCamera only )

    this.minZoom = 0;
    this.maxZoom = Infinity; // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.

    this.minPolarAngle = 0; // radians

    this.maxPolarAngle = Math.PI; // radians
    // How far you can orbit horizontally, upper and lower limits.
    // If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )

    this.minAzimuthAngle = -Infinity; // radians

    this.maxAzimuthAngle = Infinity; // radians
    // Set to true to enable damping (inertia)
    // If damping is enabled, you must call controls.update() in your animation loop

    this.enableDamping = false;
    this.dampingFactor = 0.05; // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
    // Set to false to disable zooming

    this.enableZoom = true;
    this.zoomSpeed = 1.0; // Set to false to disable rotating

    this.enableRotate = true;
    this.rotateSpeed = 1.0; // Set to false to disable panning

    this.enablePan = true;
    this.panSpeed = 1.0;
    this.screenSpacePanning = true; // if false, pan orthogonal to world-space direction camera.up

    this.keyPanSpeed = 8.0; // pixels moved per arrow key push
    // Set to true to automatically rotate around the target
    // If auto-rotate is enabled, you must call controls.update() in your animation loop

    this.autoRotate = false;
    this.autoRotateSpeed = 2.0; // 30 seconds per orbit when fps is 60
    // The four arrow keys

    this.keys = {
      LEFT: "ArrowLeft",
      UP: "ArrowUp",
      RIGHT: "ArrowRight",
      BOTTOM: "ArrowDown",
    }; // Mouse buttons

    this.mouseButtons = {
      LEFT: MOUSE.ROTATE,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.PAN,
    }; // Touch fingers

    this.touches = {
      ONE: TOUCH.ROTATE,
      TWO: TOUCH.DOLLY_PAN,
    }; // for reset

    this.target0 = this.target.clone();
    this.position0 = this.camera.position.clone();
    this.zoom0 = this.camera.zoom; // the target DOM element for key events

    this.#updateQuat = new Quaternion().setFromUnitVectors(
      this.camera.up,
      new Vector3(0, 1, 0),
    );
    this.#updateQuatInverse = this.#updateQuat.clone().invert();
    this.#updateLastPosition = new Vector3();
    this.#updateLastQuaternion = new Quaternion();

    this.#handleEventListeners();
    this.update();
  }

  listenToKeyEvents(domElement) {
    domElement.addEventListener("keydown", this.#onKeyDown);
    this.#domElementKeyEvents = domElement;
  }

  saveState() {
    this.target0.copy(this.target);
    this.position0.copy(this.camera.position);
    this.zoom0 = this.camera.zoom;
  }

  reset() {
    this.target.copy(this.target0);
    this.camera.position.copy(this.position0);
    this.camera.zoom = this.zoom0;
    this.camera.updateProjectionMatrix();
    this.dispatchEvent(_changeEvent);
    this.update();
    this.#state = OrbitControlsStateEnum.NONE;
  }

  update = () => {
    const position = this.camera.position;
    this.#updateOffset.copy(position).sub(this.target); // rotate offset to "y-axis-is-up" space

    this.#updateOffset.applyQuaternion(this.#updateQuat); // angle from z-axis around y-axis

    this.#spherical.setFromVector3(this.#updateOffset);

    if (this.autoRotate && this.#state === OrbitControlsStateEnum.NONE) {
      this.#rotateLeft(this.#getAutoRotationAngle());
    }

    if (this.enableDamping) {
      this.#spherical.theta += this.#sphericalDelta.theta * this.dampingFactor;
      this.#spherical.phi += this.#sphericalDelta.phi * this.dampingFactor;
    } else {
      this.#spherical.theta += this.#sphericalDelta.theta;
      this.#spherical.phi += this.#sphericalDelta.phi;
    } // restrict theta to be between desired limits

    let min = this.minAzimuthAngle;
    let max = this.maxAzimuthAngle;

    if (isFinite(min) && isFinite(max)) {
      if (min < -Math.PI) min += twoPI;
      else if (min > Math.PI) min -= twoPI;
      if (max < -Math.PI) max += twoPI;
      else if (max > Math.PI) max -= twoPI;

      if (min <= max) {
        this.#spherical.theta = Math.max(
          min,
          Math.min(max, this.#spherical.theta),
        );
      } else {
        this.#spherical.theta =
          this.#spherical.theta > (min + max) / 2
            ? Math.max(min, this.#spherical.theta)
            : Math.min(max, this.#spherical.theta);
      }
    } // restrict phi to be between desired limits

    this.#spherical.phi = Math.max(
      this.minPolarAngle,
      Math.min(this.maxPolarAngle, this.#spherical.phi),
    );
    this.#spherical.makeSafe();
    this.#spherical.radius *= this.#scale; // restrict radius to be between desired limits

    this.#spherical.radius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.#spherical.radius),
    ); // move target to panned location

    if (this.enableDamping === true) {
      this.target.addScaledVector(this.#panOffset, this.dampingFactor);
    } else {
      this.target.add(this.#panOffset);
    }

    this.#updateOffset.setFromSpherical(this.#spherical); // rotate offset back to "camera-up-vector-is-up" space

    this.#updateOffset.applyQuaternion(this.#updateQuatInverse);
    position.copy(this.target).add(this.#updateOffset);
    this.camera.lookAt(this.target);

    if (this.enableDamping === true) {
      this.#sphericalDelta.theta *= 1 - this.dampingFactor;
      this.#sphericalDelta.phi *= 1 - this.dampingFactor;
      this.#panOffset.multiplyScalar(1 - this.dampingFactor);
    } else {
      this.#sphericalDelta.set(0, 0, 0);
      this.#panOffset.set(0, 0, 0);
    }

    this.#scale = 1; // update condition is:
    // min(camera displacement, camera rotation in radians)^2 > EPS
    // using small-angle approximation cos(x/2) = 1 - x^2 / 8

    if (
      this.#zoomChanged ||
      this.#updateLastPosition.distanceToSquared(this.camera.position) > EPS ||
      8 * (1 - this.#updateLastQuaternion.dot(this.camera.quaternion)) > EPS
    ) {
      this.dispatchEvent(_changeEvent);
      this.#updateLastPosition.copy(this.camera.position);
      this.#updateLastQuaternion.copy(this.camera.quaternion);
      this.#zoomChanged = false;
      return true;
    }

    return false;
  };

  dispose() {
    this.domElement.removeEventListener("contextmenu", this.#onContextMenu);
    this.domElement.removeEventListener("pointerdown", this.#onPointerDown);
    this.domElement.removeEventListener("pointercancel", this.#onPointerCancel);
    this.domElement.removeEventListener("wheel", this.#onMouseWheel);
    this.domElement.removeEventListener("pointermove", this.#onPointerMove);
    this.domElement.removeEventListener("pointerup", this.#onPointerUp);

    if (this.#domElementKeyEvents !== null) {
      this.#domElementKeyEvents.removeEventListener("keydown", this.#onKeyDown);
    }
  }

  #handleEventListeners() {
    this.domElement.addEventListener("contextmenu", this.#onContextMenu);
    this.domElement.addEventListener("pointerdown", this.#onPointerDown);
    this.domElement.addEventListener("pointercancel", this.#onPointerCancel);
    this.domElement.addEventListener("wheel", this.#onMouseWheel, {
      passive: false,
    });
  }

  getPolarAngle() {
    return this.#spherical.phi;
  }

  getAzimuthalAngle() {
    return this.#spherical.theta;
  }

  getDistance() {
    return this.camera.position.distanceTo(this.target);
  }

  #onPointerDown = (event) => {
    if (this.enabled === false) return;

    if (this.#pointers.length === 0) {
      this.domElement.setPointerCapture(event.pointerId);
      this.domElement.addEventListener("pointermove", this.#onPointerMove);
      this.domElement.addEventListener("pointerup", this.#onPointerUp);
    } //

    this.#addPointer(event);

    if (event.pointerType === "touch") {
      this.#onTouchStart(event);
    } else {
      this.#onMouseDown(event);
    }
  };

  #onTouchStart = (event) => {
    this.#trackPointer(event);

    switch (this.#pointers.length) {
      case 1:
        switch (this.touches.ONE) {
          case TOUCH.ROTATE:
            if (this.enableRotate === false) return;
            this.#handleTouchStartRotate();
            this.#state = OrbitControlsStateEnum.TOUCH_ROTATE;
            break;

          case TOUCH.PAN:
            if (this.enablePan === false) return;
            this.#handleTouchStartPan();
            this.#state = OrbitControlsStateEnum.TOUCH_PAN;
            break;

          default:
            this.#state = OrbitControlsStateEnum.NONE;
        }

        break;

      case 2:
        switch (this.touches.TWO) {
          case TOUCH.DOLLY_PAN:
            if (this.enableZoom === false && this.enablePan === false) return;
            this.#handleTouchStartDollyPan();
            this.#state = OrbitControlsStateEnum.TOUCH_DOLLY_PAN;
            break;

          case TOUCH.DOLLY_ROTATE:
            if (this.enableZoom === false && this.enableRotate === false)
              return;
            this.#handleTouchStartDollyRotate();
            this.#state = OrbitControlsStateEnum.TOUCH_DOLLY_ROTATE;
            break;

          default:
            this.#state = OrbitControlsStateEnum.NONE;
        }

        break;

      default:
        this.#state = OrbitControlsStateEnum.NONE;
    }

    if (this.#state !== OrbitControlsStateEnum.NONE) {
      this.dispatchEvent(_startEvent);
    }
  };

  #onTouchMove = (event) => {
    this.#trackPointer(event);

    switch (this.#state) {
      case OrbitControlsStateEnum.TOUCH_ROTATE:
        if (this.enableRotate === false) return;
        this.#handleTouchMoveRotate(event);
        this.update();
        break;

      case OrbitControlsStateEnum.TOUCH_PAN:
        if (this.enablePan === false) return;
        this.#handleTouchMovePan(event);
        this.update();
        break;

      case OrbitControlsStateEnum.TOUCH_DOLLY_PAN:
        if (this.enableZoom === false && this.enablePan === false) return;
        this.#handleTouchMoveDollyPan(event);
        this.update();
        break;

      case OrbitControlsStateEnum.TOUCH_DOLLY_ROTATE:
        if (this.enableZoom === false && this.enableRotate === false) return;
        this.#handleTouchMoveDollyRotate(event);
        this.update();
        break;

      default:
        this.#state = OrbitControlsStateEnum.NONE;
    }
  };

  #onContextMenu = (event) => {
    if (this.enabled === false) return;
    event.preventDefault();
  };

  #onPointerMove = (event) => {
    if (this.enabled === false) return;

    if (event.pointerType === "touch") {
      this.#onTouchMove(event);
    } else {
      this.#onMouseMove(event);
    }
  };

  #onPointerUp = (event) => {
    this.#removePointer(event);

    if (this.#pointers.length === 0) {
      this.domElement.releasePointerCapture(event.pointerId);
      this.domElement.removeEventListener("pointermove", this.#onPointerMove);
      this.domElement.removeEventListener("pointerup", this.#onPointerUp);
    }

    this.dispatchEvent(_endEvent);
    this.#state = OrbitControlsStateEnum.NONE;
  };

  #onPointerCancel = (event) => {
    this.#removePointer(event);
  };

  #onMouseDown = (event) => {
    let mouseAction;

    switch (event.button) {
      case 0:
        mouseAction = this.mouseButtons.LEFT;
        break;

      case 1:
        mouseAction = this.mouseButtons.MIDDLE;
        break;

      case 2:
        mouseAction = this.mouseButtons.RIGHT;
        break;

      default:
        mouseAction = -1;
    }

    switch (mouseAction) {
      case MOUSE.DOLLY:
        if (this.enableZoom === false) return;
        this.#handleMouseDownDolly(event);
        this.#state = OrbitControlsStateEnum.DOLLY;
        break;

      case MOUSE.ROTATE:
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          if (this.enablePan === false) return;
          this.#handleMouseDownPan(event);
          this.#state = OrbitControlsStateEnum.PAN;
        } else {
          if (this.enableRotate === false) return;
          this.#handleMouseDownRotate(event);
          this.#state = OrbitControlsStateEnum.ROTATE;
        }

        break;

      case MOUSE.PAN:
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          if (this.enableRotate === false) return;
          this.#handleMouseDownRotate(event);
          this.#state = OrbitControlsStateEnum.ROTATE;
        } else {
          if (this.enablePan === false) return;
          this.#handleMouseDownPan(event);
          this.#state = OrbitControlsStateEnum.PAN;
        }

        break;

      default:
        this.#state = OrbitControlsStateEnum.NONE;
    }

    if (this.#state !== OrbitControlsStateEnum.NONE) {
      this.dispatchEvent(_startEvent);
    }
  };

  #onMouseMove = (event) => {
    if (this.enabled === false) return;

    switch (this.#state) {
      case OrbitControlsStateEnum.ROTATE:
        if (this.enableRotate === false) return;
        this.#handleMouseMoveRotate(event);
        break;

      case OrbitControlsStateEnum.DOLLY:
        if (this.enableZoom === false) return;
        this.#handleMouseMoveDolly(event);
        break;

      case OrbitControlsStateEnum.PAN:
        if (this.enablePan === false) return;
        this.#handleMouseMovePan(event);
        break;
    }
  };

  #onMouseWheel = (event) => {
    if (
      this.enabled === false ||
      this.enableZoom === false ||
      this.#state !== OrbitControlsStateEnum.NONE
    )
      return;
    event.preventDefault();
    this.dispatchEvent(_startEvent);
    this.#handleMouseWheel(event);
    this.dispatchEvent(_endEvent);
  };

  #onKeyDown = (event) => {
    event.preventDefault();

    if (this.enabled === false || this.enablePan === false) return;
    this.#handleKeyDown(event);
  };

  #addPointer = (event) => {
    this.#pointers.push(event);
  };

  #removePointer = (event) => {
    delete this.#pointerPositions[event.pointerId];

    for (let i = 0; i < this.#pointers.length; i++) {
      if (this.#pointers[i].pointerId == event.pointerId) {
        this.#pointers.splice(i, 1);
        return;
      }
    }
  };

  #trackPointer = (event) => {
    let position = this.#pointerPositions[event.pointerId];

    if (position === undefined) {
      position = new Vector2();
      this.#pointerPositions[event.pointerId] = position;
    }

    position.set(event.pageX, event.pageY);
  };

  #getSecondPointerPosition = (event) => {
    const pointer =
      event.pointerId === this.#pointers[0].pointerId
        ? this.#pointers[1]
        : this.#pointers[0];
    return this.#pointerPositions[pointer.pointerId];
  };

  #handleMouseMoveRotate = (event) => {
    this.#rotateEnd.set(event.clientX, event.clientY);
    this.#rotateDelta
      .subVectors(this.#rotateEnd, this.#rotateStart)
      .multiplyScalar(this.rotateSpeed);

    this.#rotateLeft(
      (2 * Math.PI * this.#rotateDelta.x) / this.domElement.clientHeight,
    );
    this.#rotateUp(
      (2 * Math.PI * this.#rotateDelta.y) / this.domElement.clientHeight,
    );

    this.#rotateStart.copy(this.#rotateEnd);
    this.update();
  };

  #handleTouchMoveRotate = (event) => {
    if (this.#pointers.length == 1) {
      this.#rotateEnd.set(event.pageX, event.pageY);
    } else {
      const position = this.#getSecondPointerPosition(event);
      const x = 0.5 * (event.pageX + position.x);
      const y = 0.5 * (event.pageY + position.y);
      this.#rotateEnd.set(x, y);
    }

    this.#rotateDelta
      .subVectors(this.#rotateEnd, this.#rotateStart)
      .multiplyScalar(this.rotateSpeed);

    this.#rotateLeft(
      (2 * Math.PI * this.#rotateDelta.x) / this.domElement.clientHeight,
    );
    this.#rotateUp(
      (2 * Math.PI * this.#rotateDelta.y) / this.domElement.clientHeight,
    );

    this.#rotateStart.copy(this.#rotateEnd);
  };

  #handleMouseDownRotate = (event) => {
    this.#rotateStart.set(event.clientX, event.clientY);
  };

  #handleMouseDownDolly = (event) => {
    this.#dollyStart.set(event.clientX, event.clientY);
  };

  #handleMouseDownPan = (event) => {
    this.#panStart.set(event.clientX, event.clientY);
  };

  #handleMouseMoveDolly = (event) => {
    this.#dollyEnd.set(event.clientX, event.clientY);
    this.#dollyDelta.subVectors(this.#dollyEnd, this.#dollyStart);

    if (this.#dollyDelta.y > 0) {
      this.#dollyOut(this.#getZoomScale());
    } else if (this.#dollyDelta.y < 0) {
      this.#dollyIn(this.#getZoomScale());
    }

    this.#dollyStart.copy(this.#dollyEnd);
    this.update();
  };

  #handleMouseMovePan = (event) => {
    this.#panEnd.set(event.clientX, event.clientY);
    this.#panDelta
      .subVectors(this.#panEnd, this.#panStart)
      .multiplyScalar(this.panSpeed);
    this.#pan(this.#panDelta.x, this.#panDelta.y);
    this.#panStart.copy(this.#panEnd);
    this.update();
  };

  #handleMouseWheel = (event) => {
    if (event.deltaY < 0) {
      this.#dollyIn(this.#getZoomScale());
    } else if (event.deltaY > 0) {
      this.#dollyOut(this.#getZoomScale());
    }

    this.update();
  };

  #handleKeyDown = (event) => {
    let needsUpdate = true;

    switch (event.code) {
      case this.keys.UP:
        this.#pan(0, this.keyPanSpeed);
        break;
      case this.keys.BOTTOM:
        this.#pan(0, -this.keyPanSpeed);
        break;
      case this.keys.LEFT:
        this.#pan(this.keyPanSpeed, 0);
        break;
      case this.keys.RIGHT:
        this.#pan(-this.keyPanSpeed, 0);
        break;
      default:
        needsUpdate = false;
    }

    if (needsUpdate) {
      // prevent the browser from scrolling on cursor keys
      event.preventDefault();
      this.update();
    }
  };

  #handleTouchStartRotate() {
    if (this.#pointers.length === 1) {
      this.#rotateStart.set(this.#pointers[0].pageX, this.#pointers[0].pageY);
    } else {
      const x = 0.5 * (this.#pointers[0].pageX + this.#pointers[1].pageX);
      const y = 0.5 * (this.#pointers[0].pageY + this.#pointers[1].pageY);
      this.#rotateStart.set(x, y);
    }
  }

  #handleTouchStartPan() {
    if (this.#pointers.length === 1) {
      this.#panStart.set(this.#pointers[0].pageX, this.#pointers[0].pageY);
    } else {
      const x = 0.5 * (this.#pointers[0].pageX + this.#pointers[1].pageX);
      const y = 0.5 * (this.#pointers[0].pageY + this.#pointers[1].pageY);
      this.#panStart.set(x, y);
    }
  }

  #handleTouchStartDolly() {
    const dx = this.#pointers[0].pageX - this.#pointers[1].pageX;
    const dy = this.#pointers[0].pageY - this.#pointers[1].pageY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.#dollyStart.set(0, distance);
  }

  #handleTouchStartDollyPan() {
    if (this.enableZoom) this.#handleTouchStartDolly();
    if (this.enablePan) this.#handleTouchStartPan();
  }

  #handleTouchStartDollyRotate() {
    if (this.enableZoom) this.#handleTouchStartDolly();
    if (this.enableRotate) this.#handleTouchStartRotate();
  }

  #handleTouchMovePan = (event) => {
    if (this.#pointers.length === 1) {
      this.#panEnd.set(event.pageX, event.pageY);
    } else {
      const position = this.#getSecondPointerPosition(event);
      const x = 0.5 * (event.pageX + position.x);
      const y = 0.5 * (event.pageY + position.y);
      this.#panEnd.set(x, y);
    }

    this.#panDelta
      .subVectors(this.#panEnd, this.#panStart)
      .multiplyScalar(this.panSpeed);
    this.#pan(this.#panDelta.x, this.#panDelta.y);
    this.#panStart.copy(this.#panEnd);
  };

  #handleTouchMoveDolly = (event) => {
    const position = this.#getSecondPointerPosition(event);
    const dx = event.pageX - position.x;
    const dy = event.pageY - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.#dollyEnd.set(0, distance);
    this.#dollyDelta.set(
      0,
      Math.pow(this.#dollyEnd.y / this.#dollyStart.y, this.zoomSpeed),
    );
    this.#dollyOut(this.#dollyDelta.y);
    this.#dollyStart.copy(this.#dollyEnd);
  };

  #handleTouchMoveDollyPan = (event) => {
    if (this.enableZoom) this.#handleTouchMoveDolly(event);
    if (this.enablePan) this.#handleTouchMovePan(event);
  };

  #handleTouchMoveDollyRotate = (event) => {
    if (this.enableZoom) this.#handleTouchMoveDolly(event);
    if (this.enableRotate) this.#handleTouchMoveRotate(event);
  };

  #rotateLeft(angle) {
    this.#sphericalDelta.theta -= angle;
  }

  #rotateUp(angle) {
    this.#sphericalDelta.phi -= angle;
  }

  #getAutoRotationAngle() {
    return ((2 * Math.PI) / 60 / 60) * this.autoRotateSpeed;
  }

  #getZoomScale() {
    return Math.pow(0.95, this.zoomSpeed);
  }

  #panLeft = (function () {
    const v = new Vector3();
    return function panLeft(distance, objectMatrix) {
      v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix

      v.multiplyScalar(-distance);
      this.#panOffset.add(v);
    };
  })();

  #panUp = (() => {
    const v = new Vector3();
    return (distance, objectMatrix) => {
      if (this.screenSpacePanning === true) {
        v.setFromMatrixColumn(objectMatrix, 1);
      } else {
        v.setFromMatrixColumn(objectMatrix, 0);
        v.crossVectors(this.camera.up, v);
      }

      v.multiplyScalar(distance);
      this.#panOffset.add(v);
    };
  })(); // deltaX and deltaY are in pixels; right and down are positive

  #pan = (() => {
    const offset = new Vector3();
    return (deltaX, deltaY) => {
      const element = this.domElement;

      if (this.camera.isPerspectiveCamera) {
        // perspective
        const position = this.camera.position;
        offset.copy(position).sub(this.target);
        let targetDistance = offset.length(); // half of the fov is center to top of screen

        targetDistance *= Math.tan(((this.camera.fov / 2) * Math.PI) / 180.0); // we use only clientHeight here so aspect ratio does not distort speed

        this.#panLeft(
          (2 * deltaX * targetDistance) / element.clientHeight,
          this.camera.matrix,
        );
        this.#panUp(
          (2 * deltaY * targetDistance) / element.clientHeight,
          this.camera.matrix,
        );
      } else if (this.camera.isOrthographicCamera) {
        // orthographic
        this.#panLeft(
          (deltaX * (this.camera.right - this.camera.left)) /
            this.camera.zoom /
            element.clientWidth,
          this.camera.matrix,
        );
        this.#panUp(
          (deltaY * (this.camera.top - this.camera.bottom)) /
            this.camera.zoom /
            element.clientHeight,
          this.camera.matrix,
        );
      } else {
        // camera neither orthographic nor perspective
        console.warn(
          "WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.",
        );
        this.enablePan = false;
      }
    };
  })();

  #dollyOut(dollyScale) {
    if (this.camera.isPerspectiveCamera) {
      this.#scale /= dollyScale;
    } else if (this.camera.isOrthographicCamera) {
      this.camera.zoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, this.camera.zoom * dollyScale),
      );
      this.camera.updateProjectionMatrix();
      this.#zoomChanged = true;
    } else {
      console.warn(
        "WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.",
      );
      this.enableZoom = false;
    }
  }

  #dollyIn(dollyScale) {
    if (this.camera.isPerspectiveCamera) {
      this.#scale *= dollyScale;
    } else if (this.camera.isOrthographicCamera) {
      this.camera.zoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, this.camera.zoom / dollyScale),
      );
      this.camera.updateProjectionMatrix();
      this.#zoomChanged = true;
    } else {
      console.warn(
        "WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.",
      );
      this.enableZoom = false;
    }
  }
}
