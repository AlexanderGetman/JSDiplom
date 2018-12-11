'use strict';

// Компонент Вектор

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error ('Можно прибавлять к вектору только вектор типа Vector');      
    }
    return new Vector (this.x + vector.x, this.y + vector.y); 
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
    if(!(movingObject instanceof Actor)) {
      throw new Error ('Объект не является экземпляром Actor');
    }

    if (this === movingObject) {
      return false;
    }  

  return this.left < movingObject.right && movingObject.left < this.right && this.top < movingObject.bottom && movingObject.top < this.bottom;    
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
    return this.status !== null && this.finishDelay < 0;    
  }
  

  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error ('Не передан аргумент или передан не объект Actor');
    }
    return this.actors.find(element => element.isIntersect(actor));
  }

  obstacleAt(pos, size) {
    if (!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error ('В качестве аргумента не передан вектор типа Vector');
    }

    const leftBorder = Math.floor(pos.x);
    const rightBorder = Math.ceil(pos.x + size.x);
    const topBorder = Math.floor(pos.y);
    const bottomBorder = Math.ceil(pos.y + size.y);

    if (leftBorder < 0 || rightBorder > this.width || topBorder < 0) {
      return 'wall';
    }

    if (bottomBorder > this.height) {
      return 'lava';
    }

    for (let y = topBorder; y < bottomBorder; y++) {
      for (let x = leftBorder; x < rightBorder; x++) {
        const levelGrid = this.grid[y][x];
        if (levelGrid) {
          return levelGrid;
        }
      }
    }
  }

  removeActor(actor) {
    this.actors = this.actors.filter(element => element !== actor);
  }

  noMoreActors(type) {
    return !this.actors.some(element => element.type === type);
  }
  
  playerTouched(type, actor) {
    if (this.status !== null) {
      return;
    }
    
    if (type === 'lava' || type === 'fireball') {
      this.status = 'lost';
    }

    if (type === 'coin') {
      this.removeActor(actor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }    
  }
}

// Компонент Парсер Уровня

class LevelParser {
  constructor(dictionary = {}) {
    this.dictionary = dictionary;
  }

  actorFromSymbol(gameSymbol) {
    return this.dictionary[gameSymbol];
  }

  obstacleFromSymbol(gameSymbol) {
    if (gameSymbol === 'x') {
      return 'wall';
    }     
    if (gameSymbol === '!') {
      return 'lava';
    }
  }
  

  createGrid(strings = []) {
    return strings.map(el => el.split('').map(i => this.obstacleFromSymbol(i)));
  }

  createActors(strings = []) {
    const actors = [];
    
    strings.forEach((row, y) => {
      row.split('').forEach((cell, x) => {
        const actorCreator = this.actorFromSymbol(cell);
        if (typeof actorCreator === 'function') {
          const actor = new actorCreator(new Vector(x, y));
          if (actor instanceof Actor) {
            actors.push(actor);
          }
        }
      });
    });
    return actors;
  }


  parse(strings = []) {
    const grid = this.createGrid(strings);
    const actors = this.createActors(strings);
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
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
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
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
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
    this.currentPos = this.pos;
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
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
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
    ' @  !!!!!',
    'xxx!!!!!!',
    '         '
  ],
  [
    '      v  ',
    '        ',
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
