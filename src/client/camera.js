import { gmap } from './render';

const canvas = document.getElementById('game-canvas');

const object = {
  cameraX: 0,
  cameraY: 0,
  cameraDestinationX: -1,
  cameraDestinationY: -1,
  clickedCellX: -1,
  clickedCellY: -1,
  clickedID: '',

  setCameraScreenDestination(scrX, scrY) {
    this.cameraDestinationX = this.cameraX + scrX - canvas.width / 2;
    this.cameraDestinationY = this.cameraY + scrY - canvas.height / 2;
  },

  setCameraCellDestination(cellx, celly) {
    this.cameraDestinationX = cellx * gmap.CellSize + gmap.CellSize / 2;
    this.cameraDestinationY = celly * gmap.CellSize + gmap.CellSize / 2;
    const temp = gmap.mapCell(cellx, celly);
    if (temp) {
      this.clickedID = temp.FigureID;
    } else {
      this.clickedID = '';
    }
  },

  approachCamera() {
    let dx = this.cameraX * 0.9 + this.cameraDestinationX * 0.1 - this.cameraX;
    let dy = this.cameraY * 0.9 + this.cameraDestinationY * 0.1 - this.cameraY;
    const L = Math.sqrt(dx * dx + dy * dy);
    const maxL = 20;
    if (L > maxL) {
      dx *= maxL / L;
      dy *= maxL / L;
    }
    this.cameraX += dx;
    this.cameraY += dy;
  },

  CelltoScreenX(x) {
    return canvas.width / 2 + x * gmap.CellSize - this.cameraX;
  },

  CelltoScreenY(y) {
    return canvas.height / 2 + y * gmap.CellSize - this.cameraY;
  },

  screenToCellX(x) {
    return Math.floor((x - canvas.width / 2 + this.cameraX) / gmap.CellSize);
  },

  screenToCellY(y) {
    return Math.floor((y - canvas.height / 2 + this.cameraY) / gmap.CellSize);
  },
};

export default { object };
