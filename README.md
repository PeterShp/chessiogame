# chessiogame

## Логика работы сервера RoyalChess.

### Server.js

Инициализируются сетевые интерфейсы и библиотеки


```js
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


```js
// Setup the Game
const game = new Game();
```



Ставятся обработчики сообщений от клиентов, по заданному событию вызывается функция. Constants.MSG_TYPES… - это просто строки, маркеры сообщений.


```js
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


```js
  socket.emit(Constants.MSG_TYPES.MOVE, { /*your data there as object*/  });//клиентский код!!!
```



В функции обработчика событий можно использовать this - это сокет (по сути - клиент), от которого поступило сообщение. Пример


```js
  socket.on(Constants.MSG_TYPES.MOVE, handleMove);//регистрируем обрабочик сообщений 'move'

function handleMove(move) {
  game.makeMove(this.id, move.X0, move.Y0, move.X1, move.Y1);
}
```



Используется this.id - это идентификатор сокета, который используется как идентификатор игрока.


### Game.js


Класс **Game**- основа игры. Главный цикл игры - функция **update()**. Она обновляет состояния игроков и посылает данные клиентам в случае необходимости. 
Это лишь часть ф-ии update(), которая отвечает за рассылку сообщений клиентам.


```js
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


```js
    setInterval(this.update.bind(this), 1000 / 20);
```



**AddPlayer** вызывается, когда присоединяется игрок, туже создается начальная конфигурация фигур.

```js
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

```js
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
Структура **player.js** и **figure.js** в свете описанного самоочевидна, там есть конструктор и **serializeForUpdate**. 
Важный момент - клиент видит не просто ту структуру, которую вы создали на сервере, а _**только**_ то, что сформировыно в ф-ии (в данном случае Figure)


```js
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

## Поддержка разноцветных SVG изображений
Любой ассет в игре мы можем получить с помощью команды **GetAsset('asset_name')**. Если это SVG файл, то не получится изменить цвет его частей на уровне клиента/рендера. Мы попробуем сделать это на уровне сервера. Например, было бы хорошо, чтобы команда
```js
const red_pawn = GetAsset('pawn-white.svg/white=ff0000');
```
... помещала в red_pawn изображение пешки, где весь белый цвет заменен на красный (к примеру). Если мы посмотрим на структуру svg фала, то кажется, для замены цвета 
достаточно в тексте svg поменять **ffffff** на желаемый цвет, в данном случае **ff0000**.
```svg
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45">
  <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;"/>
</svg>
```
Для этого мы модифицируем **server.js** так, чтобы запросы на скачивание svg файлов обрабатывались с учетом опции **/white=ff0000**. Это делается добавлением в  **server.js** дополнительного обработчика
```js
app.use((req, res, next) => {
  if (req.path.includes('.svg')) {
    console.log(req.path);// req.path содержит относительный путь, в нашем случае это '/pawn-white.svg/white=ff0000'
    // код ответа клиенту писать тут.
    return;
  }
  next();// обработка запросов, которые не касатся модификации svg
});
```
В обработчике мы должны проверить, есть ли в строке **req.path** подстрока **/white=**, считать цвет, считать оригинальный файл и заменить в нем **ffffff** на наш цвет. Потом мы должны отправить измененный файл клиенту. Для того, чтобы клиент понял, что ему отправляют именно svg, ответ должен быть таким
```js
res.writeHead(200, { 'Content-Type': 'image/svg+xml' });// указываем в заголовке, что это svg
res.write(data);// в data - модифицированный svg
res.end();// сигнализируем, что передача окончена
```
В итоге получаем такой обработчик
```js
app.use((req, res, next) => {
  if (req.path.includes('.svg/')) {
    const url = req.path;
    const white = url.indexOf('/white=');
    const black = url.indexOf('/black=');
    if (white > 0 || black > 0) {
      let svg = fs.readFileSync(`./public${url.substring(0, url.indexOf('.svg') + 4)}`, 'utf8');
      if (white > 0) svg = svg.replace(/ffffff/g, url.substring(white + 7, white + 13));
      if (black > 0) svg = svg.replace(/000000/g, url.substring(black + 7, black + 13));
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      res.write(svg);
      res.end();
      return;
    }
  }
  next();
});
```
