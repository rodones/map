import { LitElement, html, css } from "lit";
import { ref, createRef } from "lit/directives/ref.js";
import {
  AmbientLight,
  DirectionalLight,
  Fog,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  Color,
} from "three";
import {
  MapControls,
  OrbitControls,
  PointerLockControls,
  TrackballControls,
} from "../controls";
import { NexusObject } from "../vendors/NexusObject";

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
  `;

  static properties = {
    controlType: { type: String, attribute: "control-type" },
    model: { type: String },
  };

  canvasRef = createRef();

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
    this.scene.background = new Color(0x000000);
    this.scene.fog = new Fog(0x050505, 2000, 3500);
    this.scene.add(new AmbientLight(0x444444));

    const light1 = new DirectionalLight(0xffffff, 1.0);
    light1.position.set(1, 1, -1);
    this.scene.add(light1);

    const light2 = new DirectionalLight(0xffffff, 1.0);
    light2.position.set(-1, -1, 1);
    this.scene.add(light2);
  }

  _createRenderer() {
    const canvas = this.canvasRef.value;

    this.renderer = new WebGLRenderer({
      antialias: false,
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
      0.001,
      100,
    );
    this.camera.position.z = 4.0;
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

    this.controls = new PointerLockControls(this.camera, canvas);

    // const blocker = document.getElementById("blocker");
    // const instructions = document.getElementById("instructions");

    // instructions.addEventListener("click", function () {
    //   this.controls.lock();
    // });

    // this.controls.addEventListener("lock", function () {
    //   instructions.style.display = "none";
    //   blocker.style.display = "none";
    // });

    // this.controls.addEventListener("unlock", function () {
    //   blocker.style.display = "block";
    //   instructions.style.display = "";
    // });

    // this.scene.add(this.controls.getObject());
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
    const mapFile =
      "https://rodones.fra1.digitaloceanspaces.com/map/meshes/" +
      (new URL(window.location).searchParams.get("model") || "sonnn.nxs");

    /* An appropriate material can be used as optional fifth arg for the NexusObject constructor */
    let material = false;
    /* Material customizations examples: */
    //let material = new PointsMaterial( {  size:3, color: 0x00ff00, transparent: false, opacity:0.25 } );
    //let material = new MeshLambertMaterial( { color: 0xff0000, vertexColors: VertexColors } );
    //let material = new MeshNormalMaterial({ flatShading: true });

    this.scene.add(
      new NexusObject(
        mapFile,
        (nexusObj) => {
          const s = 1 / nexusObj.geometry.boundingSphere.radius;
          const target = new Vector3();
          const p = nexusObj.geometry.boundingBox.getCenter(target).negate();
          nexusObj.position.set(p.x * s, p.y * s, p.z * s);
          nexusObj.scale.set(s, s, s);
          nexusObj.rotation.x = Math.PI;
          //	nexus_obj.material = new PointsMaterial( {  size:3, color: 0x00ff00, transparent: false, opacity:0.25 } );
          this.reDraw = true;
        },
        () => {
          this.reDraw = true;
        },
        this.renderer,
        material,
      ),
    );
  }

  _animate() {
    requestAnimationFrame(this._animate.bind(this));
    this.controls.update();
    if (this.reDraw) {
      this.renderer.render(this.scene, this.camera);
      this.reDraw = false;
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

  render() {
    console.log("canvas rendering");
    return html`<canvas id="canvas" ${ref(this.canvasRef)}></canvas>`;
  }
}

export const registerCanvas = () =>
  window.customElements.define("rodo-canvas", Canvas);
