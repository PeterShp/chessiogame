import { moving, changeSelected } from './networking';
import { gmap } from './render';

const cam = require('./camera').default.object;

let mouseclicked = false;
let xcam;
let ycam;

function mousedown(e) {
  const cellx = cam.screenToCellX(e.x);
  const celly = cam.screenToCellY(e.y);
  const tempx = e.clientX;
  const tempy = e.clientY;
  if (gmap.ownerCheck(cellx, celly)) {
    cam.clickedCellX = cellx;
    cam.clickedCellY = celly;
    cam.dragx = tempx;
    cam.dragy = tempy;
    cam.draggedfigureid = gmap.mapCell(cellx, celly).FigureID;
    changeSelected(cam.draggedfigureid);
  } else {
    xcam = tempx;
    ycam = tempy;
  }
  mouseclicked = true;
}

function mouseup(e) {
  const cellx = cam.screenToCellX(e.clientX);
  const celly = cam.screenToCellY(e.clientY);
  moving(cam.clickedCellX, cam.clickedCellY, cellx, celly);
  if (cam.dragx !== -1 && cam.dragy !== -1) {
    cam.droppedfigures[cam.draggedfigureid] = true;
  }
  cam.dragx = -1;
  cam.dragy = -1;
  mouseclicked = false;
}

function onMousemove(e) {
  const tempx = e.clientX;
  const tempy = e.clientY;
  if (mouseclicked) {
    if (cam.dragx === -1 && cam.dragy === -1) {
      cam.cameraDestinationX -= (tempx - xcam);
      cam.cameraDestinationY -= (tempy - ycam);
      cam.cameraX = cam.cameraDestinationX;
      cam.cameraY = cam.cameraDestinationY;
    } else {
      cam.dragx = tempx;
      cam.dragy = tempy;
    }
    xcam = tempx;
    ycam = tempy;
  }
}

function zoom(e) {
  cam.camscale += e.deltaY / 2 * -0.001;
  console.log(e);
  cam.cameraDestinationX = e.clientX;
  cam.cameraDestinationY = e.clientY;
  cam.cameraX = cam.cameraDestinationX;
  cam.cameraY = cam.cameraDestinationY;
}

export function startCapturingInput() {
  // window.addEventListener('mousemove', onMouseInput);
  window.addEventListener('mousedown', mousedown);
  window.addEventListener('mouseup', mouseup);
  window.addEventListener('mousemove', onMousemove);
  window.addEventListener('wheel', zoom);
}

export function stopCapturingInput() {
  // window.removeEventListener('mousemove', onMouseInput);
  window.removeEventListener('mousedown', mousedown);
  window.removeEventListener('mouseup', mouseup);
  window.removeEventListener('mousemove', onMousemove);
  window.removeEventListener('wheel', zoom);
}
