import {
  Vector3,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
} from 'three';

export default class SnowParticles {
  constructor(scene, sphereRadius) {
    this.scene = scene;
    this.sphereRadius = sphereRadius;
    this.velocities = [];
    this.snowParticles = null;

    this._initSnowParticles();
  }

  _initSnowParticles() {
    const snowParticlesCount = 10000;
    const snowVertices = [];
    const TWO_PI = 2 * Math.PI;
    const HALF_SPHERE_RADIUS = this.sphereRadius / 2;

    for (let i = 0; i < snowParticlesCount; i++) {
      const theta = TWO_PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * this.sphereRadius;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      if (y > -HALF_SPHERE_RADIUS && y < HALF_SPHERE_RADIUS) {
        snowVertices.push(x, y, z);
        this.velocities.push((Math.random() - 0.5) * 0.05);
      }
    }
    const snowColors = new Array(snowParticlesCount * 3).fill(1);

    const snowGeometry = new BufferGeometry();
    snowGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(snowVertices, 3)
    );
    snowGeometry.setAttribute(
      'color',
      new Float32BufferAttribute(snowColors, 3)
    );

    const snowMaterial = new PointsMaterial({
      color: 0xffffff,
      size: 0.03,
      vertexColors: true,
    });

    this.snowParticles = new Points(snowGeometry, snowMaterial);
    this.scene.add(this.snowParticles);
  }

  update() {
    const positions = this.snowParticles.geometry.attributes.position.array;
    const origin = new Vector3();
    const tempVector = new Vector3();
    const TWO_PI = 2 * Math.PI;
    const HALF_SPHERE_RADIUS = this.sphereRadius / 2;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= this.velocities[i / 3];
      tempVector.set(positions[i], positions[i + 1], positions[i + 2]);
      const distanceFromCenter = origin.distanceTo(tempVector);

      if (
        distanceFromCenter >= this.sphereRadius ||
        positions[i + 1] < -HALF_SPHERE_RADIUS
      ) {
        const theta = TWO_PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.random() * this.sphereRadius;

        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = r * Math.cos(phi);
      }
    }

    this.snowParticles.geometry.attributes.position.needsUpdate = true;
  }

  changeSnowColors() {
    const colors = this.snowParticles.geometry.attributes.color.array;

    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = Math.random();
      colors[i + 1] = Math.random();
      colors[i + 2] = Math.random();
    }

    this.snowParticles.geometry.attributes.color.needsUpdate = true;
  }
}
