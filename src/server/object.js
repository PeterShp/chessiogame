/* eslint-disable class-methods-use-this */
class Object {
  constructor(PlayerID, x, y) {
    this.PlayerID = PlayerID;
    this.x = x;
    this.y = y;
  }

  // this function used to organise data to send it to players
  serializeForUpdate() {
    return {
      PlayerID: this.PlayerID,
      x: this.x,
      y: this.y,
    };
  }
}

module.exports = Object;
