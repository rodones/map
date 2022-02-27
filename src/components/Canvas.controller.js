import {
  AmbientLight,
  DirectionalLight,
  Fog,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Color,
  Mesh,
  AxesHelper,
  MeshBasicMaterial,
} from "three";

/**
 * @typedef {import("./Canvas").Canvas} Canvas
 */

export class CanvasController {
  /**
   * @param {Canvas} host
   */
  constructor(host) {
    /**
     * @type {Canvas}
     */
    this.host = host;
    /**
     * @type {boolean}
     */
    this.reDraw = false;
    /**
     * @type {ControlProvider}
     */
    this.controlProvider = new ControlProvider();
    this.controlProvider.setController(this);

    host.addController(this);
  }

  /**
   * @param {ControlProvider} controlProvider
   */
  setControlProvider(controlProvider) {
    this.controlProvider.destroy();
    controlProvider.setController(this);
    this.controlProvider = controlProvider;
  }

  createScene() {
    this.scene = new Scene();
    this.scene.background = new Color(0x0073b6);
    this.scene.fog = new Fog(0x050505, 2000, 3500);
    this.scene.add(new AmbientLight(0x444444));

    const light1 = new DirectionalLight(0xffffff, 1.0);
    light1.position.set(1, 1, -1);
    this.scene.add(light1);

    const light2 = new DirectionalLight(0xffffff, 1.0);
    light2.position.set(-1, -1, 1);
    this.scene.add(light2);

    this.scene.add(new AxesHelper(5));
  }

  createRenderer() {
    this.renderer = new WebGLRenderer({
      antialias: true,
      canvas: this.canvas,
    });
    this.renderer.setClearColor(this.scene.fog.color);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(
      this.canvas.offsetWidth,
      this.canvas.offsetHeight,
      false,
    );
  }

  createCamera() {
    this.camera = new PerspectiveCamera(
      60,
      this.canvas.offsetWidth / this.canvas.offsetHeight,
      1,
      2000,
    );
    this.camera.position.set(20, -10, 20);
    this.camera.rotation.set(-Math.PI / 2, -Math.PI / 2, -Math.PI / 2);
    this.#removeResizeHandler();
    this.#addResizeHandler();
  }

  async loadMap() {
    const material = new MeshBasicMaterial({
      color: true,
      vertexColors: true,
    });

    const format = this.host.model
      .slice(((this.host.model.lastIndexOf(".") - 1) >>> 0) + 2)
      .toLowerCase();

    switch (format) {
      case "nxs":
      case "nxz":
        await this.#loadNexusFile(material);
        break;
      case "ply":
        await this.#loadPLYFile(material);
        break;
      default:
        throw new Error("Unknown file format.");
    }
  }

  async #loadPLYFile(material) {
    const { PLYLoader } = await import(
      /* webpackChunkName: "PLYLoader" */ "../vendors/PLYLoader"
    );

    return new Promise((resolve, reject) => {
      new PLYLoader().load(
        this.host.model,
        (geometry) => {
          const obj = new Mesh(geometry, material);
          obj.name = "MAP_START";
          obj.position.set(0, 0, 0);
          this.scene.add(obj);
          this.reDraw = true;
          resolve();
        },
        () => {},
        reject,
      );
    });
  }

  async #loadNexusFile(material) {
    await import(/* webpackIgnore: true */ "vendors/nexus.js");
    const { NexusObject } = await import(
      /* webpackChunkName: "NexusObject" */ "../vendors/NexusObject"
    );

    return new Promise((resolve, reject) => {
      try {
        this.scene.add(
          new NexusObject(
            this.host.model,
            (obj) => {
              obj.name = "MAP_START";
              obj.position.set(0, 0, 0);
              this.reDraw = true;
              resolve();
            },
            () => {
              this.reDraw = true;
            },
            this.renderer,
            material,
          ),
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  #onResize = () => {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.controlProvider.update();

    this.reDraw = true;
  };

  #addResizeHandler() {
    window.addEventListener("resize", this.#onResize, false);
  }

  #removeResizeHandler() {
    window.removeEventListener("resize", this.#onResize, false);
  }

  createControls() {
    this.controlProvider.createControls();
  }

  animate() {
    this.controlProvider.animate();
  }

  get canvas() {
    return this.host.canvasRef.value;
  }

  get blocker() {
    return this.host.blockerRef.value;
  }

  get instructions() {
    return this.host.instructionsRef.value;
  }
}

export class ControlProvider {
  /**
   * @param {CanvasController} controller
   */
  setController(controller) {
    this.controller = controller;
  }

  createControls() {
    throw new Error("Not implemented.");
  }

  animate() {
    throw new Error("Not implemented.");
  }

  destroy() {}

  update() {}
}
