import { AmbientLight, DirectionalLight, BasicShadowMap } from 'three';

export class Lights {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.initLights();
  }

  initLights() {
    // Ambient Light
    const ambientLight = new AmbientLight(0x404040, 15.0);
    this.scene.add(ambientLight);

    // Directional Light
    const directionalLight = this.createDirectionalLight();
    this.scene.add(directionalLight);
  }

  createDirectionalLight() {
    const light = new DirectionalLight(0xffffff, 1);
    light.position.set(2, 60, 10);
    light.castShadow = true;
    light.receiveShadow = true;

    light.shadow.mapSize.width = 256;
    light.shadow.mapSize.height = 256;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 100;
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;

    light.shadow.bias = 0.001;

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = BasicShadowMap;

    return light;
  }
}
