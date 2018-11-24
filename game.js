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

    if(!movingObject || !(movingObject instanceof Actor)) {
      throw new Error ('Объект не является экземпляром Actor');
    }

    if (this === movingObject) {
      return false;
    }

    return (this.left < movingObject.right &&
          movingObject.left < this.right &&
          this.top < movingObject.bottom &&
          movingObject.top < this.bottom);
    // https://stackoverflow.com/questions/2752349/fast-rectangle-to-rectangle-intersection
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

    let leftBorder = pos.x;
    let rightBorder = pos.x + size.x;
    let topBorder = pos.y;
    let bottomBorder = pos.y + size.y;

    if (leftBorder < 0 || rightBorder > this.width || topBorder < 0) {
      return 'wall';
    }

    if (bottomBorder > this.height) {
      return 'lava';
    }

    for (let x = leftBorder; x < rightBorder; x++) {
      for (let y = topBorder; y < bottomBorder; y++) {
        if (this.grid[y][x]) {
          return this.grid[y][x]
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
    if (this.status !== null) {
      return;
    }

    if (type === 'lava' || type === 'fireball') {
      this.status = 'lost';    
    }

    if (type === 'coin' && actor.type === 'coin') {
      this.removeActor('coin');
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}

const grid = [
  [undefined, undefined],
  ['wall', 'wall']
];

function MyCoin(title) {
  this.type = 'coin';
  this.title = title;
}
MyCoin.prototype = Object.create(Actor);
MyCoin.constructor = MyCoin;

const goldCoin = new MyCoin('Золото');
const bronzeCoin = new MyCoin('Бронза');
const player = new Actor();
const fireball = new Actor();

const level = new Level(grid, [ goldCoin, bronzeCoin, player, fireball ]);

level.playerTouched('coin', goldCoin);
level.playerTouched('coin', bronzeCoin);

if (level.noMoreActors('coin')) {
  console.log('Все монеты собраны');
  console.log(`Статус игры: ${level.status}`);
}

const obstacle = level.obstacleAt(new Vector(1, 1), player.size);
if (obstacle) {
  console.log(`На пути препятствие: ${obstacle}`);
}

const otherActor = level.actorAt(player);
if (otherActor === fireball) {
  console.log('Пользователь столкнулся с шаровой молнией');
}


