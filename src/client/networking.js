import io from 'socket.io-client';
import { processGameUpdate } from './state';

const Constants = require('../shared/constants');

const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws';
const socket = io(`${socketProtocol}://${window.location.host}`, { reconnection: false });
const connectedPromise = new Promise(resolve => {
  socket.on('connect', () => {
    console.log('Connected to server!');
    resolve();
  });
});

export const connect = () => (
  connectedPromise.then(() => {
    // Register callbacks
    socket.on(Constants.MSG_TYPES.GAME_UPDATE, processGameUpdate);
    socket.on('disconnect', () => {
      console.log('Disconnected from server.');
      document.getElementById('disconnect-modal').classList.remove('hidden');
    });
    socket.on(Constants.MSG_TYPES.GAME_OVER, () => {
      console.log('Disconnected from server.');
      document.getElementById('loose-modal').classList.remove('hidden');
    });
    socket.on(Constants.MSG_TYPES.YOU_WON, () => {
      document.getElementById('win-modal').classList.remove('hidden');
    });
  })
);

export const play = username => {
  socket.emit(Constants.MSG_TYPES.JOIN_GAME, username);
};

export function moving(x0, y0, x1, y1) {
  socket.emit(Constants.MSG_TYPES.MOVE, { X0: x0, Y0: y0, X1: x1, Y1: y1 });
}

export function alive() {
  socket.emit(Constants.MSG_TYPES.ALIVE, {});
}

export function changeSelected(_figureid) {
  socket.emit(Constants.MSG_TYPES.CHANGE, { figureid: _figureid });
}
