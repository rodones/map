import { LitElement, html, css } from "lit";
import { createRef, ref } from "lit-html/directives/ref.js";
import nipplejs from "nipplejs";

export class PointerLockJoyStick extends LitElement {
  static get styles() {
    return css`
      .container {
        position: absolute;
        bottom: 10px;
        left: 10px;
        display: flex;
        gap: 20px;
        user-select: none;
      }

      .joystick {
        pointer-events: auto;
        display: block;
        position: relative;

        background-color: transparent;
        width: 100px;
        height: 100px;
        z-index: 12;
        touch-action: manipulation;
      }
    `;
  }

  #moveJoyStickRef = createRef();
  #cameraJoyStickRef = createRef();
  #moveDir = {
    previous: "",
    current: "",
  };
  #cameraMove = {
    x: 0,
    y: 0,
  };

  constructor() {
    super();

    this.dirToKeyMap = {
      up: "W",
      left: "A",
      down: "S",
      right: "D",
    };
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    if (this.keyEventLoopId) cancelAnimationFrame(this.keyEventLoopId);
    if (this.mouseEventLoopId) cancelAnimationFrame(this.mouseEventLoopId);
    this.moveJoyStick.off();
    this.cameraJoyStick.off();
    super.disconnectedCallback();
  }

  firstUpdated() {
    const settings = {
      size: 100,
      multitouch: false,
      mode: "static",
      restJoystick: true,
      shape: "circle",
      position: { top: "50px", left: "50px" },
      dynamicPage: true,
    };

    // trigger to calibrate
    document.dispatchEvent(
      new MouseEvent("mousemove", {
        movementX: 0,
        movementY: 0,
        relatedTarget: this,
      }),
    );

    this.moveJoyStick = nipplejs.create({
      zone: this.#moveJoyStickRef.value,
      ...settings,
    });

    this.moveJoyStick.on("start", () => {
      this.#moveDir = {
        previous: "",
        current: "",
      };
      this.#simulateKeyboardEvents();
    });

    this.moveJoyStick.on("dir", (_, data) => {
      this.#moveDir = {
        previous: this.#moveDir.current,
        current: data.direction.angle,
      };
    });

    this.moveJoyStick.on("end", () => {
      this.#moveDir = {
        previous: this.#moveDir.current,
        current: "",
      };
    });

    this.cameraJoyStick = nipplejs.create({
      zone: this.#cameraJoyStickRef.value,
      ...settings,
    });

    this.cameraJoyStick.on("start", () => {
      this.#cameraMove = { x: 0, y: 0, type: "start" };
      this.#simulateMouseEvents();
    });

    this.cameraJoyStick.on("move", (_, data) => {
      this.#cameraMove = {
        x: (data.vector.x * data.distance) / 10,
        y: (-data.vector.y * data.distance) / 10,
        type: "move",
      };
    });

    this.cameraJoyStick.on("end", () => {
      this.#cameraMove = { x: 0, y: 0, type: "end" };
    });
  }

  #simulateKeyboardEvents = () => {
    const { current, previous } = this.#moveDir;

    if ((current === previous || previous === "") && current !== "") {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Key" + this.dirToKeyMap[current],
        }),
      );
    } else if (current === "" && previous !== "") {
      document.dispatchEvent(
        new KeyboardEvent("keyup", {
          code: "Key" + this.dirToKeyMap[previous],
        }),
      );
    } else if (current !== previous && previous !== "" && current !== "") {
      document.dispatchEvent(
        new KeyboardEvent("keyup", {
          code: "Key" + this.dirToKeyMap[previous],
        }),
      );

      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Key" + this.dirToKeyMap[current],
        }),
      );
    }

    if (current === "" && previous !== "") {
      this.keyEventLoopId = 0;
    } else {
      this.keyEventLoopId = requestAnimationFrame(this.#simulateKeyboardEvents);
    }
  };

  #simulateMouseEvents = () => {
    const { x, y, type } = this.#cameraMove;

    if (type === "end") {
      this.mouseEventLoopId = 0;
    } else {
      if (type === "move") {
        document.dispatchEvent(
          new MouseEvent("mousemove", {
            movementX: x,
            movementY: y,
            relatedTarget: this,
          }),
        );
      }
      this.mouseEventLoopId = requestAnimationFrame(this.#simulateMouseEvents);
    }
  };

  render() {
    return html`<div class="container">
      <div class="joystick" ${ref(this.#moveJoyStickRef)}></div>
      <div class="joystick" ${ref(this.#cameraJoyStickRef)}></div>
    </div>`;
  }
}

window.customElements.define("rodo-pointer-lock-joystick", PointerLockJoyStick);
