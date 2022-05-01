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
  Matrix4,
} from "three";
import Stats from "stats.js";

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

    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.dom.style.top = "35px";
    document.body.appendChild(this.stats.dom);
  }

  /**
   * @param {ControlProvider} controlProvider
   */
  setControlProvider(controlProvider) {
    if (this.animationRequestId) cancelAnimationFrame(this.animationRequestId);

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

  updateCamera({ position }) {
    if (Array.isArray(position)) {
      this.camera.position.set(...position);
    }
  }

  async loadMap() {
    await this.#loadFile(this.host.model, { name: "MAP_START" });
  }

  async #loadFile(file, settings) {
    const material = new MeshBasicMaterial({
      color: true,
      vertexColors: true,
    });

    const format = file
      .slice(((file.lastIndexOf(".") - 1) >>> 0) + 2)
      .toLowerCase();

    switch (format) {
      case "nxs":
      case "nxz":
        await this.#loadNexusFile(file, material, settings);
        break;
      case "ply":
        await this.#loadPLYFile(file, material, settings);
        break;
      case "json":
        await this.#loadJsonFile(file);
        break;
      default:
        throw new Error("Unknown file format.");
    }
  }

  async #loadJsonFile(file) {
    const data = await fetch(file).then((res) => res.json());

    return Promise.all(
      data.objects.map((object) => {
        const { file, ...settings } = object;
        return this.#loadFile(file, settings);
      }),
    );
  }

  async #loadPLYFile(file, material, settings) {
    const { PLYLoader } = await import(
      /* webpackChunkName: "PLYLoader" */ "../vendors/PLYLoader"
    );

    return new Promise((resolve, reject) => {
      new PLYLoader().load(
        file,
        (geometry) => {
          const obj = new Mesh(geometry, material);
          this.#handleObjectSettings(obj, settings);
          this.scene.add(obj);
          this.reDraw = true;
          resolve();
        },
        () => {},
        reject,
      );
    });
  }

  async #loadNexusFile(file, material, settings) {
    await import(/* webpackIgnore: true */ "./vendors/nexus.js");
    const { NexusObject } = await import(
      /* webpackChunkName: "NexusObject" */ "../vendors/NexusObject"
    );

    return new Promise((resolve, reject) => {
      try {
        this.scene.add(
          new NexusObject(
            file,
            (obj) => {
              this.#handleObjectSettings(obj, settings);
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

  #handleObjectSettings(mesh, { name, position, scale, matrix }) {
    if (name) {
      mesh.name = name;
    }

    if (position) {
      mesh.position.set(...position);
    }

    if (scale) {
      mesh.scale.set(scale);
    }

    if (matrix) {
      mesh.applyMatrix4(new Matrix4().fromArray(matrix));
    }
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
    this.stats.begin();
    this.controlProvider.animate();
    this.stats.end();
    this.animationRequestId = requestAnimationFrame(this.animate.bind(this));
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
