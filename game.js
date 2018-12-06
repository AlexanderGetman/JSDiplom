'use strict';

// Компонент Вектор

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    // лучше сначала проверить аргументы, а потом писать основной код
    if (vector instanceof Vector) {
      return new Vector (this.x + vector.x, this.y + vector.y);
      // не экономьте так строки, очень усложняет чтение
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
      // форматирование
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
  
    // лучше делать проверки в начале функции
    // первая половина проверки лишняя
    if(!movingObject || !(movingObject instanceof Actor)) {
      throw new Error ('Объект не является экземпляром Actor');
    // else можно убрать, т.к. если выполнение зайдёт в if,
    // то будет выброшено исключение и выполнение функции прекратится
    } else {
    // форматирование
    // скобки можно опустить
    return (this.left < movingObject.right &&
          movingObject.left < this.right &&
          this.top < movingObject.bottom &&
          movingObject.top < this.bottom);
    // для кого этот комментарий?
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
    // если выражение в if это true или false
    // то вместо if (<expr>) { return true; } else { return false; }
    // можно писать просто return <expr>
    if (this.status !== null && this.finishDelay < 0) {
      return true;
    } else {
      return false;
    }
  }

  actorAt(actor) {
    // первая половина проверки лишняя
    if (!actor || !(actor instanceof Actor)) {
      throw new Error ('Не передан аргумент или передан не объект Actor');
    }
    return this.actors.find(element => element.isIntersect(actor));
  }

  obstacleAt(pos, size) {
    // проверки !pos || !size лишние (если их убрать, то ничего не изменится)
    if (!pos || !size || !(pos instanceof Vector) || !(size instanceof Vector)) {
    // форматирование
    throw new Error ('В качестве аргумента не передан вектор типа Vector');
    }

    // если значение присваивается переменной 1 раз,
    // то лучше использовать const
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

    // x и y перепутаны местами, код работает правильно,
    // но запутыает человека, который будет потом это читать
    for (let x = topBorder; x < bottomBorder; x++) {
      for (let y = leftBorder; y < rightBorder; y++) {
        // this.grid[x][y] лучше записать в переменную,
        // чтобы 2 раза не писать
        // я бы проверил просто if (this.grid[x][y])
        // (без сравнения с undefined)
        if (this.grid[x][y] !== undefined) {
          return this.grid[x][y];
        }
      }
    }

  }

  removeActor(actor) {
    this.actors = this.actors.filter(element => element !== actor);
  }

  noMoreActors(type) {
    // здесь лучше использовать другой метод массива,
    // который проверяет налицие элементов
    // с помощью функции обратного вызова
    // и возвращает true/false
    if (this.actors.find(element => element.type === type)) {
      return false;
      // экономьте так строки никогда
    } return true;
  }
  
  playerTouched(type, actor) {
    // здесь можно обратить условие, в нём добавить return,
    // тогда уменьшится вложенность кода
    if (this.status === null) {
      if (type === 'lava' || type === 'fireball') {
        this.status = 'lost';
        // функция не возвращает никакого значение
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
    // эта проверка лишняя
    if (!gameSymbol) {
      return undefined;
    }
    return this.dictionary[gameSymbol];
  }

  obstacleFromSymbol(gameSymbol) {
    if (gameSymbol === 'x') {
      return 'wall';
      // else тут можно убрать
    } else if (gameSymbol === '!') {
      return 'lava';
    } else {
      // эта строчки ничего не деает —
      // функция и так возаращает undefined,
      // если не указано иное
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
    // если значение присваивается переменной один раз,
    // то лучше использовать const
    let actors = [];
    let array = strings.map(string => string.split(''));

    array.forEach((row, y) => {
      row.forEach((cell, x) => {
        // this.dictionary лучше проверить в конструкторе,
        // или добавить значение по умолчанию
        // вторая часть проверки лишняя
        // + тут вы дублируете метод actorFromSymbol
        if (this.dictionary && this.dictionary[cell] && typeof this.dictionary[cell] === 'function') {
          // если значение присваивается переменной 1 раз,
          // то лучше использовать const
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
    // тут нужно использовать методы класса Vector
    return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
  }

  handleObstacle() {
    // тут нужно использовать метод класса Vector
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
    // pos, speed должны задаваться через вызов родительского конструктора
    // size уже установлено
    this.size = new Vector(1, 1);
    this.speed = new Vector(2, 0);
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos);
    // pos, speed должны задаваться через вызов родительского конструктора
    // size уже установлено
    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 2);
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos);
    // pos, speed должны задаваться через вызов родительского конструктора
    // size уже установлено
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
    // pos, speed должны задаваться через вызов родительского конструктора
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
