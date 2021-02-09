/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */
const shortid = require('shortid');
const { object } = require('../shared/map');
const ObjectClass = require('./object');

class Figure extends ObjectClass {
  constructor(PlayerID, x, y, figuretype) {
    super(PlayerID, x, y);
    this.FigureID = shortid.generate();
    this.figureType = figuretype;
    this.activationTime = Date.now();
    this.animation = {};
  }

  // Returns true if the figure should be destroyed
  update(dt) {
    return false;
  }

  createAnimation(x, y, xx, yy, tc) {
    this.animation = {
      x0: x,
      y0: y,
      x1: xx,
      y1: yy,
      time: Date.now() + tc,
      timecd: tc,
    };
  }

  // this function used to organise data to send it to players
  serializeForUpdate() {
    const res = {
      PlayerID: this.PlayerID,
      FigureID: this.FigureID,
      x: this.x,
      y: this.y,
      figureType: this.figureType,
      activationTime: this.activationTime,
    };
    if (Object.keys(this.animation).length) {
      res.animation = this.animation;
    }
    return res;
  }
}

module.exports = Figure;
