'use strict';

// Компонент Вектор

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (vector instanceof Vector) {
      return new Vector (this.x + vector.x, this.y + vector.y);
    } throw new Error ('Можно прибавлять к вектору только вектор типа Vector');
  }

  times(multiplier) {
    return new Vector (this.x * multiplier, this.y * multiplier);
  }
}

// Компонент Движущийся объект

class Actor {
  constructor(
    pos = new Vector (0, 0),
    size = new Vector (1, 1),
    speed = new Vector (0, 0)
    ) {
    if (!(pos instanceof Vector) 
        || !(size instanceof Vector) 
        || !(speed instanceof Vector)) {
    throw new Error ('Можно прибавлять к вектору только вектор типа Vector');
    }
    
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  act() {}

  get left() {
    return this.pos.x;
  }
  get right() {
    return this.pos.x + this.size.x;
  }
  get top() {
    return this.pos.y;
  }
  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return 'actor';
  }
  
  isIntersect(movingObject) {

    if (this === movingObject) {
      return false;
    }
  
    if(!movingObject || !(movingObject instanceof Actor)) {
      throw new Error ('Объект не является экземпляром Actor');
    } else {
    return (this.left < movingObject.right &&
          movingObject.left < this.right &&
          this.top < movingObject.bottom &&
          movingObject.top < this.bottom);
    // https://stackoverflow.com/questions/2752349/fast-rectangle-to-rectangle-intersection
    }
  }
}

// Компонент Игровое поле

class Level {
  constructor(grid=[], actors=[]) {
    this.grid = grid;
    this.actors = actors;
    this.player = this.actors.find(actor => actor.type === 'player');
    this.height = this.grid.length;
    this.width = this.grid.reduce((max, arr) => {
      return arr.length > max ? arr.length : max;
    }, 0);
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    if (this.status !== null && this.finishDelay < 0) {
      return true;
    } else {
      return false;
    }
  }

  actorAt(actor) {
    if (!actor || !(actor instanceof Actor)) {
      throw new Error ('Не передан аргумент или передан не объект Actor');
    }
    return this.actors.find(element => element.isIntersect(actor));
  }

  obstacleAt(pos, size) {
    if (!pos || !size || !(pos instanceof Vector) || !(size instanceof Vector)) {
    throw new Error ('В качестве аргумента не передан вектор типа Vector');
    }

    let leftBorder = Math.floor(pos.x);
    let rightBorder = Math.ceil(pos.x + size.x);
    let topBorder = Math.floor(pos.y);
    let bottomBorder = Math.ceil(pos.y + size.y);

    if (leftBorder < 0 || rightBorder > this.width || topBorder < 0) {
      return 'wall';
    }

    if (bottomBorder > this.height) {
      return 'lava';
    }

    for (let x = topBorder; x < bottomBorder; x++) {
      for (let y = leftBorder; y < rightBorder; y++) {
        if (this.grid[x][y]) {
          return this.grid[x][y];
        } else {
          return undefined;
        }
      }
    }

  }

  removeActor(actor) {
    this.actors = this.actors.filter(element => element !== actor);
  }

  noMoreActors(type) {
    if (this.actors.find(element => element.type === type)) {
      return false;
    } return true;
  }
  
  playerTouched(type, actor) {
    if (this.status === null) {
      if (type === 'lava' || type === 'fireball') {
        this.status = 'lost';
        return this.status;
      }

      if (type === 'coin') {
        this.removeActor(actor);
        if (this.noMoreActors('coin')) {
          this.status = 'won';
        }
      }
    }
  }
}

// Компонент Парсер Уровня

class LevelParser {
  constructor(dictionary) {
    this.dictionary = dictionary;
  }

  actorFromSymbol(gameSymbol) {
    if (!gameSymbol) {
      return undefined;
    }
    return this.dictionary[gameSymbol];
  }

  obstacleFromSymbol(gameSymbol) {
    if (gameSymbol === 'x') {
      return 'wall';
    } else if (gameSymbol === '!') {
      return 'lava';
    } else {
      return undefined;
    }
  }

  createGrid(strings = []) {
    return strings.map(el => {
      return el.split('').map(i => {
        return this.obstacleFromSymbol(i);
      });
    });
  }

  createActors(strings = []) {
    let actors = [];
    let array = strings.map(string => string.split(''));

    array.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (this.dictionary && this.dictionary[cell] && typeof this.dictionary[cell] === 'function') {
          let actor = new this.dictionary[cell](new Vector(x, y));
          if (actor instanceof Actor) {
            actors.push(actor);
          }
        }
      });
    });
    return actors;
  }

  parse(strings = []) {
    let grid = this.createGrid(strings);
    let actors = this.createActors(strings);
    return new Level(grid, actors);
  }  
}

// Компоненты Шаровая Молния + Вертикальная, Горизонтальная, Огненный Дождь

class Fireball extends Actor {
  constructor (pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1, 1), speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
  }

  handleObstacle() {
    this.speed.x = -this.speed.x;
    this.speed.y = -this.speed.y;
  }

  act(time, grid) {
    if (grid.obstacleAt(this.getNextPosition(time), this.size)) {
      this.handleObstacle();
    } else {
      this.pos = this.getNextPosition(time);
    }
  }
} 

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos);
    this.size = new Vector(1, 1);
    this.speed = new Vector(2, 0);
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos);
    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 2);
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos);
    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 3);
    this.initialPos = pos;
  }

  handleObstacle() {
    this.pos = this.initialPos;
  }
}

// Компонент Монета

class Coin extends Actor {
  constructor (pos = new Vector (0, 0)) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector (0.6, 0.6));
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * Math.PI * 2;
    this.currentPos = new Vector(this.pos.x, this.pos.y);
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.currentPos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

// Компонент Игрок

class Player extends Actor {
  constructor(pos) {
    super(pos);
    this.pos = this.pos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector(0, 0);
  }

  get type() {
    return 'player';
  }
}


const schemas = [
  [
    '         ',
    '         ',
    '    =    ',
    '       o ',
    '     !xxx',
    ' @       ',
    'xxx!     ',
    '         '
  ],
  [
    '      v  ',
    '    v    ',
    '  v      ',
    '        o',
    '        x',
    '@   x    ',
    'x        ',
    '         '
  ]
];
const actorDict = {
  '@': Player,
  'v': FireRain,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'o': Coin
}
const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => console.log('Вы выиграли приз!'));
