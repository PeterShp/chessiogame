/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const Constants = require('../shared/constants');
const Player = require('./player');
require('../shared/map');
const randomColor = require('randomcolor');
const Figure = require('./figure');
const { GameMap } = require('../shared/map');

function serializeForUpdate(obj) {
  const res = [];
  Object.values(obj).forEach(el => res.push(el.serializeForUpdate()));
  return res;
}

class Game {
  constructor() {
    this.sockets = {};
    this.players = {};
    this.figures = [];
    this.lastUpdateTime = Date.now();
    setInterval(this.update.bind(this), 1000 / 20);
    this.gmap = new GameMap(15, 70);
    this.gmap.setupFigures();
    this.setupNeutralFigures();
    this.gmap.setupSize();
    this.sendupdate();
  }

  sendupdate() {
    this.shouldSendUpdate = true;
  }

  addPlayer(socket, username) {
    this.sockets[socket.id] = socket;
    // Generate a position to start this player at.
    const temp = this.findFreeFigure();
    const color = randomColor({ luminosity: 'bright', hue: 'random' }).substring(1);
    if (temp) {
      temp.PlayerID = socket.id;
      this.players[socket.id] = new Player(socket.id, username, color, 1);
      // Create the figure at the random point
      temp.color = color;
      temp.isSelected = true;
      this.sendupdate();
    } else {
      const rand = this.randomCell();
      if (rand) {
        // eslint-disable-next-line max-len
        this.figures.push(socket.id, rand[0], rand[1], Math.floor(Math.random() * this.gmap.UnitsList.length - 0.000001), color, true);
      }
    }
  }

  removePlayer(socket) {
    this.figures.forEach(el => {
      if (el.PlayerID === socket.id) {
        el.PlayerID = 0;
        el.isSelected = false;
        el.color = 'C0C0C0';
      }
    });
    delete this.sockets[socket.id];
    delete this.players[socket.id];
    this.sendupdate();
  }

  aliveAdd(id) {
    Object.values(this.players).forEach(el => {
      if (el.PlayerID === id) {
        el.alive = Date.now();
      }
    });
  }

  findFreeFigure() {
    let res = null;
    this.figures.forEach(figur => {
      if (figur.PlayerID === 0) {
        let temp = true;
        this.figures.forEach(fig => {
          this.gmap.availableMoves(fig.x, fig.y).forEach(move => {
            if (move[0] === figur.x && move[1] === figur.y && figur !== fig) {
              temp = false;
            }
          });
        });
        if (temp) {
          res = figur;
        }
      }
    });
    return res;
  }

  setCooldown(element) {
    // eslint-disable-next-line no-param-reassign
    let plscore = 1;
    const tempplayer = this.players[element.PlayerID];
    if (tempplayer) {
      plscore = tempplayer.score;
      element.cooldown = this.gmap.UnitsList[element.figureType].COOLDOWN * Math.sqrt(plscore);
      element.activationTime = Date.now() + this.gmap.UnitsList[element.figureType].COOLDOWN * Math.sqrt(plscore);
    } else {
      element.activationTime = 0;
    }
  }

  randomCell(iterations = 100) {
    for (let i = 0; i < iterations; i++) {
      const x = Math.floor(Math.random() * Math.floor(this.gmap.CellsAmount));
      const y = Math.floor(Math.random() * Math.floor(this.gmap.CellsAmount));
      const fig = this.gmap.mapCell(x, y);
      let temp = true;
      if (!fig) {
        this.figures.forEach(figure => {
          this.gmap.availableMoves(figure.x, figure.y).forEach(move => {
            if (move[0] === x && move[1] === y) {
              temp = false;
            }
          });
        });
        if (temp) {
          return [x, y];
        }
      }
    }
    return false;
  }

  makeMove(PlayerID, x0, y0, x1, y1) {
    if (this.gmap.inMap(x1, y1)) {
      this.figures.forEach(el => {
        if ((PlayerID === el.PlayerID && el.activationTime <= Date.now()) && el.x === x0 && el.y === y0) {
          const temp = this.gmap.availableMoves(x0, y0);
          temp.forEach(coord => {
            if (coord[0] === x1 && coord[1] === y1) {
              const tc = this.getTime(x0, y0, x1, y1);
              el.createAnimation(x0, y0, x1, y1, tc);
              el.x = -1;
              el.y = -1;
            }
          });
        }
      });
    }
    this.sendupdate();
  }

  getTime(x0, y0, x1, y1) {
    return Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)) * Constants.ANIMATIONDURATION;
  }

  setupNeutralFigures() {
    for (let i = 0; i < this.gmap.CellsAmount; i++) {
      const temp = this.randomCell();
      if (temp) {
        this.figures.push(new Figure(0, temp[0], temp[1], Math.floor(Math.random() * this.gmap.UnitsList.length - 0.000001), 'C0C0C0', false));
        this.gmap.setupGlobalMap(this.figures);
      }
    }
  }

  slectedChange(playerid, figureid) {
    this.figures.forEach(figure => {
      if (figure.PlayerID === playerid) {
        const temp = figure.FigureID === figureid;
        if (temp !== figure.isSelected) {
          figure.isSelected = temp;
          this.sendupdate();
        }
      }
    });
  }

  update() {
    this.gmap.setupSize();
    this.gmap.setupGlobalMap(this.figures);
    // Calculate time elapsed
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    this.figures.forEach((el, i) => {
      if (el.animation.time <= Date.now()) {
        const mc = this.gmap.mapCell(el.animation.x1, el.animation.y1);
        if (mc) {
          mc.x = el.animation.x0;
          mc.y = el.animation.y0;
          const p1 = this.players[el.PlayerID];
          const p2 = this.players[mc.PlayerID];
          if (p1)p1.score++;
          if (p2)p2.score--;
          mc.PlayerID = el.PlayerID;
          mc.color = el.color;
          mc.ted = false;
          this.setCooldown(mc);
        }
        const fig = this.figures[i];
        fig.x = el.animation.x1;
        fig.y = el.animation.y1;
        this.setCooldown(fig);
        el.animation = {};
        this.sendupdate();
      }
    });

    // Autoattack enemy
    this.figures.forEach(figure => {
      if (!figure.PlayerID) {
        this.gmap.availableMoves(figure.x, figure.y).forEach(move => {
          const cell = this.gmap.mapCell(move[0], move[1]);
          if (cell && cell.PlayerID === 0) {
            const step = this.gmap.availableMoves(cell.x, cell.y);
            if (step.length) {
              for (let i = 0; i < step.length * step.length; i++) {
                const j = Math.floor(Math.random() * Math.floor(step.length));
                if (!this.gmap.mapCell(step[j][0], step[j][1])) {
                  this.makeMove(0, figure.x, figure.y, step[j][0], step[j][1]);
                  break;
                }
              }
            }
          } else if (cell && cell.PlayerID) {
            this.makeMove(0, figure.x, figure.y, move[0], move[1]);
            this.sendupdate();
          }
        });
      }
    });

    // Finds fugures to remove
    const figuresToRemove = [];
    this.figures.forEach(figure => {
      if (figure.update()) {
        // Destroy this figure
        figuresToRemove.push(figure);
        this.sendupdate();
      }
    });

    // Actually remove figures placed into figuresToRemove
    this.figures = this.figures.filter(figure => !figuresToRemove.includes(figure));

    // Update each player
    Object.keys(this.sockets).forEach(playerID => {
      const player = this.players[playerID];
      const newFigure = player.update(dt);
      if (newFigure) {
        this.figures.push(newFigure);
        this.sendupdate();
      }
    });

    // Checks if player is online & if he won
    let winner = null;

    Object.values(this.players).forEach(pla => {
      if (Date.now() - pla.alive > Constants.WAITTIME) {
        this.figures.forEach(el => {
          if (el.PlayerID === pla.PlayerID) {
            el.PlayerID = 0;
          }
        });
        this.sendupdate();
      }
      let temp = 0;
      this.figures.forEach(el => {
        if (el.PlayerID && el.PlayerID !== pla.PlayerID) {
          temp++;
        }
      });
      if (temp) this.gameStared = true;

      if (this.gameStared && !temp) {
        this.figures.forEach(el => {
          if (el.PlayerID === pla.PlayerID) {
            winner = el.PlayerID;
            el.PlayerID = 0;
          }
        });
        this.gameStared = false;
        this.sendupdate();
      }
    });

    // Check if any players are dead
    Object.keys(this.sockets).forEach(ID => {
      let temp = false;
      const socket = this.sockets[ID];
      this.figures.forEach(el => {
        if (el.PlayerID === socket.id) {
          temp = true;
        }
      });
      if (!temp) {
        socket.emit(winner === ID ? Constants.MSG_TYPES.YOU_WON : Constants.MSG_TYPES.GAME_OVER);
        this.removePlayer(socket);
        this.sendupdate();
      }
    });

    // Send a game update to each player every other
    if (this.shouldSendUpdate) {
      this.shouldSendUpdate = false;
      const leaderboard = this.getLeaderboard();
      Object.keys(this.sockets).forEach(playerID => {
        const socket = this.sockets[playerID];
        const player = this.players[playerID];
        socket.emit(Constants.MSG_TYPES.GAME_UPDATE, this.createUpdate(player, leaderboard));
      });
    }
  }

  getLeaderboard() {
    return Object.values(this.players)
      .sort((p1, p2) => p2.score - p1.score)
      .slice(0, 5)
      .map(p => ({ username: p.username, score: Math.round(p.score) }));
  }


  createUpdate(player, leaderboard) {
    return {
      t: Date.now(),
      me: player.serializeForUpdate(),
      players: serializeForUpdate(this.players),
      figures: serializeForUpdate(this.figures),
      CellSize: this.gmap.CellSize,
      CellsAmount: this.gmap.CellsAmount,
      leaderboard,
    };
  }
}

module.exports = Game;
