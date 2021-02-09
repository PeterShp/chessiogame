import { moving } from './networking';
import { gmap } from './render';

const cam = require('./camera').default.object;

function onMouseInput(e) {
  handleInput(e.clientX, e.clientY);
}

function onTouchInput(e) {
  const touch = e.touches[0];
  handleInput(touch.clientX, touch.clientY);
}

function handleInput(x, y) {
  const cellx = cam.screenToCellX(x);
  const celly = cam.screenToCellY(y);
  if (gmap.ownerCheck(cellx, celly)) {
    cam.clickedCellX = cellx;
    cam.clickedCellY = celly;
    if (cam.cameraDestinationX >= 0 && gmap.inMap(cellx, celly)) {
      cam.setCameraCellDestination(cellx, celly);
    }
  } else {
    moving(cam.clickedCellX, cam.clickedCellY, cellx, celly);
  }
}

export function startCapturingInput() {
  // window.addEventListener('mousemove', onMouseInput);
  window.addEventListener('click', onMouseInput);
  window.addEventListener('touchstart', onTouchInput);
  window.addEventListener('touchmove', onTouchInput);
}

export function stopCapturingInput() {
  // window.removeEventListener('mousemove', onMouseInput);
  window.removeEventListener('click', onMouseInput);
  window.removeEventListener('touchstart', onTouchInput);
  window.removeEventListener('touchmove', onTouchInput);
}
