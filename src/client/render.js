/* eslint-disable global-require */
/* eslint-disable import/no-mutable-exports */
/* eslint-disable import/no-cycle */
/* eslint-disable no-unused-vars */
import { debounce } from 'throttle-debounce';
import { getAsset } from './assets';
import { getCurrentState, getServerTime } from './state';
import { GameMap } from '../shared/map';
import constants, { MINSIZE, MAXSIZE } from '../shared/constants';
import { alive } from './networking';

export let gmap = require('../shared/map').object;

let PlayOnWhiteSide = true;

export function setPlaySide(side) {
  PlayOnWhiteSide = side;
}

const cam = require('./camera').default.object;

// Get the canvas graphics context
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
setCanvasDimensions();

function setCanvasDimensions() {
  // On small screens (e.g. phones), we want to "zoom out" so players can still see at least
  // 800 in-game units of width.
  const scaleRatio = Math.max(1, 800 / window.innerWidth);
  canvas.width = scaleRatio * window.innerWidth;
  canvas.height = scaleRatio * window.innerHeight;
}

window.addEventListener('resize', debounce(40, setCanvasDimensions));

function render() {
  const { me, figures } = getCurrentState();
  if (me) gmap.myPlayerID = me.PlayerID;
  let mover = null;
  if (figures) {
    // Move camera slowly to the desired destination
    cam.approachCamera();
    // Draw background
    renderBackground();
    figures.forEach(el => {
      if ((cam.clickedID === '' || cam.clickedID === el.FigureID) && el.PlayerID === me.PlayerID && !el.hasOwnProperty('animation')) {
        if (cam.clickedID === '')cam.setCameraCellDestination(el.x, el.y);
        cam.clickedCellX = el.x;
        cam.clickedCellY = el.y;
      }
      renderFigure(el.figureType, el.PlayerID === me.PlayerID ? 0 : 1, el.x, el.y, getPercent(el.activationTime - getServerTime(), el.figureType), el.PlayerID, el.hasOwnProperty('animation') ? el.animation : null, el.color);
      if (el.isSelected && el.PlayerID === me.PlayerID) {
        mover = el;
      }
    });
    if (mover) renderMoves(mover.x, mover.y);
  }
}

function setPing() {
  alive();
  const { figures } = getCurrentState();
}

function renderBackground() {
  gmap.setupSize();
  context.fillStyle = '#888888';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const bgx = canvas.width / 2 - cam.cameraX;
  const bgy = canvas.height / 2 - cam.cameraY;
  const chessbg = context.createPattern(getAsset('chessboard.png'), 'repeat');
  context.fillStyle = chessbg;
  context.translate(bgx, bgy);
  const scale = gmap.CellSize / 128;
  const w1 = gmap.mapSize / scale;
  context.scale(scale, scale);
  context.fillRect(0, 0, w1, w1);
  context.strokeStyle = 'black';
  context.lineWidth = 5;
  context.strokeRect(0, 0, w1, w1);
  context.resetTransform();
}

function renderFigure(figure, color, x, y, percent, plid, animation, rcolor) {
  const unit = gmap.UnitsList[figure];
  const side = PlayOnWhiteSide ? color : 1 - color;
  const image = getAsset(`${unit.IMAGE[side]}/white=${rcolor}`);
  if (animation) {
    let t = (animation.time - getServerTime()) / animation.timecd;
    if (t < 0) t = 0;
    const x0 = cam.CelltoScreenX(animation.x0);
    const y0 = cam.CelltoScreenY(animation.y0);
    let x1 = cam.CelltoScreenX(animation.x1);
    let y1 = cam.CelltoScreenY(animation.y1);
    x1 += (x0 - x1) * t;
    y1 += (y0 - y1) * t;
    context.translate(x1, y1);
  } else {
    context.translate(cam.CelltoScreenX(x), cam.CelltoScreenY(y));
  }

  const scale = gmap.CellSize / image.width;
  context.scale(scale, scale);
  if (percent < 1) {
    const h = image.height * (1 - percent);
    context.beginPath();
    context.rect(0, h, image.width, image.width - h);
    context.save();
    context.clip();
    context.drawImage(image, 0, 0);
    context.restore();
    context.globalAlpha = 0.3;
  }
  if (plid === 0) {
    context.globalAlpha = 0.4;
  }
  context.drawImage(image, 0, 0);
  context.resetTransform();
  context.globalAlpha = 1;
}

function renderMainMenu() {
  const t = Date.now() / 4000;
  cam.cameraX = gmap.mapSize / 2 + gmap.mapSize / 4 * Math.cos(t);
  cam.cameraY = gmap.mapSize / 2 + gmap.mapSize / 4 * Math.sin(t);
  renderBackground();
}

function renderMoves(x, y) {
  const moves = gmap.availableMoves(x, y);
  const image = getAsset('dot.png');
  const imageenemy = getAsset('rdot.png');
  const me = gmap.mapCell(x, y);
  moves.forEach(turn => {
    const x1 = turn[0];
    const y1 = turn[1];
    if (gmap.inMap(x1, y1)) {
      if (me.activationTime > getServerTime()) context.globalAlpha = 0.3;
      const mc = gmap.mapCell(x1, y1);
      context.translate(cam.CelltoScreenX(x1), cam.CelltoScreenY(y1));
      const scale = gmap.CellSize / image.width;
      context.scale(scale, scale);
      if (mc && mc.PlayerID !== gmap.myPlayerID) {
        context.drawImage(imageenemy, 0, 0);
      } else {
        context.drawImage(image, 0, 0);
      }
      context.resetTransform();
      context.globalAlpha = 1;
    }
  });
}


function getPercent(time, figure) {
  const temp = constants.MINSIZE + (constants.MAXSIZE - constants.MINSIZE) * (1 - (time / gmap.UnitsList[figure].COOLDOWN));
  if (temp > 1) return 1;
  if (temp < 0) return 0;
  return temp;
}

let renderInterval = setInterval(renderMainMenu, 1000 / 60);
let pingInterval = null;

// Replaces main menu rendering with game rendering.
export function startRendering() {
  clearInterval(renderInterval);
  clearInterval(pingInterval);
  renderInterval = setInterval(render, 1000 / 60);
  pingInterval = setInterval(setPing, 3000);
}

// Replaces game rendering with main menu rendering.
export function stopRendering() {
  clearInterval(renderInterval);
  renderInterval = setInterval(renderMainMenu, 1000 / 60);
}

export function updateGmap(CellsAmount, CellSize, figures) {
  if (gmap.CellSize !== CellSize || gmap.CellsAmount !== CellsAmount) {
    gmap = new GameMap(CellsAmount, CellSize);
  }
  gmap.setupGlobalMap(figures);
}
