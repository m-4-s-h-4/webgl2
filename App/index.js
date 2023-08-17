import Stats from 'stats-js';
import {
  PerspectiveCamera,
  WebGLRenderer,
  Scene,
  Vector3,
  TextureLoader,
  Mesh,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  SphereGeometry,
  Box3,
  Sphere,
  Vector2,
  AnimationMixer,
  Raycaster,
  FrontSide,
  ShaderMaterial,
} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { initGUI } from './gui.js';
import { Lights } from './Lights.js';
import SnowParticles from './SnowParticles.js';
import { shimmerMaterial } from './Shader.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

export default class App {
  constructor() {
    this._renderer = undefined;
    this._camera = undefined;
    this._controls = undefined;
    this._composer = undefined;

    this.raycaster = new Raycaster();
    this.mouse = new Vector2();
    this.santaMesh = null;
    this.santaAction = null;

    this.glassSphere = null;

    this._scene = new Scene();
    this.tempVector3 = new Vector3();

    this.nightSkyTexture = new TextureLoader().load('/sky/night2.jpeg');
    this.sunsetSkyTexture = new TextureLoader().load('/sky/sunset.jpeg');

    this.snowParticles = new SnowParticles(this._scene, this.sphereRadius);

    this.audio = new Audio('/music/music.mp3');
    this.audio.loop = false;
    this.bloomOptions = {
      strength: 0.5,
      radius: 0.4,
      threshold: 0.85,
    };

    this._init();
  }

  _setSky(skyType) {
    switch (skyType) {
      case 'sunset':
        this._scene.background = this.sunsetSkyTexture;
        break;
      case 'night':
        this._scene.background = this.nightSkyTexture;
        break;
    }
  }

  async _loadModel(path) {
    return new Promise((resolve) => {
      const loader = new GLTFLoader();
      loader.load(path, resolve);
    });
  }

  async _init() {
    this._renderer = new WebGLRenderer({
      canvas: document.getElementById('canvas'),
      logarithmicDepthBuffer: true,
    });
    this._renderer.setSize(window.innerWidth, window.innerHeight);

    // Camera
    this._camera = new PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      600
    );
    this._camera.position.set(10, 5, 60);

    this._loadSanta();
    this._loadSnowman();
    this._setSky('sunset');

    //_______________________________________ICE TEXTURE_________________________________________
    const iceDiffuseTexture = new TextureLoader().load(
      '/texture/Blue_Ice_001_OCC.jpg'
    );
    const iceNormalMap = new TextureLoader().load(
      '/texture/Blue_Ice_001_NORM.jpg'
    );
    const iceDisplacementMap = new TextureLoader().load(
      '/texture/Blue_Ice_001_DISP.png'
    );
    const iceRoughnessMap = new TextureLoader().load(
      '/texture/Blue_Ice_001_ROUGH.jpg'
    );
    const iceAOMap = new TextureLoader().load('/texture/Blue_Ice_001_OCC.jpg');

    const iceMaterial = new MeshStandardMaterial({
      color: 0xadd8e6,
      map: iceDiffuseTexture,
      normalMap: iceNormalMap,
      displacementMap: iceDisplacementMap,
      roughnessMap: iceRoughnessMap,
      aoMap: iceAOMap,
      side: FrontSide,
    });

    iceMaterial.displacementScale = 0;
    iceMaterial.displacementBias = 0.02;
    //___________________________________________________________________________________________

    const mainSceneModel = await this._loadModel('/models/mainscene2.glb');
    const mainSceneMesh = mainSceneModel.scene;

    mainSceneMesh.traverse((child) => {
      if (child.isMesh) {
        child.material.side = FrontSide;
      }
    });

    this._scene.add(mainSceneMesh);

    this.applyIceTextureToMesh(this._scene, 'Ice_Sheet_phong2_0', iceMaterial);

    mainSceneMesh.scale.set(1.7, 1.7, 1.7);
    mainSceneMesh.position.set(0, -20, 0);
    this._scene.add(mainSceneMesh);
    this._initAnimations(mainSceneModel.animations);

    this._composer = new EffectComposer(this._renderer);
    const renderPass = new RenderPass(this._scene, this._camera);
    this._composer.addPass(renderPass);

    this._bloomPass = new UnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      this.bloomOptions.strength,
      this.bloomOptions.radius,
      this.bloomOptions.threshold
    );

    this._composer.addPass(this._bloomPass);

    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.05;
    this._controls.screenSpacePanning = false;
    this._controls.minDistance = 1;
    this._controls.maxDistance = 1000;
    this.sphereRadius = this._createGlassSphere(mainSceneMesh);
    this.snowParticles = new SnowParticles(this._scene, this.sphereRadius);

    this.lights = new Lights(this._scene, this._renderer);
    this._gui = initGUI(this);
    this._initEvents();
    this._start();
  }

  //snowman
  async _loadSnowman() {
    const snowmanModel = await this._loadModel('/models/snowman.glb');
    this.snowmanMesh = snowmanModel.scene;

    this.snowmanMesh.traverse((node) => {
      if (node.isMesh) {
        node.material.side = FrontSide;
      }
    });

    const scaleFactor = 1.5;
    this.snowmanMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

    this.snowmanMesh.position.set(25, -18, -4);
    this.snowmanMesh.rotation.y -= Math.PI / 2;

    this._scene.add(this.snowmanMesh);
  }

  // Santa
  async _loadSanta() {
    const santaModel = await this._loadModel('/models/santa.glb');
    this.santaMesh = santaModel.scene;

    this.santaMesh.traverse((node) => {
      if (node.isMesh) {
        node.material.side = FrontSide;
        node.castShadow = true;
      }
    });

    const scaleFactor = 0.07;
    this.santaMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

    this.santaMesh.position.set(0, -20, 5);
    this.santaMesh.rotation.y -= Math.PI / 3;

    this._scene.add(this.santaMesh);

    if (santaModel.animations && santaModel.animations.length > 0) {
      this.santaMixer = new AnimationMixer(this.santaMesh);
      this.santaAction = this.santaMixer.clipAction(santaModel.animations[0]);
    }
  }

  applyIceTextureToMesh(parent, meshName, material) {
    parent.traverse((child) => {
      if (child.isMesh && child.name === meshName) {
        child.material = material;
        child.receiveShadow = true;
      }
    });
  }

  _initAnimations(animations) {
    if (animations && animations.length > 0) {
      this.mixer = new AnimationMixer(this._scene);

      animations.forEach((clip) => {
        this.mixer.clipAction(clip).play();
      });
    }
  }
  //_______________________________________GLASS SPHERE_____________________________________________
  _createGlassSphere(centerObject, customScale = 0.7) {
    const boundingBox = new Box3().setFromObject(centerObject);
    const sphereRadius =
      boundingBox.getBoundingSphere(new Sphere()).radius * customScale;
    const sphereGeometry = new SphereGeometry(sphereRadius, 80, 80);
    const glassMaterial = new MeshPhysicalMaterial({
      roughness: 0.1,
      transmission: 1,
      thickness: 0.1, // This will add refraction!
      side: FrontSide,
    });

    this.glassSphere = new Mesh(sphereGeometry, glassMaterial);

    this.glassSphere.userData.originalMaterial = glassMaterial; // Store the original material
    this._scene.add(this.glassSphere);

    return sphereRadius;
  }

  //_____________________________________________________________________________________________

  _start() {
    this._animate();
  }

  _onResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      const aspect = window.innerWidth / window.innerHeight;
      this._camera.aspect = aspect;
      this._camera.updateProjectionMatrix();
      this._renderer.setSize(window.innerWidth, window.innerHeight);
    }, 100);
  }

  _initEvents() {
    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;

      camera.updateProjectionMatrix();
    });

    window.addEventListener('resize', this._onResize.bind(this));

    // phone or laptop
    const isPhone = 'ontouchstart' in window;

    if (isPhone) {
      this._renderer.domElement.addEventListener(
        'touchstart',
        this._onSantaClick.bind(this)
      );
    } else {
      this._renderer.domElement.addEventListener(
        'click',
        this._onSantaClick.bind(this)
      );
    }
    this._renderer.domElement.addEventListener(
      'mousemove',
      this._onSphereHover.bind(this)
    );
  }

  _onSphereHover(event) {
    event.preventDefault();
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this._camera);
    const intersects = this.raycaster.intersectObject(this.glassSphere);
    if (intersects.length > 0) {
      this.glassSphere.material = shimmerMaterial;
    } else {
      this.glassSphere.material = this.glassSphere.userData.originalMaterial;
    }
  }

  //___________________________________________Santa Anim_______________________________________

  //change strengt evry sec
  _setPartyMode() {
    if (this.bloomAnimationInterval) {
      clearInterval(this.bloomAnimationInterval);
      this.bloomAnimationInterval = null;
    } else {
      this.bloomAnimationInterval = setInterval(() => {
        this.bloomOptions.strength = (this.bloomOptions.strength + 3) % 4;
        this._bloomPass.strength = this.bloomOptions.strength;
      }, 100);
    }
  }

  _onSantaClick(event) {
    event.preventDefault();

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this._camera);

    // Santa was clicked
    const intersects = this.raycaster.intersectObject(this.santaMesh, true);

    if (intersects.length > 0) {
      if (this.santaAction) {
        this.santaAction.play();
        this.audio.play();
        this.snowParticles.changeSnowColors();
        this._setPartyMode();
        this._setSky('night');
      }
    }
  }
  //______________________________________________________________________________________________
  _animate() {
    shimmerMaterial.uniforms.time.value += 0.05;

    this.snowParticles.update();

    stats.begin();
    this._controls.update();
    this._composer.render();

    if (this.mixer) {
      this.mixer.update(0.01);
    }

    if (this.santaMixer) {
      this.santaMixer.update(0.01);
    }

    stats.end();

    window.requestAnimationFrame(this._animate.bind(this));
  }
}

const app = new App();
