# chessiogame

## Логика работы сервера RoyalChess.

### Server.js

Инициализируются сетевые интерфейсы и библиотеки


```
// Setup an Express server
const app = express();

// Set "public" folder as the downloads source
app.use(express.static('public'));

// Listen on port
const port = process.env.PORT || 3001;
const server = app.listen(port);

// Setup socket.io
const io = socketio(server);
```



Создается объект Game. Не проблема создать несколько игр на одном сервере, создав несколько таких объектов. 
В этом случае в сообщениях между клиентом и сервером нужно будет указывать, к какому именно экземпляру Game относится сообщение.


```
// Setup the Game
const game = new Game();
```



Ставятся обработчики сообщений от клиентов, по заданному событию вызывается функция. Constants.MSG_TYPES… - это просто строки, маркеры сообщений.


```
// Listen for socket.io connections, look Constants.js, MSG_TYPES for message types
io.on('connection', socket => {
  console.log('Player connected!', socket.id);
  // This is the place where we register all all message handlers
  // to handle messages from players.
  socket.on(Constants.MSG_TYPES.JOIN_GAME, joinGame);
  socket.on(Constants.MSG_TYPES.INPUT, handleInput);
  socket.on('disconnect', onDisconnect);
  socket.on(Constants.MSG_TYPES.MOVE, handleMove);
  // Add additional handlers there.
});
```

Обратите внимание, в функцию обработчика передается 1 параметр - это те данные в виде объекта, которые послал клиент, используя **socket.emit**


```
  socket.emit(Constants.MSG_TYPES.MOVE, { /*your data there as object*/  });//клиентский код!!!
```



В функции обработчика событий можно использовать this - это сокет (по сути - клиент), от которого поступило сообщение. Пример


```
  socket.on(Constants.MSG_TYPES.MOVE, handleMove);//регистрируем обрабочик сообщений 'move'

function handleMove(move) {
  game.makeMove(this.id, move.X0, move.Y0, move.X1, move.Y1);
}
```



Используется this.id - это идентификатор сокета, который используется как идентификатор игрока.


### Game.js


Класс **Game**- основа игры. Главный цикл игры - функция **update()**. Она обновляет состояния игроков и посылает данные клиентам в случае необходимости. 
Это лишь часть ф-ии update(), которая отвечает за рассылку сообщений клиентам.


```
    // Send a game update to each player every other time
    if (this.shouldSendUpdate) {
      const leaderboard = this.getLeaderboard();
      Object.keys(this.sockets).forEach(playerID => {
        const socket = this.sockets[playerID];
        const player = this.players[playerID];
        socket.emit(Constants.MSG_TYPES.GAME_UPDATE, this.createUpdate(player, leaderboard));
      });
      this.shouldSendUpdate = false;
    }
  }
```

Обратите внимание, клиенту посылаются данные только если установлен флаг **shouldSendUpdate**. 
Также обратите внимание на конструктор - именно там устанавливается интервал вызова ф-ии **update()** - 


```
    setInterval(this.update.bind(this), 1000 / 20);
```



**AddPlayer** вызывается, когда присоединяется игрок, туже создается начальная конфигурация фигур.

```
  addPlayer(socket, username) {
    this.sockets[socket.id] = socket;

    // Generate a position to start this player at.
    const x = gmap.randomCell();
    const y = gmap.randomCell();
    this.players[socket.id] = new Player(socket.id, username, x, y);
    // Create the figure at the random point
    this.figures.push(new Figure(socket.id, x, y, Math.floor(Math.random() * Math.floor(4))));
    this.shouldSendUpdate = true;
  }
```

Функция **createUpdate** собирает данные для отправки клиентам, каждому клиенту - свой набор данных.

```
createUpdate(player, leaderboard) {
    return {
      t: Date.now(),
      me: player.serializeForUpdate(),
      all: serializeForUpdate(this.players),
      figures: serializeForUpdate(this.figures),
      leaderboard,
    };
  }
```

Обратите внимание, для сбора посылаемых данных используется ф-я **serializeForUpdate**. Эта ф-я есть в каждом классе, наследованном от Object.


 \
Структура **player.js** и **figure.js** в свете описанного самоочевидна, там есть конструктор и **serializeForUpdate**. 
Важный момент - клиент видит не просто ту структуру, которую вы создали на сервере, а _**только**_ то, что сформировыно в ф-ии (в данном случае Figure)


```
  // this function used to organise data to send it to players
  serializeForUpdate() {
    return {
      PlayerID: this.PlayerID,
      FigureID: this.FigureID,
      x: this.x,
      y: this.y,
      figureType: this.figureType,
    };
  }
```
