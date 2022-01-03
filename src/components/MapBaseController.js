import {
  AmbientLight,
  DirectionalLight,
  Fog,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  Color,
  Mesh,
  AxesHelper,
  Raycaster,
  MeshBasicMaterial,
} from "three";
import {
  MapControls,
  OrbitControls,
  PointerLockControls,
  TrackballControls,
} from "../controls";
import { NexusObject } from "../vendors/NexusObject";
import { PLYLoader } from "../vendors/PLYLoader";

export class MapBaseController {
  constructor(host) {
    this.host = host;
    this.reDraw = false;

    host.addController(this);
  }

  getCanvas() {
    return this.host.canvasRef.value;
  }

  extendController(extender) {
    this.destroyControls();
    Object.assign(this, extender);
  }

  createScene() {
    this.scene = new Scene();
    this.scene.background = new Color(0, 0, 0);
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
    const canvas = this.getCanvas();

    this.renderer = new WebGLRenderer({
      antialias: true,
      canvas,
    });
    this.renderer.setClearColor(this.scene.fog.color);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight, false);
  }

  createCamera() {
    const canvas = this.getCanvas();

    this.camera = new PerspectiveCamera(
      30,
      canvas.offsetWidth / canvas.offsetHeight,
      1,
      2000,
    );
    this.camera.position.set(20, -10, 20);
    this.camera.rotation.set(-Math.PI / 2, -Math.PI / 2, -Math.PI / 2);
  }

  loadMap() {
    const material = new MeshBasicMaterial({
      color: true,
      vertexColors: true,
      faceColors: true,
    });

    if (this.host.model.endsWith(".nxs") || this.host.model.endsWith(".nxz")) {
      this.scene.add(
        new NexusObject(
          this.host.model,
          (obj) => {
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
    } else if (this.host.model.endsWith(".ply")) {
      const loader = new PLYLoader();
      loader.load(this.host.model, (geometry) => {
        const obj = new Mesh(geometry, material);
        obj.position.set(0, 0, 0);
        this.scene.add(obj);
        this.reDraw = true;
      });
    }
  }

  handleResize() {
    window.addEventListener(
      "resize",
      () => {
        const canvas = this.getCanvas();
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

  destroyControls() {
    console.log("empty");
  }

  createControls() {
    console.log("empty");
  }

  animate() {
    console.log("empty");
  }
}

export const PointerLockControlExtender = {
  getBlocker() {
    return this.host.blockerRef.value;
  },
  getInstructions() {
    return this.host.instructionsRef.value;
  },
  createControls() {
    const canvas = this.getCanvas();
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

    // TODO: handle properly
    setTimeout(() => {
      const blocker = this.getBlocker();
      const instructions = this.getInstructions();
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
    }, 500);

    this.scene.add(this.controls.getObject());

    this._onKeyDown = (event) => {
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
    this._onKeyUp = (event) => {
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

    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);

    this.raycaster = new Raycaster(
      new Vector3(),
      new Vector3(-1, -1, -1),
      0,
      10,
    );
  },
  animate() {
    this.animationRequestId = requestAnimationFrame(this.animate.bind(this));

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
  },
  destroyControls() {
    console.log("PointerLockControlExtender destroyControls");
    if (this.animationRequestId) cancelAnimationFrame(this.animationRequestId);
    delete this.raycaster;
    delete this.getBlocker;
    delete this.getInstructions;

    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);

    if (this.controls) {
      this.scene?.remove(this.controls.getObject());
      this.controls.dispose();
    }
    delete this.controls;

    delete this.moveForward;
    delete this.moveBackward;
    delete this.moveLeft;
    delete this.moveRight;
    delete this.canJump;
    delete this.prevTime;
    delete this.velocity;
    delete this.direction;
    delete this.vertex;
    delete this.color;
  },
};

export const MapControlExtender = {
  createControls() {
    const canvas = this.getCanvas();

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
  },
  animate() {
    this.animationRequestId = requestAnimationFrame(this.animate.bind(this));

    this.controls.update();
    if (this.reDraw) {
      this.renderer.render(this.scene, this.camera);
      this.reDraw = false;
    }
  },
  destroyControls() {
    console.log("MapControlExtender destroyControls");
    if (this.animationRequestId) cancelAnimationFrame(this.animationRequestId);

    this.controls?.dispose();
    delete this.controls;
  },
};

export const OrbitControlExtender = {
  createControls() {
    const canvas = this.getCanvas();

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.maxPolarAngle = Math.PI / 2;

    this.controls.listenToKeyEvents(window);
    this.controls.addEventListener("change", () => {
      this.reDraw = true;
    });
  },
  animate() {
    this.animationRequestId = requestAnimationFrame(this.animate.bind(this));

    this.controls.update();
    if (this.reDraw) {
      this.renderer.render(this.scene, this.camera);
      this.reDraw = false;
    }
  },
  destroyControls() {
    console.log("OrbitControlExtender destroyControls");
    if (this.animationRequestId) cancelAnimationFrame(this.animationRequestId);

    this.controls?.dispose();
    delete this.controls;
  },
};

export const TrackballControlExtender = {
  createControls() {
    const canvas = this.getCanvas();

    this.controls = new TrackballControls(this.camera, canvas);

    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;

    this.controls.keys = ["KeyA", "KeyS", "KeyD"];

    this.controls.addEventListener("change", () => {
      this.reDraw = true;
    });
  },
  animate() {
    this.animationRequestId = requestAnimationFrame(this.animate.bind(this));

    this.controls.update();
    if (this.reDraw) {
      this.renderer.render(this.scene, this.camera);
      this.reDraw = false;
    }
  },
  destroyControls() {
    console.log("Trackball destroyControls");
    if (this.animationRequestId) cancelAnimationFrame(this.animationRequestId);

    this.controls?.dispose();
    delete this.controls;
  },
};
