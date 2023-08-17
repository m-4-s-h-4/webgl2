import { GUI } from 'dat.gui';

export function initGUI(appInstance) {
  const gui = new GUI();

  // Sky
  const skyFolder = gui.addFolder('Sky');
  skyFolder.open();
  const skyConfig = { sky: 'sunset' }; // default value

  skyFolder
    .add(skyConfig, 'sky', ['sunset', 'night'])
    .name('Sky Type')
    .onChange((value) => {
      appInstance._setSky(value);
    });

  // Bloom Effect
  const bloomFolder = gui.addFolder('Bloom Effect');
  bloomFolder.open();
  bloomFolder
    .add(appInstance.bloomOptions, 'strength', 0, 3)
    .onChange((value) => (appInstance._bloomPass.strength = value));
  bloomFolder
    .add(appInstance.bloomOptions, 'radius', 0, 1)
    .onChange((value) => (appInstance._bloomPass.radius = value));
  bloomFolder
    .add(appInstance.bloomOptions, 'threshold', 0, 1)
    .onChange((value) => (appInstance._bloomPass.threshold = value));

  return gui;
}
