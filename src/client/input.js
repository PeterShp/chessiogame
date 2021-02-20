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
  if (mouseclicked) {
    if (cam.dragx === -1 && cam.dragy === -1) {
      cam.cameraDestinationX -= (e.clientX - xcam);
      cam.cameraDestinationY -= (e.clientY - ycam);
      cam.cameraX = cam.cameraDestinationX;
      cam.cameraY = cam.cameraDestinationY;
    } else {
      cam.dragx = e.clientX;
      cam.dragy = e.clientY;
    }
    xcam = e.clientX;
    ycam = e.clientY;
  }
}

export function startCapturingInput() {
  // window.addEventListener('mousemove', onMouseInput);
  window.addEventListener('mousedown', mousedown);
  window.addEventListener('mouseup', mouseup);
  window.addEventListener('mousemove', onMousemove);
}

export function stopCapturingInput() {
  // window.removeEventListener('mousemove', onMouseInput);
  window.removeEventListener('touchstart', onTouchInput);
  window.removeEventListener('touchmove', onTouchInput);
}
