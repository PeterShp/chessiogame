import { moving, changeSelected } from './networking';
import { gmap } from './render';

const cam = require('./camera').default.object;

let mouseclicked = false;
let xcam;
let ycam;

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
    changeSelected(gmap.mapCell(cellx, celly).FigureID);
  } else {
    moving(cam.clickedCellX, cam.clickedCellY, cellx, celly);
  }
}

function mousedown(e) {
  xcam = e.clientX;
  ycam = e.clientY;
  mouseclicked = true;
}

function mouseup(e) {
  handleInput(e.clientX, e.clientY);
  mouseclicked = false;
}

function onMousemove(e) {
  if (mouseclicked) {
    cam.cameraDestinationX -= (e.clientX - xcam);
    cam.cameraDestinationY -= (e.clientY - ycam);
    cam.cameraX = cam.cameraDestinationX;
    cam.cameraY = cam.cameraDestinationY;
    xcam = e.clientX;
    ycam = e.clientY;
  }
}

export function startCapturingInput() {
  // window.addEventListener('mousemove', onMouseInput);
  window.addEventListener('touchstart', onTouchInput);
  window.addEventListener('touchmove', onTouchInput);
  window.addEventListener('mousedown', mousedown);
  window.addEventListener('mouseup', mouseup);
  window.addEventListener('mousemove', onMousemove);
}

export function stopCapturingInput() {
  // window.removeEventListener('mousemove', onMouseInput);
  window.removeEventListener('touchstart', onTouchInput);
  window.removeEventListener('touchmove', onTouchInput);
}
