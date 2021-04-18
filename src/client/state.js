/* eslint-disable import/no-cycle */
import { updateLeaderboard } from './leaderboard';
import { updateGmap } from './render';

const gameUpdates = [];
// Last timestamp got from the server
let lastservertime = 0;
// Last local timestamp
let lastmytime = 0;
// There stored the estimated server timestamp, this ir renewed in the getCurrentState()
let serverTime = 0;

// Returns estimated time on the server (up to preciseness of ping delay)
export function getServerTime() {
  return serverTime;
}

// Returns { me, players, figures }
export function getCurrentState() {
  serverTime = Date.now() + lastservertime - lastmytime;
  if (!gameUpdates.length) {
    return {};
  }
  const baseUpdate = gameUpdates[gameUpdates.length - 1];
  // console.log(baseUpdate);
  return {
    me: baseUpdate.me,
    players: baseUpdate.players,
    figures: baseUpdate.figures,
    CellsAmount: baseUpdate.CellsAmount,
    CellSize: baseUpdate.CellSize,
  };
}

// Called each time we get some message from the server
export function processGameUpdate(update) {
  lastservertime = update.t;
  lastmytime = Date.now();
  gameUpdates.push(update);
  updateGmap(update.CellsAmount, update.CellSize, update.figures);

  updateLeaderboard(update.leaderboard);

  gameUpdates.splice(0, gameUpdates.length - 1);
}
