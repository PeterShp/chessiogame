/* eslint-disable max-len */
class GameMap {
  constructor(cells, cellsize) {
    this.setupFigures();
    this.mapSize = 0;
    this.GlobalMap = [];
    this.myPlayerID = '';
    this.mapdone = false;
    this.CellsAmount = cells;
    this.CellSize = cellsize;
    this.setupSize();
  }

  setupSize() {
    this.mapSize = this.CellSize * this.CellsAmount;
  }

  inMap(x, y) {
    return x >= 0 && y >= 0 && x < this.CellsAmount && y < this.CellsAmount;
  }

  setupFigures() {
    this.UnitsList =
      [
        {
          TURNS: [[1, [1, 2]], [1, [-1, 2]], [1, [2, 1]], [1, [2, -1]], [1, [-2, 1]], [1, [-2, -1]], [1, [-1, -2]], [1, [1, -2]]],
          KILLS: [],
          IMAGE: ['knight-white.svg', 'knight-black.svg'],
          COOLDOWN: 1000,
        },
        {
          TURNS: [[1, [1, 1]], [1, [1, -1]], [1, [-1, 1]], [1, [-1, -1]], [1, [0, 1]], [1, [0, -1]], [1, [-1, 0]], [1, [1, 0]]],
          KILLS: [],
          IMAGE: ['king-white.svg', 'king-black.svg'],
          COOLDOWN: 2000,
        },
        {
          TURNS: [[5, [1, 1]], [5, [1, -1]], [5, [-1, 1]], [5, [-1, -1]]],
          KILLS: [],
          IMAGE: ['bishop-white.svg', 'bishop-black.svg'],
          COOLDOWN: 3000,
        },
        {
          TURNS: [[1, [0, 1]], [1, [0, -1]], [1, [-1, 0]], [1, [1, 0]]],
          KILLS: [[1, [1, 1]], [1, [-1, 1]], [1, [-1, -1]], [1, [1, -1]]],
          IMAGE: ['pawn-white.svg', 'pawn-black.svg'],
          COOLDOWN: 500,
        },
      ];
  }

  setupGlobalMap(figures) {
    this.GlobalMap = new Array(this.CellsAmount);
    for (let i = 0; i < this.CellsAmount; i++) {
      this.GlobalMap[i] = new Array(this.CellsAmount);
    }
    if (figures) {
      figures.forEach(figure => {
        if (this.inMap(figure.x, figure.y)) {
          this.GlobalMap[figure.y][figure.x] = figure;
        }
      });
    }
    this.mapdone = true;
  }

  mapCell(x, y) {
    if (this.mapdone && this.inMap(x, y)) {
      return this.GlobalMap[Math.floor(y)][Math.floor(x)];
    } else return null;
  }

  ownerCheck(x, y) {
    const temp = this.mapCell(x, y);
    return temp && temp.PlayerID === this.myPlayerID;
  }

  availableMoves(x0, y0) {
    const temp = [];
    if (this.inMap(x0, y0)) {
      const obj = this.mapCell(x0, y0);
      if (obj) {
        const killmoves = this.UnitsList[obj.figureType].KILLS;
        const moves = this.UnitsList[obj.figureType].TURNS;
        // eslint-disable-next-line no-restricted-syntax
        for (const branch of moves) {
          const j = branch[0];
          const dx = branch[1][0];
          const dy = branch[1][1];
          for (let i = 1; i <= j; i++) {
            const x1 = x0 + dx * i;
            const y1 = y0 + dy * i;
            const mc = this.mapCell(x1, y1);
            if (mc) {
              if ((mc.PlayerID === obj.PlayerID || killmoves.length) && !(mc.PlayerID === 0 && obj.PlayerID === 0)) break;
              temp.push([x1, y1]);
              break;
            }
            temp.push([x1, y1]);
          }
        }
        // eslint-disable-next-line no-restricted-syntax
        for (const branch of killmoves) {
          const j = branch[0];
          const dx = branch[1][0];
          const dy = branch[1][1];
          for (let i = 1; i <= j; i++) {
            const x1 = x0 + dx * i;
            const y1 = y0 + dy * i;
            const mc = this.mapCell(x1, y1);
            if (mc) {
              if (mc.PlayerID === obj.PlayerID && !(mc.PlayerID === 0 && obj.PlayerID === 0)) break;
              temp.push([x1, y1]);
              break;
            }
          }
        }
      }
    }
    return temp;
  }
}


const object = new GameMap(12, 128);

module.exports = { GameMap, object };
