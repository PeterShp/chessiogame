const ObjectClass = require('./object');
const Constants = require('../shared/constants');

class Player extends ObjectClass {
  constructor(PlayerID, username) {
    super(PlayerID, 0, 0);
    this.username = username;
    this.score = 0;
    this.alive = Date.now();
  }

  // Returns a newly created figure, or null.
  update(dt) {
    // Update score
    this.score += dt * Constants.SCORE_PER_SECOND;
    return null;
  }

  // this function used to organise data to send it to players
  serializeForUpdate() {
    return {
      PlayerID: this.PlayerID,
      username: this.username,
    };
  }
}

module.exports = Player;
