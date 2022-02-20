/**
 * This code taken from threejs examples. It might be refactored or edit.
 * Source: https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/TrackballControls.js
 */

import { EventDispatcher, MOUSE, Quaternion, Vector2, Vector3 } from "three";

const _changeEvent = { type: "change" };
const _startEvent = { type: "start" };
const _endEvent = { type: "end" };

const TrackballState = Object.freeze({
  NONE: -1,
  ROTATE: 0,
  ZOOM: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_ZOOM_PAN: 4,
});

export default class TrackballControls extends EventDispatcher {
  constructor(camera, element) {
    super();

    if (!camera) throw new Error("The parameter 'camera' is required!");
    if (!element) throw new Error("The parameter 'element' is required!");

    this.camera = camera;
    this.element = element;

    this.enabled = true;

    this.screen = { left: 0, top: 0, width: 0, height: 0 };

    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.2;
    this.panSpeed = 0.3;

    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;

    this.staticMoving = false;
    this.dynamicDampingFactor = 0.2;

    this.minDistance = 0;
    this.maxDistance = Infinity;

    this.keys = ["KeyA", "KeyS", "KeyD"];

    this.mouseButtons = {
      LEFT: MOUSE.ROTATE,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.PAN,
    };

    // internals

    this.target = new Vector3();

    this.EPS = 0.000001;

    this.lastPosition = new Vector3();
    this.lastZoom = 1;

    this._state = TrackballState.NONE;
    this._keyState = TrackballState.NONE;
    this._touchZoomDistanceStart = 0;
    this._touchZoomDistanceEnd = 0;
    this._lastAngle = 0;

    this._eye = new Vector3();
    this._movePrev = new Vector2();
    this._moveCurr = new Vector2();
    this._lastAxis = new Vector3();
    this._zoomStart = new Vector2();
    this._zoomEnd = new Vector2();
    this._panStart = new Vector2();
    this._panEnd = new Vector2();
    this._pointers = [];
    this._pointerPositions = {};

    this.target0 = this.target.clone();
    this.position0 = this.camera.position.clone();
    this.up0 = this.camera.up.clone();
    this.zoom0 = this.camera.zoom;

    this.element.style.touchAction = "none";
    this.#registerEventListeners();

    // force an update at start
    this.update();
  }

  #registerEventListeners() {
    this.element.addEventListener("contextmenu", this.onContextMenu);
    this.element.addEventListener("pointerdown", this.onPointerDown);
    this.element.addEventListener("pointercancel", this.onPointerCancel);
    this.element.addEventListener("wheel", this.onMouseWheel, {
      passive: false,
    });
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("resize", this.onResize);
    this.onResize();
  }

  onContextMenu = (event) => {
    if (this.enabled === false) return;

    event.preventDefault();
  };

  onPointerDown = (event) => {
    if (this.enabled === false) return;

    if (this._pointers.length === 0) {
      this.element.setPointerCapture(event.pointerId);

      this.element.addEventListener("pointermove", this.onPointerMove);
      this.element.addEventListener("pointerup", this.onPointerUp);
    }

    //

    this.addPointer(event);

    if (event.pointerType === "touch") {
      this.onTouchStart(event);
    } else {
      this.onMouseDown(event);
    }
  };

  onPointerMove = (event) => {
    if (this.enabled === false) return;

    if (event.pointerType === "touch") {
      this.onTouchMove(event);
    } else {
      this.onMouseMove(event);
    }
  };

  onPointerUp = (event) => {
    if (this.enabled === false) return;

    if (event.pointerType === "touch") {
      this.onTouchEnd(event);
    } else {
      this.onMouseUp();
    }

    //

    this.removePointer(event);

    if (this._pointers.length === 0) {
      this.element.releasePointerCapture(event.pointerId);

      this.element.removeEventListener("pointermove", this.onPointerMove);
      this.element.removeEventListener("pointerup", this.onPointerUp);
    }
  };

  onPointerCancel = (event) => {
    this.removePointer(event);
  };

  onKeyDown = (event) => {
    event.preventDefault();

    if (this.enabled === false) return;

    window.removeEventListener("keydown", this.onKeyDown);
    console.log(this._keyState, event.code);

    if (this._keyState !== TrackballState.NONE) {
      return;
    } else if (
      event.code === this.keys[TrackballState.ROTATE] &&
      !this.noRotate
    ) {
      this._keyState = TrackballState.ROTATE;
    } else if (event.code === this.keys[TrackballState.ZOOM] && !this.noZoom) {
      this._keyState = TrackballState.ZOOM;
    } else if (event.code === this.keys[TrackballState.PAN] && !this.noPan) {
      this._keyState = TrackballState.PAN;
    }

    console.log(this._keyState, event.code);
  };

  onKeyUp = (event) => {
    event.preventDefault();

    if (this.enabled === false) return;

    this._keyState = TrackballState.NONE;

    window.addEventListener("keydown", this.onKeyDown);
  };

  onMouseDown = (event) => {
    if (this._state === TrackballState.NONE) {
      switch (event.button) {
        case this.mouseButtons.LEFT:
          this._state = TrackballState.ROTATE;
          break;

        case this.mouseButtons.MIDDLE:
          this._state = TrackballState.ZOOM;
          break;

        case this.mouseButtons.RIGHT:
          this._state = TrackballState.PAN;
          break;

        default:
          this._state = TrackballState.NONE;
      }
    }

    const state =
      this._keyState !== TrackballState.NONE ? this._keyState : this._state;

    if (state === TrackballState.ROTATE && !this.noRotate) {
      this._moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
      this._movePrev.copy(this._moveCurr);
    } else if (state === TrackballState.ZOOM && !this.noZoom) {
      this._zoomStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
      this._zoomEnd.copy(this._zoomStart);
    } else if (state === TrackballState.PAN && !this.noPan) {
      this._panStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
      this._panEnd.copy(this._panStart);
    }

    this.dispatchEvent(_startEvent);
  };

  onMouseMove = (event) => {
    const state =
      this._keyState !== TrackballState.NONE ? this._keyState : this._state;

    if (state === TrackballState.ROTATE && !this.noRotate) {
      this._movePrev.copy(this._moveCurr);
      this._moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
    } else if (state === TrackballState.ZOOM && !this.noZoom) {
      this._zoomEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
    } else if (state === TrackballState.PAN && !this.noPan) {
      this._panEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
    }
  };

  onMouseUp = () => {
    this._state = TrackballState.NONE;

    this.dispatchEvent(_endEvent);
  };

  onMouseWheel = (event) => {
    if (this.enabled === false) return;

    if (this.noZoom === true) return;

    event.preventDefault();

    switch (event.deltaMode) {
      case 2:
        // Zoom in pages
        this._zoomStart.y -= event.deltaY * 0.025;
        break;

      case 1:
        // Zoom in lines
        this._zoomStart.y -= event.deltaY * 0.01;
        break;

      default:
        // undefined, 0, assume pixels
        this._zoomStart.y -= event.deltaY * 0.00025;
        break;
    }

    this.dispatchEvent(_startEvent);
    this.dispatchEvent(_endEvent);
  };

  onTouchStart = (event) => {
    this.trackPointer(event);

    switch (this._pointers.length) {
      case 1:
        this._state = TrackballState.TOUCH_ROTATE;
        this._moveCurr.copy(
          this.getMouseOnCircle(
            this._pointers[0].pageX,
            this._pointers[0].pageY,
          ),
        );
        this._movePrev.copy(this._moveCurr);
        break;

      default: {
        // 2 or more
        this._state = TrackballState.TOUCH_ZOOM_PAN;
        const dx = this._pointers[0].pageX - this._pointers[1].pageX;
        const dy = this._pointers[0].pageY - this._pointers[1].pageY;
        this._touchZoomDistanceEnd = this._touchZoomDistanceStart = Math.sqrt(
          dx * dx + dy * dy,
        );

        const x = (this._pointers[0].pageX + this._pointers[1].pageX) / 2;
        const y = (this._pointers[0].pageY + this._pointers[1].pageY) / 2;
        this._panStart.copy(this.getMouseOnScreen(x, y));
        this._panEnd.copy(this._panStart);
        break;
      }
    }

    this.dispatchEvent(_startEvent);
  };

  onTouchMove = (event) => {
    this.trackPointer(event);

    switch (this._pointers.length) {
      case 1:
        this._movePrev.copy(this._moveCurr);
        this._moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
        break;

      default: {
        // 2 or more

        const position = this.getSecondPointerPosition(event);

        const dx = event.pageX - position.x;
        const dy = event.pageY - position.y;
        this._touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

        const x = (event.pageX + position.x) / 2;
        const y = (event.pageY + position.y) / 2;
        this._panEnd.copy(this.getMouseOnScreen(x, y));
        break;
      }
    }
  };

  onTouchEnd = (event) => {
    switch (this._pointers.length) {
      case 0:
        this._state = TrackballState.NONE;
        break;

      case 1:
        this._state = TrackballState.TOUCH_ROTATE;
        this._moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
        this._movePrev.copy(this._moveCurr);
        break;

      case 2:
        this._state = TrackballState.TOUCH_ZOOM_PAN;
        this._moveCurr.copy(
          this.getMouseOnCircle(
            event.pageX - this._movePrev.pageX,
            event.pageY - this._movePrev.pageY,
          ),
        );
        this._movePrev.copy(this._moveCurr);
        break;
    }

    this.dispatchEvent(_endEvent);
  };

  addPointer = (event) => {
    this._pointers.push(event);
  };

  removePointer = (event) => {
    delete this._pointerPositions[event.pointerId];

    for (let i = 0; i < this._pointers.length; i++) {
      if (this._pointers[i].pointerId == event.pointerId) {
        this._pointers.splice(i, 1);
        return;
      }
    }
  };

  trackPointer = (event) => {
    let position = this._pointerPositions[event.pointerId];

    if (position === undefined) {
      position = new Vector2();
      this._pointerPositions[event.pointerId] = position;
    }

    position.set(event.pageX, event.pageY);
  };

  getSecondPointerPosition = (event) => {
    const pointer =
      event.pointerId === this._pointers[0].pointerId
        ? this._pointers[1]
        : this._pointers[0];

    return this._pointerPositions[pointer.pointerId];
  };

  getMouseOnScreen = (() => {
    const vector = new Vector2();

    return (pageX, pageY) => {
      vector.set(
        (pageX - this.screen.left) / this.screen.width,
        (pageY - this.screen.top) / this.screen.height,
      );

      return vector;
    };
  })();

  getMouseOnCircle = (() => {
    const vector = new Vector2();

    return (pageX, pageY) => {
      vector.set(
        (pageX - this.screen.width * 0.5 - this.screen.left) /
          (this.screen.width * 0.5),
        (this.screen.height + 2 * (this.screen.top - pageY)) /
          this.screen.width, // screen.width intentional
      );

      return vector;
    };
  })();

  rotateCamera = (() => {
    const axis = new Vector3(),
      quaternion = new Quaternion(),
      eyeDirection = new Vector3(),
      objectUpDirection = new Vector3(),
      objectSidewaysDirection = new Vector3(),
      moveDirection = new Vector3();

    return () => {
      moveDirection.set(
        this._moveCurr.x - this._movePrev.x,
        this._moveCurr.y - this._movePrev.y,
        0,
      );
      let angle = moveDirection.length();

      if (angle) {
        this._eye.copy(this.camera.position).sub(this.target);

        eyeDirection.copy(this._eye).normalize();
        objectUpDirection.copy(this.camera.up).normalize();
        objectSidewaysDirection
          .crossVectors(objectUpDirection, eyeDirection)
          .normalize();

        objectUpDirection.setLength(this._moveCurr.y - this._movePrev.y);
        objectSidewaysDirection.setLength(this._moveCurr.x - this._movePrev.x);

        moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));

        axis.crossVectors(moveDirection, this._eye).normalize();

        angle *= this.rotateSpeed;
        quaternion.setFromAxisAngle(axis, angle);

        this._eye.applyQuaternion(quaternion);
        this.camera.up.applyQuaternion(quaternion);

        this._lastAxis.copy(axis);
        this._lastAngle = angle;
      } else if (!this.staticMoving && this._lastAngle) {
        this._lastAngle *= Math.sqrt(1.0 - this.dynamicDampingFactor);
        this._eye.copy(this.camera.position).sub(this.target);
        quaternion.setFromAxisAngle(this._lastAxis, this._lastAngle);
        this._eye.applyQuaternion(quaternion);
        this.camera.up.applyQuaternion(quaternion);
      }

      this._movePrev.copy(this._moveCurr);
    };
  })();

  zoomCamera = () => {
    let factor;

    if (this._state === TrackballState.TOUCH_ZOOM_PAN) {
      factor = this._touchZoomDistanceStart / this._touchZoomDistanceEnd;
      this._touchZoomDistanceStart = this._touchZoomDistanceEnd;

      if (this.camera.isPerspectiveCamera) {
        this._eye.multiplyScalar(factor);
      } else if (this.camera.isOrthographicCamera) {
        this.camera.zoom /= factor;
        this.camera.updateProjectionMatrix();
      } else {
        console.warn("THREE.TrackballControls: Unsupported camera type");
      }
    } else {
      factor = 1.0 + (this._zoomEnd.y - this._zoomStart.y) * this.zoomSpeed;

      if (factor !== 1.0 && factor > 0.0) {
        if (this.camera.isPerspectiveCamera) {
          this._eye.multiplyScalar(factor);
        } else if (this.camera.isOrthographicCamera) {
          this.camera.zoom /= factor;
          this.camera.updateProjectionMatrix();
        } else {
          console.warn("THREE.TrackballControls: Unsupported camera type");
        }
      }

      if (this.staticMoving) {
        this._zoomStart.copy(this._zoomEnd);
      } else {
        this._zoomStart.y +=
          (this._zoomEnd.y - this._zoomStart.y) * this.dynamicDampingFactor;
      }
    }
  };

  panCamera = (() => {
    const mouseChange = new Vector2(),
      objectUp = new Vector3(),
      pan = new Vector3();

    return () => {
      mouseChange.copy(this._panEnd).sub(this._panStart);

      if (mouseChange.lengthSq()) {
        if (this.camera.isOrthographicCamera) {
          const scale_x =
            (this.camera.right - this.camera.left) /
            this.camera.zoom /
            this.element.clientWidth;
          const scale_y =
            (this.camera.top - this.camera.bottom) /
            this.camera.zoom /
            this.element.clientWidth;

          mouseChange.x *= scale_x;
          mouseChange.y *= scale_y;
        }

        mouseChange.multiplyScalar(this._eye.length() * this.panSpeed);

        pan.copy(this._eye).cross(this.camera.up).setLength(mouseChange.x);
        pan.add(objectUp.copy(this.camera.up).setLength(mouseChange.y));

        this.camera.position.add(pan);
        this.target.add(pan);

        if (this.staticMoving) {
          this._panStart.copy(this._panEnd);
        } else {
          this._panStart.add(
            mouseChange
              .subVectors(this._panEnd, this._panStart)
              .multiplyScalar(this.dynamicDampingFactor),
          );
        }
      }
    };
  })();

  checkDistances = () => {
    if (!this.noZoom || !this.noPan) {
      if (this._eye.lengthSq() > this.maxDistance * this.maxDistance) {
        this.camera.position.addVectors(
          this.target,
          this._eye.setLength(this.maxDistance),
        );
        this._zoomStart.copy(this._zoomEnd);
      }

      if (this._eye.lengthSq() < this.minDistance * this.minDistance) {
        this.camera.position.addVectors(
          this.target,
          this._eye.setLength(this.minDistance),
        );
        this._zoomStart.copy(this._zoomEnd);
      }
    }
  };

  update = () => {
    this._eye.subVectors(this.camera.position, this.target);

    if (!this.noRotate) {
      this.rotateCamera();
    }

    if (!this.noZoom) {
      this.zoomCamera();
    }

    if (!this.noPan) {
      this.panCamera();
    }

    this.camera.position.addVectors(this.target, this._eye);

    if (this.camera.isPerspectiveCamera) {
      this.checkDistances();

      this.camera.lookAt(this.target);

      if (
        this.lastPosition.distanceToSquared(this.camera.position) > this.EPS
      ) {
        this.dispatchEvent(_changeEvent);

        this.lastPosition.copy(this.camera.position);
      }
    } else if (this.camera.isOrthographicCamera) {
      this.camera.lookAt(this.target);

      if (
        this.lastPosition.distanceToSquared(this.camera.position) > this.EPS ||
        this.lastZoom !== this.camera.zoom
      ) {
        this.dispatchEvent(_changeEvent);

        this.lastPosition.copy(this.camera.position);
        this.lastZoom = this.camera.zoom;
      }
    } else {
      console.warn("THREE.TrackballControls: Unsupported camera type");
    }
  };

  reset = () => {
    this._state = TrackballState.NONE;
    this._keyState = TrackballState.NONE;

    this.target.copy(this.target0);
    this.camera.position.copy(this.position0);
    this.camera.up.copy(this.up0);
    this.camera.zoom = this.zoom0;

    this.camera.updateProjectionMatrix();

    this._eye.subVectors(this.camera.position, this.target);

    this.camera.lookAt(this.target);

    this.dispatchEvent(_changeEvent);

    this.lastPosition.copy(this.camera.position);
    this.lastZoom = this.camera.zoom;
  };

  onResize = () => {
    const box = this.element.getBoundingClientRect();
    // adjustments come from similar code in the jquery offset() function
    const d = this.element.ownerDocument.documentElement;
    this.screen.left = box.left + window.pageXOffset - d.clientLeft;
    this.screen.top = box.top + window.pageYOffset - d.clientTop;
    this.screen.width = box.width;
    this.screen.height = box.height;
  };

  dispose = () => {
    this.element.style.touchAction = "auto";

    this.element.removeEventListener("contextmenu", this.onContextMenu);

    this.element.removeEventListener("pointerdown", this.onPointerDown);
    this.element.removeEventListener("pointercancel", this.onPointerCancel);
    this.element.removeEventListener("wheel", this.onMouseWheel);

    this.element.removeEventListener("pointermove", this.onPointerMove);
    this.element.removeEventListener("pointerup", this.onPointerUp);

    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  };
}
