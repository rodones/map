import { LitElement, html, css } from "lit";
import { ref, createRef } from "lit/directives/ref.js";
import {
  AmbientLight,
  // DirectionalLight,
  Fog,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  Color,
  Mesh,
  AxesHelper,
  Raycaster,
} from "three";
import {
  MapControls,
  OrbitControls,
  PointerLockControls,
  TrackballControls,
} from "../controls";
import { NexusObject } from "../vendors/NexusObject";
import { PLYLoader } from "../vendors/PLYLoader";

export class Canvas extends LitElement {
  static styles = css`
    :host {
      display: table-cell;
      width: auto;
      height: 100%;
      vertical-align: top;
    }

    canvas {
      width: 100%;
      height: 100%;
    }

    .blocker {
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
    }

    .instructions {
      width: 100%;
      height: 100%;

      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      text-align: center;
      font-size: 14px;
      cursor: pointer;

      color: whitesmoke;
    }
  `;

  static properties = {
    controlType: { type: String, attribute: "control-type" },
    model: { type: String },
  };

  canvasRef = createRef();
  blockerRef = createRef();
  instructionsRef = createRef();

  constructor() {
    super();
    this.controlType = "trackball";
    this.reDraw = false;
  }

  firstUpdated() {
    if (!this.model) throw new Error("model cannot be empty!");

    this._createScene();
    this._createRenderer();
    this._createCamera();
    this._createControls();
    this._loadMap();
    this._animate();
  }

  _createScene() {
    this.scene = new Scene();
    this.scene.background = new Color(0, 0, 0);
    this.scene.fog = new Fog(0x050505, 2000, 3500);
    this.scene.add(new AmbientLight(0x444444));

    // const light1 = new DirectionalLight(0xffffff, 1.0);
    // light1.position.set(1, 1, -1);
    // this.scene.add(light1);

    // const light2 = new DirectionalLight(0xffffff, 1.0);
    // light2.position.set(-1, -1, 1);
    // this.scene.add(light2);

    this.scene.add(new AxesHelper(5));
  }

  _createRenderer() {
    const canvas = this.canvasRef.value;

    this.renderer = new WebGLRenderer({
      antialias: true,
      canvas,
    });
    this.renderer.setClearColor(this.scene.fog.color);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight, false);
  }

  _createCamera() {
    const canvas = this.canvasRef.value;

    this.camera = new PerspectiveCamera(
      30,
      canvas.offsetWidth / canvas.offsetHeight,
      1,
      2000,
    );
    this.camera.position.set(20, -10, 20);
    this.camera.rotation.set(-Math.PI / 2, -Math.PI / 2, -Math.PI / 2);
  }

  _createControls() {
    switch (this.controlType) {
      case "trackball":
        this._createTrackballControls();
        break;
      case "pointer-lock":
        this._createPointerLockControls();
        break;
      case "orbit":
        this._createOrbitControls();
        break;
      case "map":
        this._createMapControls();
        break;
      default:
        throw new Error("Invalid control type!");
    }
  }

  _createPointerLockControls() {
    const canvas = this.canvasRef.value;
    const blocker = this.blockerRef.value;
    const instructions = this.instructionsRef.value;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canJump = false;

    this.prevTime = performance.now();
    this.velocity = new Vector3();
    this.direction = new Vector3();
    this.vertex = new Vector3();
    this.color = new Color();

    this.controls = new PointerLockControls(this.camera, canvas);

    instructions.addEventListener("click", () => {
      this.controls.lock();
    });

    this.controls.addEventListener("lock", () => {
      instructions.style.display = "none";
      blocker.style.display = "none";
    });

    this.controls.addEventListener("unlock", () => {
      blocker.style.display = "block";
      instructions.style.display = "";
    });

    this.scene.add(this.controls.getObject());

    const onKeyDown = (event) => {
      event.preventDefault();

      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          this.moveForward = true;
          break;

        case "ArrowLeft":
        case "KeyA":
          this.moveLeft = true;
          break;

        case "ArrowDown":
        case "KeyS":
          this.moveBackward = true;
          break;

        case "ArrowRight":
        case "KeyD":
          this.moveRight = true;
          break;

        case "Space":
          if (this.canJump === true) this.velocity.y += 350;
          this.canJump = false;
          break;
      }
    };

    const onKeyUp = (event) => {
      event.preventDefault();

      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          this.moveForward = false;
          break;

        case "ArrowLeft":
        case "KeyA":
          this.moveLeft = false;
          break;

        case "ArrowDown":
        case "KeyS":
          this.moveBackward = false;
          break;

        case "ArrowRight":
        case "KeyD":
          this.moveRight = false;
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    this.raycaster = new Raycaster(
      new Vector3(),
      new Vector3(-1, -1, -1),
      0,
      10,
    );
  }

  _createTrackballControls() {
    const canvas = this.canvasRef.value;

    this.controls = new TrackballControls(this.camera, canvas);

    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;

    this.controls.keys = ["KeyA", "KeyS", "KeyD"];

    this.controls.addEventListener("change", () => {
      this.reDraw = true;
    });
  }

  _createOrbitControls() {
    const canvas = this.canvasRef.value;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.maxPolarAngle = Math.PI / 2;

    this.controls.listenToKeyEvents(window);
    this.controls.addEventListener("change", () => {
      this.reDraw = true;
    });
  }

  _createMapControls() {
    const canvas = this.canvasRef.value;

    this.controls = new MapControls(this.camera, canvas);

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

  _loadMap() {
    if (this.model.endsWith(".nxs") || this.model.endsWith(".nxz")) {
      /* An appropriate material can be used as optional fifth arg for the NexusObject constructor */
      let material = false;
      /* Material customizations examples: */
      //let material = new PointsMaterial( {  size:3, color: 0x00ff00, transparent: false, opacity:0.25 } );
      //let material = new MeshLambertMaterial( { color: 0xff0000, vertexColors: VertexColors } );
      //let material = new MeshNormalMaterial({ flatShading: true });

      this.scene.add(
        new NexusObject(
          this.model,
          (obj) => {
            // const s = 1 / nexusObj.geometry.boundingSphere.radius;
            // const target = new Vector3();
            // const p = nexusObj.geometry.boundingBox.getCenter(target).negate();
            // nexusObj.position.set(p.x * s, p.y * s, p.z * s);
            // nexusObj.scale.set(s, s, s);
            // nexusObj.rotation.y = Math.PI / 2;
            //	nexus_obj.material = new PointsMaterial( {  size:3, color: 0x00ff00, transparent: false, opacity:0.25 } );

            // obj.scale.set(5, 5, 5);
            obj.position.set(0, 0, 0);
            this.reDraw = true;
          },
          () => {
            this.reDraw = true;
          },
          this.renderer,
          material,
        ),
      );
    } else if (this.model.endsWith(".ply")) {
      const loader = new PLYLoader();
      loader.load(this.model, (geometry) => {
        const obj = new Mesh(geometry);
        obj.position.set(0, 0, 0);
        this.scene.add(obj);
        this.reDraw = true;
      });
    }
  }

  _animate() {
    requestAnimationFrame(this._animate.bind(this));

    if (this.controlType === "pointer-lock") {
      if (this.controls.isLocked) {
        const time = performance.now();

        this.raycaster.ray.origin.copy(this.controls.getObject().position);
        this.raycaster.ray.origin.y -= 10;

        // const intersections = this.raycaster.intersectObjects(objects, false);

        // const onObject = intersections.length > 0;

        const delta = (time - this.prevTime) / 1000;

        this.velocity.x -= this.velocity.x * delta;
        this.velocity.z -= this.velocity.z * delta;

        this.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize(); // this ensures consistent movements in all directions

        if (this.moveForward || this.moveBackward)
          this.velocity.z -= this.direction.z * 400.0 * delta;
        if (this.moveLeft || this.moveRight)
          this.velocity.x -= this.direction.x * 400.0 * delta;

        // if (onObject === true) {
        //   this.velocity.y = Math.max(0, this.velocity.y);
        //   this.canJump = true;
        // }

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        this.controls.getObject().position.y += this.velocity.y * delta; // new behavior

        if (this.controls.getObject().position.y < 10) {
          this.velocity.y = 0;
          this.controls.getObject().position.y = 10;

          this.canJump = true;
        }
        this.prevTime = time;
      }

      this.renderer.render(this.scene, this.camera);
    } else {
      this.controls.update();
      if (this.reDraw) {
        this.renderer.render(this.scene, this.camera);
        this.reDraw = false;
      }
    }
  }

  _handleResize() {
    window.addEventListener(
      "resize",
      () => {
        const canvas = this.canvasRef.value;
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
        this.controls.update();

        this.reDraw = true;
      },
      false,
    );
  }

  _renderBlocker() {
    return html`<div class="blocker" ${ref(this.blockerRef)}>
      <div class="instructions" ${ref(this.instructionsRef)}>
        <p style="font-size:36px">Click to play</p>
        <p>
          Move: WASD<br />
          Jump: SPACE<br />
          Look: MOUSE
        </p>
      </div>
    </div>`;
  }

  render() {
    const result = [];

    if (this.controlType === "pointer-lock") {
      result.push(this._renderBlocker());
    }

    result.push(html`<canvas ${ref(this.canvasRef)}></canvas>`);

    return result;
  }
}

window.customElements.define("rodo-canvas", Canvas);
