/* eslint-disable no-constant-condition */
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const socketio = require('socket.io');

const fs = require('fs');
const Constants = require('../shared/constants');
const Game = require('./game');
const webpackConfig = require('../../webpack.dev.js');

// Setup an Express server
const app = express();

app.use((req, res, next) => {
  if (req.path.includes('.svg/')) {
    const url = req.path;
    const white = url.indexOf('/white=');
    const black = url.indexOf('/black=');
    if (white > 0 || black > 0) {
      let svg = fs.readFileSync(`./public${url.substring(0, url.indexOf('.svg') + 4)}`, 'utf8');
      if (white > 0) svg = svg.replace(/ffffff/g, url.substring(white + 7, white + 13));
      if (black > 0) svg = svg.replace(/ffffff/g, url.substring(black + 7, black + 13));
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      res.write(svg);
      res.end();
      return;
    }
  }
  next();
});

// Set "public" folder as the downloads source
app.use(express.static('public'));

if (true) { // process.env.NODE_ENV === 'development') {
  // Setup Webpack for development
  const compiler = webpack(webpackConfig);
  app.use(webpackDevMiddleware(compiler));
} else {
  // Static serve the dist/ folder in production
  app.use(express.static('dist'));
}

// Listen on port
const port = process.env.PORT || 3001;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

// Setup socket.io
const io = socketio(server);

// Listen for socket.io connections, look Constants.js, MSG_TYPES for message types
io.on('connection', socket => {
  console.log('Player connected!', socket.id);
  // This is the place where we register all all message handlers
  // to handle messages from players.
  socket.on(Constants.MSG_TYPES.JOIN_GAME, joinGame);
  socket.on(Constants.MSG_TYPES.INPUT, handleInput);
  socket.on('disconnect', onDisconnect);
  socket.on(Constants.MSG_TYPES.MOVE, handleMove);
  socket.on(Constants.MSG_TYPES.ALIVE, alivePlayer);
  // Add additional handlers there.
});

// Setup the Game
const game = new Game();

function joinGame(username) {
  game.addPlayer(this, username);
}

function handleInput(dir) {
  game.handleInput(this, dir);
}

function onDisconnect() {
  game.removePlayer(this);
}

function handleMove(move) {
  game.makeMove(this.id, move.X0, move.Y0, move.X1, move.Y1);
}

function alivePlayer() {
  game.aliveAdd(this.id);
}
