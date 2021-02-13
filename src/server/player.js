const ObjectClass = require('./object');
const Constants = require('../shared/constants');

class Player extends ObjectClass {
  constructor(PlayerID, username, color, score) {
    super(PlayerID, 0, 0);
    this.username = username;
    this.score = score;
    this.color = color;
    this.alive = Date.now();
  }

  // Returns a newly created figure, or null.
  update(dt) {
    return null;
  }

  // this function used to organise data to send it to players
  serializeForUpdate() {
    return {
      PlayerID: this.PlayerID,
      username: this.username,
      score: this.score,
    };
  }
}

module.exports = Player;
