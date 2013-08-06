var _this = this;
/// <reference path="jquery/jquery.d.ts" />
/// <reference path="jqueryui/jqueryui.d.ts" />
/// <reference path="jqueryui/jquery.ui.valueslider.d.ts" />
var Ball = (function () {
    function Ball(x, y, v, w, radius, color) {
        this.x = x;
        this.y = y;
        this.v = v;
        this.w = w;
        this.radius = radius;
        this.color = color;
        /** Radius of the white circle drawn on the ball - relative to the ball radius */
        this.circleRadius = 0.3;
        /** First angle describing the orientation of the ball - that is also position of the white circle center */
        this.phi = 0;
        /** Seccond angle describing the orientation of the ball - that is also position of the white circle center */
        this.theta = 0;
    }
    /** Returns the mass of the ball */
    Ball.prototype.getMass = function () {
        return Math.pow(this.radius, 3);
    };

    /** Returns the energy of the ball */
    Ball.prototype.getEnergy = function () {
        return this.getMass() * (this.v * this.v + this.w * this.w) / 2;
    };

    /** Returns the momentum of the ball */
    Ball.prototype.getMomentum = function () {
        var mass = this.getMass();
        return {
            x: mass * this.v,
            y: mass * this.w
        };
    };

    /**
    * draw: draws the ball
    * @param ctx the canvas rendering context to use to draw the ball
    * @param pixelSize size of a single pixel in the current scaling of the canvas
    * @param drawVelocity if true the function draws also the velocity vector
    */
    Ball.prototype.draw = function (ctx, pixelSize, drawVelocity) {
        ctx.save();

        // Move the coordinates to the center of the ball - simplifies everything else
        ctx.translate(this.x, this.y);

        // Gradient from the ball color to black, used to shade the ball color to give an illusion of depth
        var ballColorGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 3);
        ballColorGradient.addColorStop(0, this.color);
        ballColorGradient.addColorStop(1, "black");

        // Gradient from white to black, used to shade the white circle to give an illusion of depth
        var whiteGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 3);
        whiteGradient.addColorStop(0, "white");
        whiteGradient.addColorStop(1, "black");

        // Draw the ball: a circle filled with the ball color shading to black
        ctx.fillStyle = ballColorGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        if (this.theta < Math.PI / 2) {
            // Draw the white circle if it is visible - see http://mimosite.com/blog/post/2013/06/02/Billiard-simulation-part-6-balls-rotation
            var d = this.radius * Math.sin(this.theta);
            var cosTheta = Math.cos(this.theta);
            var circleRadius = this.circleRadius * this.radius;
            var s = circleRadius * cosTheta;
            if (d - s < this.radius) {
                var cosPhi = Math.cos(this.phi);
                var sinPhi = Math.sin(this.phi);

                // Clip to the ball's circle - do not want to draw parts of the white circle that fall outside the ball borders
                ctx.save();
                ctx.clip();

                // Move the coordinates to the center of the white circle
                ctx.translate(d * cosPhi, d * sinPhi);

                // Compress the coordinates by cosTheta in the direction between the center of the white circle and the center of the ball
                ctx.rotate(this.phi);
                ctx.scale(cosTheta, 1);

                // Draw the white circle
                ctx.fillStyle = whiteGradient;
                ctx.beginPath();
                ctx.arc(0, 0, circleRadius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.restore();
            }
        }
        if (drawVelocity && (this.v !== 0 || this.w !== 0)) {
            ctx.beginPath();
            ctx.rotate(Math.atan2(this.w, this.v));
            ctx.moveTo(0, 0);
            var l = Math.sqrt(this.v * this.v + this.w * this.w) / 5;
            var lineWidth = pixelSize;
            var arrowLength = lineWidth * 8;
            var arrowWidth = lineWidth * 3;
            ctx.lineTo(l, 0);
            ctx.lineTo(l - arrowLength, arrowWidth);
            ctx.moveTo(l, 0);
            ctx.lineTo(l - arrowLength, -arrowWidth);
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = this.color;
            ctx.stroke();
        }
        ctx.restore();
    };

    /**
    * Returns the time of the first future collision between this ball and another ball.
    * Returns null if the balls do not collide
    * @param other the other ball
    */
    Ball.prototype.collisionTime = function (other) {
        var dv = this.v - other.v;
        var dw = this.w - other.w;
        var dx = this.x - other.x;
        var dy = this.y - other.y;
        var p = (dv * dx + dw * dy);
        if (p >= 0) {
            // The balls are moving apart or parallel
            return null;
        }
        var dv2 = dv * dv + dw * dw;
        var r = this.radius + other.radius;
        var q = dv2 * r * r - Math.pow(dv * dy - dw * dx, 2);
        if (q < 0) {
            // No real solution: the balls do not collide
            return null;
        }
        q = Math.sqrt(q);
        if (p <= q) {
            return (-p - q) / dv2;
        }
        return (-p + q) / dv2;
    };

    /**
    * Returns the time of the first future collision with a side of the table.
    * Returns null if there is no collision.
    * @param x ball horizontal or vertical position
    * @param v ball horizontal or vertical speed
    * @param min minumum horizontal or vertical position (i.e. co-ordinate of one side of the table)
    * @param max maximum horizontal or vertical position (i.e. co-ordinate of the other side of the table)
    */
    Ball.prototype.sideCollisionTime = function (x, v, min, max) {
        if (v === 0) {
            // Not moving towards the sides: no collision
            return null;
        }
        var result;
        if (v < 0) {
            // Moving up/left - check agains the minumum
            result = (min - x + this.radius) / v;
        } else {
            // Moving down/right - check agains the maximum
            result = (max - x - this.radius) / v;
        }
        if (result >= 0) {
            return result;
        }
        return null;
    };

    /**
    * Returns the time of the first future collision with the left or right sides of the table.
    * Returns null if there is no collision.
    * @param min minumum horizontal position (i.e. x co-ordinate of the left side of the table)
    * @param max maximum horizontal position (i.e. x co-ordinate of the right side of the table)
    */
    Ball.prototype.sideXCollisionTime = function (min, max) {
        return this.sideCollisionTime(this.x, this.v, min, max);
    };

    /**
    * Returns the time of the first future collision with the top or bottom sides of the table.
    * Returns null if there is no collision.
    * @param min minumum vertical position (i.e. y co-ordinate of the top side of the table)
    * @param max maximum vertical position (i.e. y co-ordinate of the bottom side of the table)
    */
    Ball.prototype.sideYCollisionTime = function (min, max) {
        return this.sideCollisionTime(this.y, this.w, min, max);
    };

    /**
    * Updates the velocities of this ball and another one after a collision
    * The coordinate of the balls must be at the collision point.
    * @param otherBall second colliding ball
    * @param restitution coefficient of restitution for a ball-ball collision
    */
    Ball.prototype.collide = function (otherBall, restitution) {
        // See http://mimosite.com/blog/post/2013/05/13/Billiard-simulation-part-3-collision-between-two-balls
        var dx = this.x - otherBall.x;
        var dy = this.y - otherBall.y;
        var dv = this.v - otherBall.v;
        var dw = this.w - otherBall.w;
        var alpha = Math.atan2(dy, dx);
        var sinAlpha = Math.sin(alpha);
        var cosAlpha = Math.cos(alpha);
        var m1 = Math.pow(this.radius, 3);
        var m2 = Math.pow(otherBall.radius, 3);
        var a = (1 + restitution) / (m1 + m2) * (cosAlpha * dv + sinAlpha * dw);
        this.v = -m2 * a * cosAlpha + this.v;
        this.w = -m2 * a * sinAlpha + this.w;
        otherBall.v = m1 * a * cosAlpha + otherBall.v;
        otherBall.w = m1 * a * sinAlpha + otherBall.w;
    };

    /**
    * Updates the velocities of this ball and two other balls after a double collisions
    * with both balls at the exact same time
    * The coordinate of the balls must be at the collision point.
    * @param otherBall1 second colliding ball
    * @param otherBall2 third colliding ball
    * @param restitution coefficient of restitution for a ball-ball collision
    */
    Ball.prototype.collide2 = function (otherBall1, otherBall2, restitution) {
        // See http://mimosite.com/blog/post/2013/06/30/Billiard-simulation-part-8-double-collision
        var m0 = Math.pow(this.radius, 3);
        var m1 = Math.pow(otherBall1.radius, 3);
        var m2 = Math.pow(otherBall2.radius, 3);
        var x01 = otherBall1.x - this.x;
        var y01 = otherBall1.y - this.y;
        var x02 = otherBall2.x - this.x;
        var y02 = otherBall2.y - this.y;
        var p = x01 * x02 + y01 * y02;
        var s01 = x01 * x01 + y01 * y01;
        var s02 = x02 * x02 + y02 * y02;
        var delta = (m0 + m1) * (m0 + m2) * s01 * s02 - m1 * m2 * p * p;
        var v01 = otherBall1.v - this.v;
        var w01 = otherBall1.w - this.w;
        var b01 = (1 + restitution) * (x01 * v01 + y01 * w01);
        var v02 = otherBall2.v - this.v;
        var w02 = otherBall2.w - this.w;
        var b02 = (1 + restitution) * (x02 * v02 + y02 * w02);
        this.v = -(b01 * m1 * (x02 * m2 * p - x01 * (m0 + m2) * s02) + b02 * m2 * (x01 * m1 * p - x02 * (m0 + m1) * s01)) / delta + this.v;
        this.w = -(b01 * m1 * (y02 * m2 * p - y01 * (m0 + m2) * s02) + b02 * m2 * (y01 * m1 * p - y02 * (m0 + m1) * s01)) / delta + this.w;
        var r1 = m0 * (b02 * m2 * p - b01 * (m0 + m2) * s02) / delta;
        otherBall1.v = x01 * r1 + otherBall1.v;
        otherBall1.w = y01 * r1 + otherBall1.w;
        var r2 = m0 * (b01 * m1 * p - b02 * (m0 + m1) * s01) / delta;
        otherBall2.v = x02 * r2 + otherBall2.v;
        otherBall2.w = y02 * r2 + otherBall2.w;
    };

    /**
    * Updates the ball position and orientation, applying the current velocity for a specified time interval
    * @param t the time interval to use. The velocity is considered constant, so the time interval must be
    * small compared to the rate of change of the velocity
    */
    Ball.prototype.updatePosition = function (t) {
        var dx = this.v * t;
        var dy = this.w * t;

        // Update the ball position
        this.x += dx;
        this.y += dy;
        var ds2 = dx * dx + dy * dy;
        if (ds2 > 0) {
            // Update the ball orientation - see http://mimosite.com/blog/post/2013/06/02/Billiard-simulation-part-6-balls-rotation
            var delta = Math.sqrt(ds2) / this.radius;
            var sinDelta = Math.sin(delta);
            var cosDelta = Math.cos(delta);
            var alpha = Math.atan2(this.w, this.v);
            var sinTheta = Math.sin(this.theta);
            var cosTheta = Math.cos(this.theta);
            var phiAlpha = this.phi - alpha;
            var sinPhiAlpha = Math.sin(phiAlpha);
            var cosPhiAlpha = Math.cos(phiAlpha);
            this.phi = alpha + Math.atan2(sinTheta * sinPhiAlpha, sinTheta * cosPhiAlpha * cosDelta + cosTheta * sinDelta);
            this.theta = Math.acos(-sinTheta * cosPhiAlpha * sinDelta + cosTheta * cosDelta);
        }
    };

    /**
    * Updates the ball velocity, applying rolling resistance and air drag for a specified time interval
    * @param t the time interval to use. Only first-order effects are considered, so the time interval
    * must be small compared to the rate of change of the velocity
    * @param airDragFactor total air drag factor computed from the ball and air densities and the
    * air drag coefficient (assumed to be constant)
    * @param rollingResistanceDeceleration total rolling resistance deceleration computed from the
    * rolling resistance coefficient and the gravitational acceleration
    */
    Ball.prototype.updateVelocity = function (t, airDragFactor, rollingResistanceDeceleration) {
        // See http://mimosite.com/blog/post/2013/05/26/Billiard-simulation-part-5-friction
        var speed2 = this.v * this.v + this.w * this.w;
        if (speed2 > 0) {
            var airResistanceDeceleration = airDragFactor * speed2 / this.radius;
            var totalDeceleration = airResistanceDeceleration + rollingResistanceDeceleration;
            var speed = Math.sqrt(speed2);
            var newSpeed = speed - totalDeceleration * t;
            if (newSpeed <= 0) {
                // The ball stopped
                this.v = 0;
                this.w = 0;
            } else {
                // Update the speed, keeping the velocity direction the same (the air drag and rolling resistance
                // forces are in the exact opposite direction of the velocity)
                this.v = this.v * newSpeed / speed;
                this.w = this.w * newSpeed / speed;
            }
        }
    };
    return Ball;
})();

var poolParameters = {
    // From http://www.billiards.colostate.edu/threads/physics.html, converted to MKs
    ballRadius: 2.25 * 2.54 / 100 / 2,
    ballMass: 6 / 35.2739619,
    ballDensity: 1,
    ballBallFriction: 0.05,
    ballBallRestitution: 0.95,
    ballClothRollingResistance: 0.005,
    ballClothSlidingFriction: 0.2,
    ballClothSpinDeceleration: 10,
    ballSideRestitution: 0.75,
    ballClothRestitution: 0.5,
    cueTipBallFriction: 0.6,
    cueTipBallRestitution: 0.75,
    tableWidth: 1.93,
    tableHeight: 0.965,
    // From http://www.grc.nasa.gov/WWW/k-12/airplane/airprop.html
    seaLevelAirDensity: 1.229,
    // From http://www.grc.nasa.gov/WWW/k-12/airplane/dragsphere.html
    sphereDragCoefficient: 0.5,
    // Traditional...
    g: 9.81
};
poolParameters.ballDensity = poolParameters.ballMass / (4 / 3 * Math.PI * Math.pow(poolParameters.ballRadius, 3));

var RPool = (function () {
    function RPool(canvas, balls, doubleCollision, sideRestitution, ballRestitution, rollingResistance, airDensity) {
        /** The balls */
        this.balls = [];
        this.audioBallBall = new Audio("sounds/ball-ball.mp3");
        this.audioBallSide = new Audio("sounds/ball-side.mp3");
        this.maxSpeed = 5;
        this.stepTime = 1 / 30;
        this.pixelsPerMeter = 200;
        this.tableWidth = poolParameters.tableWidth;
        this.tableHeight = poolParameters.tableHeight;
        this.pixelsBorder = 10;
        canvas.width = this.pixelsBorder * 2 + this.tableWidth * this.pixelsPerMeter;
        canvas.height = this.pixelsBorder * 2 + this.tableHeight * this.pixelsPerMeter;
        this.canvas = canvas;
        this.doubleCollision = doubleCollision;
        this.sideRestitution = sideRestitution;
        this.ballRestitution = ballRestitution;
        this.rollingResistance = rollingResistance;
        this.airDensity = airDensity;
        this.setBalls(balls);
    }
    RPool.prototype.setBalls = function (balls) {
        var newBalls = [];
        for (var i = 0; i < balls.length; i++) {
            var ball = balls[i];
            newBalls.push(new Ball(ball.x, ball.y, ball.v, ball.w, ball.radius, ball.color));
        }
        this.balls = newBalls;
        this.draw(true);
    };

    RPool.prototype.getEnergy = function () {
        var result = 0;
        for (var i = 0; i < this.balls.length; i++) {
            result += this.balls[i].getEnergy();
        }
        return result;
    };

    RPool.prototype.getMomentum = function () {
        var result = {
            x: 0,
            y: 0
        };
        for (var i = 0; i < this.balls.length; i++) {
            var p = this.balls[i].getMomentum();
            result.x += p.x;
            result.y += p.y;
        }
        return result;
    };

    /**
    * Draw the table and all the balls
    * @param drawVelocity if true the function draws also the velocity vectors of each ball
    */
    RPool.prototype.draw = function (drawVelocity) {
        var ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.save();
        ctx.translate(this.pixelsBorder, this.pixelsBorder);
        ctx.scale(this.pixelsPerMeter, this.pixelsPerMeter);
        ctx.fillStyle = "green";
        ctx.rect(0, 0, this.tableWidth, this.tableHeight);
        ctx.fill();
        for (var i = 0; i < this.balls.length; i++) {
            this.balls[i].draw(ctx, 1.0 / this.pixelsPerMeter, drawVelocity);
        }
        ctx.restore();
    };

    /**
    * Detect the first collision(s) that happen within the specified time interval
    * Returns an object with the time of the collision and the list of the collisions happening
    * at that time - that is empty if there are no collisions within the specified time
    * @param dt the time interval to consider
    * @param minx minimum x coordinate - i.e. the left side of the table as seen on the screen
    * @param maxx maximum x coordinate - i.e. the right side of the table as seen on the screen
    * @param miny minimum y coordinate - i.e. the top side of the table as seen on the screen
    * @param maxy maximum y coordinate - i.e. the bottom side of the table as seen on the screen
    */
    RPool.prototype.detectCollisions = function (dt, minx, maxx, miny, maxy) {
        var _this = this;
        var result = {
            t: dt,
            collisions: []
        };
        var tryMergeCollisions = function (collisions, collision) {
            if (collision.type !== "b") {
                return false;
            }
            for (var i = 0; i < collisions.length; i++) {
                var curCollision = collisions[i];
                if (curCollision.type === "b") {
                    if (curCollision.balls[0] === collision.balls[0]) {
                        collisions[i] = { type: "b2", balls: [collision.balls[0], collision.balls[1], curCollision.balls[1]] };
                        return true;
                    }
                    if (curCollision.balls[1] === collision.balls[0]) {
                        collisions[i] = { type: "b2", balls: [collision.balls[0], collision.balls[1], curCollision.balls[0]] };
                        return true;
                    }
                    if (curCollision.balls[1] === collision.balls[1]) {
                        collisions[i] = { type: "b2", balls: [collision.balls[1], collision.balls[0], curCollision.balls[0]] };
                        return true;
                    }
                }
            }
            return false;
        };
        var addCollision = function (t, collision) {
            if (t === result.t) {
                if (!_this.doubleCollision || !tryMergeCollisions(result.collisions, collision)) {
                    result.collisions.push(collision);
                }
            } else {
                // The new collision happens before the current one, so it replaces the entire list
                result.collisions = [collision];
                result.t = t;
            }
        };
        for (var i = 0; i < this.balls.length; i++) {
            // Collisions with the sides
            var ball = this.balls[i];
            var t = ball.sideXCollisionTime(minx, maxx);
            if (t !== null && t <= result.t) {
                addCollision(t, { type: "x", balls: [ball] });
            }
            t = ball.sideYCollisionTime(miny, maxy);
            if (t !== null && t <= result.t) {
                addCollision(t, { type: "y", balls: [ball] });
            }

            for (var j = i + 1; j < this.balls.length; j++) {
                var otherBall = this.balls[j];
                t = ball.collisionTime(otherBall);
                if (t !== null && t <= result.t) {
                    addCollision(t, { type: "b", balls: [ball, otherBall] });
                }
            }
        }
        return result;
    };

    RPool.prototype.computeAirDragFactor = function () {
        return 3 / 8 * poolParameters.sphereDragCoefficient * this.airDensity / poolParameters.ballDensity;
    };

    RPool.prototype.computeRollingResistanceDeceleration = function () {
        return this.rollingResistance * poolParameters.g;
    };

    RPool.prototype.update = function (dt, drawVelocity) {
        var airDragFactor = this.computeAirDragFactor();
        var rollingResistanceDeceleration = this.computeRollingResistanceDeceleration();
        while (dt > 0) {
            var firstCollisions = this.detectCollisions(dt, 0, this.tableWidth, 0, this.tableHeight);
            if (firstCollisions.t > 0) {
                for (var i = 0; i < this.balls.length; i++) {
                    var ball = this.balls[i];
                    ball.updatePosition(firstCollisions.t);
                    ball.updateVelocity(firstCollisions.t, airDragFactor, rollingResistanceDeceleration);
                }
            }

            for (var i = 0; i < firstCollisions.collisions.length; i++) {
                var collision = firstCollisions.collisions[i];
                switch (collision.type) {
                    case "x":
                        var ballX = collision.balls[0];
                        this.audioBallSide.volume = Math.min(this.maxSpeed, Math.abs(ballX.v)) / this.maxSpeed;
                        this.audioBallSide.play();
                        ballX.v = -ballX.v * this.sideRestitution;
                        break;
                    case "y":
                        var ballY = collision.balls[0];
                        this.audioBallSide.volume = Math.min(this.maxSpeed, Math.abs(ballY.w)) / this.maxSpeed;
                        this.audioBallSide.play();
                        ballY.w = -ballY.w * this.sideRestitution;
                        break;
                    case "b":
                        var ball0 = collision.balls[0];
                        var ball1 = collision.balls[1];
                        var dx = (ball0.x - ball1.x);
                        var dy = (ball0.y - ball1.y);
                        var relativeSpeed = Math.abs((ball0.v - ball1.v) * dx + (ball0.w - ball1.w) * dy) / Math.sqrt(dx * dx + dy * dy);
                        this.audioBallBall.volume = Math.min(this.maxSpeed, relativeSpeed) / this.maxSpeed;
                        this.audioBallBall.play();
                        ball0.collide(ball1, this.ballRestitution);
                        break;
                    case "b2":
                        var ball0 = collision.balls[0];
                        var ball1 = collision.balls[1];
                        var ball2 = collision.balls[2];
                        var dx1 = (ball0.x - ball1.x);
                        var dy1 = (ball0.y - ball1.y);
                        var dx2 = (ball0.x - ball2.x);
                        var dy2 = (ball0.y - ball2.y);
                        var relativeSpeed = Math.abs((ball0.v - ball1.v) * dx1 + (ball0.w - ball1.w) * dy1) / Math.sqrt(dx1 * dx1 + dy1 * dy1) + Math.abs((ball0.v - ball2.v) * dx2 + (ball0.w - ball2.w) * dy2) / Math.sqrt(dx2 * dx2 + dy2 * dy2);
                        this.audioBallBall.volume = Math.min(this.maxSpeed, relativeSpeed) / this.maxSpeed;
                        this.audioBallBall.play();
                        ball0.collide2(ball1, ball2, this.ballRestitution);
                        break;
                }
            }

            // Continue with the remaining time
            dt -= firstCollisions.t;
        }
        this.draw(drawVelocity);
    };

    RPool.prototype.start = function () {
        var _this = this;
        if (!this.timerToken) {
            this.timerToken = setInterval(function () {
                return _this.update(_this.stepTime, false);
            }, this.stepTime * 1000);
        }
    };

    RPool.prototype.stop = function () {
        if (this.timerToken) {
            clearTimeout(this.timerToken);
            this.timerToken = undefined;
            this.draw(true);
        }
    };

    RPool.prototype.step = function () {
        if (!this.timerToken) {
            this.update(this.stepTime, true);
        }
    };
    return RPool;
})();

function round(v) {
    return Math.round(v * 100) / 100;
}

var yMiddle = round(poolParameters.tableHeight / 2);
var yFourth = round(poolParameters.tableHeight / 4);
var y30 = round(poolParameters.tableHeight / 30);
var xMiddle = round(poolParameters.tableWidth / 2);
var xThird = round(poolParameters.tableWidth / 3);
var xFourth = round(poolParameters.tableWidth / 4);
var rStd = round(poolParameters.ballRadius);
var vFast = 1.0;
var vMedium = 0.5;
var vSlow = 0.25;

var initialBalls = {
    fromLeft: [
        new Ball(xFourth, yMiddle, vFast, 0, rStd, "black"),
        new Ball(xFourth * 2, yMiddle, 0, 0, rStd, "red")
    ],
    fromRight: [
        new Ball(xFourth * 3, yMiddle, -vFast, 0, rStd, "black"),
        new Ball(xFourth * 2, yMiddle, 0, 0, rStd, "red")
    ],
    fromTop: [
        new Ball(xMiddle, yFourth, 0, vFast, rStd, "black"),
        new Ball(xMiddle, yMiddle, 0, 0, rStd, "red")
    ],
    fromBottom: [
        new Ball(xMiddle, yFourth * 3, 0, -vFast, rStd, "black"),
        new Ball(xMiddle, yMiddle, 0, 0, rStd, "red")
    ],
    fromTopLeft: [
        new Ball(xFourth, yFourth, vMedium, vMedium, rStd, "black"),
        new Ball(xFourth + yFourth, yFourth + yFourth, 0, 0, rStd, "red")
    ],
    toTopLeftCorner: [
        new Ball(yFourth * 2, yFourth * 2, -vMedium, -vMedium, rStd, "black"),
        new Ball(yFourth, yFourth, 0, 0, rStd, "red")
    ],
    fromLeftTwoHorizontal: [
        new Ball(xFourth, yMiddle, vFast, 0, rStd, "black"),
        new Ball(xMiddle, yMiddle, 0, 0, rStd, "red"),
        new Ball(xMiddle + rStd * 2, yMiddle, 0, 0, rStd, "yellow")
    ],
    fromLeftFourHorizontal: [
        new Ball(xFourth, yMiddle, vFast, 0, rStd * 1.5, "black"),
        new Ball(xMiddle, yMiddle, 0, 0, rStd, "red"),
        new Ball(xMiddle + rStd * 2, yMiddle, 0, 0, rStd, "yellow"),
        new Ball(xMiddle + rStd * 4, yMiddle, 0, 0, rStd, "yellow"),
        new Ball(xMiddle + rStd * 6, yMiddle, 0, 0, rStd, "yellow")
    ],
    fromLeftTwoVertical: [
        new Ball(xThird, yMiddle, vFast, 0, rStd, "black"),
        new Ball(2 * xThird, yMiddle - rStd, 0, 0, rStd, "red"),
        new Ball(2 * xThird, yMiddle + rStd, 0, 0, rStd, "yellow")
    ],
    fromRightTwoVertical: [
        new Ball(xMiddle, yMiddle - rStd, 0, 0, rStd, "red"),
        new Ball(xMiddle, yMiddle + rStd, 0, 0, rStd, "yellow"),
        new Ball(xMiddle + xFourth, yMiddle, -vFast, 0, rStd, "black")
    ],
    fromTopTwoHorizontal: [
        new Ball(xMiddle - rStd, yMiddle, 0, 0, rStd, "red"),
        new Ball(xMiddle, yFourth, 0, vFast, rStd, "black"),
        new Ball(xMiddle + rStd, yMiddle, 0, 0, rStd, "yellow")
    ],
    fromBottomTwoHorizontal: [
        new Ball(xMiddle - rStd, yMiddle, 0, 0, rStd, "red"),
        new Ball(xMiddle, yMiddle + yFourth, 0, -vFast, rStd, "black"),
        new Ball(xMiddle + rStd, yMiddle, 0, 0, rStd, "yellow")
    ],
    onLeftBorder: [
        new Ball(xFourth, yMiddle, -vMedium, 0, rStd, "black"),
        new Ball(rStd, yMiddle, 0, 0, rStd, "red")
    ],
    fromLeftAbove: [
        new Ball(xFourth, yMiddle - rStd, vFast, 0, rStd * 1.5, "black"),
        new Ball(xMiddle, yMiddle, 0, 0, rStd * 1.5, "red")
    ],
    fromLeftBelow: [
        new Ball(xFourth, yMiddle + rStd, vFast, 0, rStd * 1.5, "black"),
        new Ball(xMiddle, yMiddle, 0, 0, rStd * 1.5, "red")
    ],
    fromLeftGlanceAbove: [
        new Ball(xFourth, yMiddle - rStd * 2, vFast, 0, rStd, "black"),
        new Ball(xMiddle, yMiddle, 0, 0, rStd, "red")
    ],
    fromLeftGlanceBelow: [
        new Ball(xFourth, yMiddle + rStd * 2, vFast, 0, rStd, "black"),
        new Ball(xMiddle, yMiddle, 0, 0, rStd, "red")
    ],
    fromTopLeftAbove: [
        new Ball(xFourth, yFourth - rStd, vSlow, vSlow, rStd * 1.5, "black"),
        new Ball(xFourth + yFourth, yFourth + yFourth, -vSlow, -vSlow, rStd * 1.5, "red")
    ],
    fromTopLeftBelow: [
        new Ball(xFourth, yFourth + rStd, vSlow, vSlow, rStd * 1.5, "black"),
        new Ball(xFourth + yFourth, yFourth + yFourth, -vSlow, -vSlow, rStd * 1.5, "red")
    ],
    fromTopLeft2: [
        new Ball(xFourth, yFourth, vSlow, vSlow, rStd * 1.5, "black"),
        new Ball(xFourth + yFourth, yFourth + yFourth, -vSlow, -vSlow, rStd * 1.5, "red")
    ],
    fromTopRightAbove: [
        new Ball(xMiddle, yFourth - rStd, -vSlow, vSlow, rStd * 1.5, "black"),
        new Ball(xMiddle - yFourth, yFourth + yFourth, vSlow, -vSlow, rStd * 1.5, "red")
    ],
    single: [
        new Ball(xFourth * 3, yFourth * 3, -vMedium, vSlow, rStd, "red")
    ],
    test: [
        new Ball(xFourth, y30 * 5, vFast, vFast, rStd * 1.5, "red"),
        new Ball(xFourth * 2, y30 * 8, -vFast, -vFast, rStd * 1.2, "blue"),
        new Ball(xFourth * 2, yMiddle, 0, 0, rStd * 1.2, "orange"),
        new Ball(xFourth * 2 + rStd * 2, y30 * 18, -vSlow, vMedium, rStd * 1.2, "magenta"),
        new Ball(xFourth * 3, y30 * 18, 0, -vFast, rStd * 1.2, "cyan")
    ]
};

function getQueryParams(qs) {
    qs = qs.split("+").join(" ");
    var re = /[?&]?([^=]+)=([^&]*)/;
    var params = {};
    var tokens;
    var index = 0;
    while (tokens = re.exec(qs.substr(index))) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
        index += tokens.index + tokens[0].length;
    }
    return params;
}

$(function () {
    var canvas = $("#canvas")[0];
    var queryParams = getQueryParams(document.location.search);
    var stop = ("stop" in queryParams);
    var doubleCollision = ("double" in queryParams);
    var ballsName = queryParams["init"] || "test";
    var balls = (initialBalls[ballsName] || []);
    if (balls.length === 0) {
        alert("There is no initial ball set '" + ballsName + "'");
    }
    var game = new RPool(canvas, balls, doubleCollision, poolParameters.ballSideRestitution, poolParameters.ballBallRestitution, poolParameters.ballClothRollingResistance, poolParameters.seaLevelAirDensity);
    var doStart = function () {
        game.start();
        $("#start").attr("disabled", "disabled");
        $("#stop").removeAttr("disabled");
        $("#step").attr("disabled", "disabled");
    };
    var doStop = function () {
        game.stop();
        $("#start").removeAttr("disabled");
        $("#stop").attr("disabled", "disabled");
        $("#step").removeAttr("disabled");
    };
    $("#start").click(function (event) {
        return doStart();
    });
    $("#stop").click(function (event) {
        return doStop();
    });
    $("#step").click(function (event) {
        return game.step();
    });
    var $init = $("#init");
    for (var initName in initialBalls) {
        $init.append(new Option(initName));
    }
    $init.val(ballsName);
    $init.change(function () {
        var ballsName = $(this).val();
        game.setBalls(initialBalls[ballsName]);
    });
    $("#doubleCollision").attr("checked", game.doubleCollision).change(function () {
        game.doubleCollision = this.checked;
    });
    $("#sideRestitution").valueslider({
        min: 0.0,
        max: 1.0,
        step: 0.01,
        value: game.sideRestitution,
        change: function (event, ui) {
            game.sideRestitution = ui.value;
        }
    });
    $("#ballRestitution").valueslider({
        min: 0.0,
        max: 1.0,
        step: 0.01,
        value: game.ballRestitution,
        change: function (event, ui) {
            game.ballRestitution = ui.value;
        }
    });
    $("#rollingResistance").valueslider({
        min: 0.0,
        max: 0.5,
        step: 0.005,
        value: game.rollingResistance,
        change: function (event, ui) {
            game.rollingResistance = ui.value;
        }
    });
    if (stop) {
        doStop();
    } else {
        doStart();
    }
});
//@ sourceMappingURL=app.js.map
