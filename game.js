'use strict';

class Vector {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    plus(vector) {

        if (!(vector instanceof Vector)) {
            throw new Error('Можно прибавлять к вектору только вектор типа Vector');
        }

        let nx = this.x + vector.x;
        let ny = this.y + vector.y;

        return new Vector(nx, ny);
    }

    times(n) {

        let nx = this.x * n;
        let ny = this.y * n;

        return new Vector(nx, ny);
    }
}


class Actor {
    constructor(pos, size, speed) {

        if (typeof pos == 'undefined') {

            this.pos = new Vector();

        } else {

            let posIsVector = pos instanceof Vector;

            if (posIsVector) {
                this.pos = pos;
            } else {

                throw new Error();
            }
        }

        if (typeof size == 'undefined') {

            this.size = new Vector(1,1);

        } else {

            let sizeIsVector = size instanceof Vector;

            if (sizeIsVector) {
                this.size = size;
            } else {

                throw new Error();
            }
        }

        if (typeof speed == 'undefined') {

            this.speed = new Vector();

        } else {

            let speedIsVector = speed instanceof Vector;

            if (speedIsVector) {
                this.speed = speed;
            } else {

                throw new Error();
            }
        }

        this.left = this.pos.x;
        this.right = this.pos.x + this.size.x;
        this.top = this.pos.y;
        this.bottom = this.pos.y + this.size.y;

    }

    get type() {
        return 'actor';
    }

    act() {

    }

    isIntersect(actor) {

        let actorIsActor = actor instanceof Actor;

        if (!actorIsActor) {
            throw new Error();
        }

        if (actor == this) {
            return false;
        }

        let intersectX = (this.left < actor.right && this.right > actor.left);
        let intersectY = (this.top < actor.bottom && this.bottom > actor.top);

        return (intersectX && intersectY);
    }
}


class Level {
    constructor(grid, actors) {

        if (grid) {

            let width = 0;

            for (let lineKey in grid) {
                if (grid.hasOwnProperty(lineKey)) {
                    let tmpWidth = grid[lineKey].length;
                    if (tmpWidth > width) {
                        width = tmpWidth;
                    }
                }
            }

            this.height = grid.length;
            this.width = width;

        } else {
            this.height = 0;
            this.width = 0;
        }

        this.status = null;
        this.finishDelay = 1;

        this.finished = false;
        this.coinsCount = 0;
        this.grid = grid;

        if (actors) {

            this.actors = actors;
            let level = this;

            actors.forEach(function (actor) {
                if (actor.type == 'player') {
                    level.player = actor;
                }

                if (actor.type == 'coin') {
                    level.coinsCount = level.coinsCount + 1;
                }
            });

        }


    }

    isFinished() {
        if (status != null && this.finishDelay < 0) {
            return true;
        }

        return this.finished;
    }

    actorAt(actor) {
        if (!(actor instanceof Actor)) {
            throw new Error();
        }

        let actorAt = false;
        let level = this;

        if (this.actors) {

            this.actors.forEach(function (actor2) {
                if (actor.isIntersect(actor2)) {
                    actorAt = actor2;
                }
            });

        }

        if (actorAt) {
            return actorAt;
        }
    }

    obstacleAt(position, size) {

        if (!(position instanceof Vector)) {
            throw new Error();
        }

        if (!(size instanceof Vector)) {
            throw new Error();
        }

        let obstacle = undefined;

        // left border
        if (position.x < 0) {
            obstacle = 'wall';
        }

        // right border
        if ((position.x + size.x) > this.width) {
            obstacle = 'wall';
        }

        // top border
        if (position.y < 0) {
            obstacle = 'wall';
        }

        // bottom border
        if ((position.y + size.y) > this.height) {
            obstacle = 'lava';
        }

        console.group('Level: obstacleAt');
        console.log('level.grid:', this.grid);
        console.log('position:', position);
        console.log('size:', size);

        let actor = new Actor(position, size);

        console.log('actor:', actor);
        
        // num % 1 != 0
        // 23 % 1 = 0
        // 23.5 % 1 = 0.5

        console.groupEnd();

        return obstacle;

    }

    removeActor(actor) {

        console.log('Level removeActor actor:', actor);
        console.log(this.actors.length);

        let level = this;

        if (level.actors) {

            level.actors.forEach(function (actor2, index) {
                if (actor2 == actor) {
                    level.actors.splice(index, 1);

                    if (actor2.type == 'coin') {
                        level.coinsCount = level.coinsCount - 1;
                    }
                }
            });

            if (level.coinsCount == 0) {
                level.status = 'won';
            }

            console.log('coinsCount:', this.coinsCount);

        }
    }

    noMoreActors(type) {

        console.log('Level noMoreActors type:', type);

        let level = this;
        let noMore = false;

        if (!this.actors) {
            return true;
        }

        let actors = level.actors.filter(actor => actor.type == type);

        noMore = !actors.length;

        return noMore;

    }

    playerTouched(type, actorObj) {

        if (type == 'lava' || type == 'fireball') {
            this.status = 'lost';
        }

        if (type == 'coin') {
            this.removeActor(actorObj);
        }
    }
}

class LevelParser {
    constructor(dict) {

        if (!dict) {
            return undefined;
        }

        this.dict = dict;
    }

    actorFromSymbol(symbol) {
        if (!symbol) {
            return undefined;
        }

        if (this.dict && this.dict.hasOwnProperty(symbol)) {
            return this.dict[symbol];
        }
    }

    obstacleFromSymbol(symbol) {
        if (!symbol) {
            return undefined;
        }

        if (symbol == 'x') {
            return 'wall';
        }

        if (symbol == '!') {
            return 'lava';
        }
    }

    createGrid(plan) {

        if (!plan.length) {
            return [];
        }

        let parser = this;

        let grid = new Array(plan.length);

        // console.group('createGrid');
        // console.log('plan:', plan);

        plan.forEach(function(row, rowIndex) {

            let parsedRow = [];

            for (let i = 0, len = row.length; i < len; i++) {

                let cell = row[i];
                let parsedObstacle = parser.obstacleFromSymbol(cell);

                parsedRow[i] = parsedObstacle;

                // console.log('cell:', cell);
            }

            grid[rowIndex] = parsedRow;

        });

        // console.groupEnd();
        // console.log(grid);

        return grid;

    }

    createActors(plan) {

        if (!plan.length) {
            return [];
        }

        let parser = this;

        let grid = [];

        if (!parser.dict) {
            return grid;
        }

        console.log('createActors parser dict:', parser.dict);
        console.log('createActors plan:', plan);

        plan.forEach(function(symbol, symbolIndex) {

            for (let i = 0, len = symbol.length; i < len; i++) {

                let cell = symbol[i];

                let parsedActor = parser.actorFromSymbol(cell);

                if (parsedActor) {

                    let isConstructor = typeof parsedActor == 'function';
                    let isActorClass = parsedActor === Actor || parsedActor.prototype instanceof Actor;

                    if (isConstructor && isActorClass) {

                        let position = new Vector(i, symbolIndex);
                        // console.log(position);
                        let newActor = new parsedActor(position);
                        grid.push(newActor);
                    }

                }
            }


        });

        return grid;
    }

    parse(plan) {

        let grid = this.createGrid(plan);
        let actors = this.createActors(plan);

        return new Level(grid, actors);
    }
}

class Fireball extends Actor {
    constructor(pos, speed) {
        console.log('Fireball speed:', speed);
        super(pos, undefined, speed);
    }

    get type() {
        return 'fireball'
    }

    getNextPosition(time) {

        let nextPosition = this.pos.plus(this.speed);

        if (parseInt(time)) {
            nextPosition = this.pos.plus(this.speed.times(time));
        }

        return nextPosition;
    }

    handleObstacle() {

        if (this.speed.x != 0) {
            this.speed.x = this.speed.x * -1;
        }

        if (this.speed.y != 0) {
            this.speed.y = this.speed.y * -1;
        }
        console.log(this.speed);

    }
}


class HorizontalFireball extends Fireball {

}

class VerticalFireball extends Fireball {

}

class Coin extends Actor {

}
