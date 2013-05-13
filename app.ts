/// <reference path="jquery-1.8.d.ts" />

class Ball {

  theta = 0;
  phi = 0;

  constructor(public x: number, public y: number, public v: number, public w: number, public radius: number, public color: string) {
  } // constructor

  /** Returns the mass of the ball */
  getMass() {
    return Math.pow(this.radius, 3);
  } // getMass

  /** Returns the energy of the ball */
  getEnergy() {
    return this.getMass() * (this.v * this.v + this.w * this.w) / 2;
  } // getEnergy

  /** Returns the momentum of the ball */
  getMomentum() {
    var mass = this.getMass();
    return {
      x: mass * this.v,
      y: mass * this.w
    }
  } // getMomentum

  private ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    var kappa = .5522848,
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

    ctx.moveTo(x, ym);
    ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
    ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
    ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
    ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
    ctx.closePath();
  } // ellipse

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    var gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius*3);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, "black");
    var whiteGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 3);
    whiteGradient.addColorStop(0, "white");
    whiteGradient.addColorStop(1, "black");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI*2);
    ctx.fill();
    if (this.theta < Math.PI / 2) {
      var d = this.radius * Math.sin(this.theta);
      var r = 4;
      var cosTheta = Math.cos(this.theta);
      var s = r * cosTheta;
      if (d - s < this.radius) {
        var cosPhi = Math.cos(this.phi);
        var sinPhi = Math.sin(this.phi);
        ctx.fillStyle = whiteGradient;
        ctx.save();
        ctx.clip();
        ctx.translate(d * cosPhi, d * sinPhi);
        ctx.rotate(this.phi);
        ctx.scale(cosTheta, 1);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, 2 * Math.PI);
        // this .ellipse(ctx, d * cosPhi, d * sinPhi, r, s);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  } // draw

  /** 
   * Returns the time of the first future collision between this ball and another ball. 
   * Returns null if the balls do not collide
   * @param other the other ball
   */
  collisionTime(other: Ball) {
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
  } // collisionTime

  /**
   * Returns the time of the first future collision with a side of the table. 
   * Returns null if there is no collision.
   * @param x ball horizontal or vertical position
   * @param v ball horizontal or vertical speed
   * @param min minumum horizontal or vertical position (i.e. co-ordinate of one side of the table)
   * @param max maximum horizontal or vertical position (i.e. co-ordinate of the other side of the table)
   */
  private sideCollisionTime(x: number, v: number, min: number, max: number) {
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
  } // sideCollisionTime

  /**
   * Returns the time of the first future collision with the left or right sides of the table. 
   * Returns null if there is no collision.
   * @param min minumum horizontal position (i.e. x co-ordinate of the left side of the table)
   * @param max maximum horizontal position (i.e. x co-ordinate of the right side of the table)
   */
  sideXCollisionTime(min: number, max: number) {
    return this.sideCollisionTime(this.x, this.v, min, max);
  } // sideXCollisionTime

  /**
   * Returns the time of the first future collision with the top or bottom sides of the table. 
   * Returns null if there is no collision.
   * @param min minumum vertical position (i.e. y co-ordinate of the top side of the table)
   * @param max maximum vertical position (i.e. y co-ordinate of the bottom side of the table)
   */
  sideYCollisionTime(min: number, max: number) {
    return this.sideCollisionTime(this.y, this.w, min, max);
  } // sideYCollisionTime

 
  /**
   * Updates the velocities of this ball and another one after a collision
   * The coordinate of the balls must be at the collision point.
   * @param otherBall second colliding ball
   * @param restitution coefficient of restitution for a ball-ball collision
    */
  collide(otherBall: Ball, restitution: number) {
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
  } // collide

} // class Ball

var poolParameters = {
  // From http://www.billiards.colostate.edu/threads/physics.html, converted to MKs
  ballRadius: 2.25 * 2.54 / 100 / 2,
  ballMass: 6 / 35.2739619,
  ballBallFriction: 0.05,   // 0.03 - 0.028
  ballBallRestitution: 0.95,  // 0.92 - 0.98
  ballClothRollingResistance: 0.01,  // 0.005 - 0.015
  ballClothSlidingFriction: 0.2, // 0.15 - 0.4
  ballClothSpinDeceleration: 10,  // 5-15 - in rad/sec^2 = sec^-2
  ballSideRestitution: 0.75,  // 0.6 - 0.9
  ballClothRestitution: 0.5,
  curTipBallFriction: 0.6,
  cueTipBallRestitution: 0.75,  // 0.71-0.75 (leather tip), 0.81-0.87 (phenolic tip) 
  tableWidth: 1.93,
  tableHeight: 0.965,
};

class RPool {

  private canvas: HTMLCanvasElement;
  private parameters = {
    sideRestitution: poolParameters.ballSideRestitution,
    ballRestitution: poolParameters.ballBallRestitution,
    rollingResistance: poolParameters.ballClothRollingResistance,
    g: 9.81,
    ballDensity: poolParameters.ballMass / (4/3*Math.PI*Math.pow(poolParameters.ballRadius, 3)), 
    airDragFactor: 3 / 8 * 0.47 * 1.2 / (poolParameters.ballMass / (4 / 3 * Math.PI * Math.pow(poolParameters.ballRadius, 3))),
  };
  private balls: Ball[] = [];
  private timerToken: number;
  private audioBallBall = new Audio("sounds/ball-ball.mp3");
  private audioBallSide = new Audio("sounds/ball-side.mp3");
  private maxSpeed = 100;
  private stepTime = 1 / 30;
  

  private static fromLeft = [
    new Ball(100, 150, 40, 0, 10, "black"),
    new Ball(200, 150, 0, 0, 10, "red"),
  ];

  private static fromRight = [
    new Ball(300, 150, -40, 0, 10, "black"),
    new Ball(200, 150, 0, 0, 10, "red"),
  ];

  private static fromTop = [
    new Ball(200, 75, 0, 40, 10, "black"),
    new Ball(200, 150, 0, 0, 10, "red"),
  ];

  private static fromBottom = [
    new Ball(200, 225, 0, -40, 10, "black"),
    new Ball(200, 150, 0, 0, 10, "red"),
  ];

  private static fromTopLeft = [
    new Ball(150, 100, 20, 20, 10, "black"),
    new Ball(200, 150, 0, 0, 10, "red"),
  ];

  private static toTopLeftCorner = [
    new Ball(75, 75, -20, -20, 10, "black"),
    new Ball(50, 50, 0, 0, 10, "red"),
  ];

  private static fromLeftTwoHorizontal = [
    new Ball(100, 150, 40, 0, 10, "black"),
    new Ball(200, 150, 0, 0, 10, "red"),
    new Ball(220, 150, 0, 0, 10, "yellow"),
  ];

  private static fromLeftFourHorizontal = [
    new Ball(100, 150, 40, 0, 15, "black"),
    new Ball(200, 150, 0, 0, 10, "red"),
    new Ball(220, 150, 0, 0, 10, "yellow"),
    new Ball(240, 150, 0, 0, 10, "yellow"),
    new Ball(260, 150, 0, 0, 10, "yellow"),
  ];

  private static fromLeftTwoVertical = [
    new Ball(100, 150, 40, 0, 10, "black"),
    new Ball(200, 140, 0, 0, 10, "red"),
    new Ball(200, 160, 0, 0, 10, "yellow"),
  ];

  private static onLeftBorder = [
    new Ball(75, 150, -20, 0, 10, "black"),
    new Ball(10, 150, 0, 0, 10, "red"),
  ];

  private static fromLeftAbove = [
    new Ball(100, 140, 40, 0, 15, "black"),
    new Ball(200, 150, 0, 0, 15, "red"),
  ];

  private static fromLeftBelow = [
    new Ball(100, 160, 40, 0, 15, "black"),
    new Ball(200, 150, 0, 0, 15, "red"),
  ];

  private static fromLeftGlanceAbove = [
    new Ball(100, 120, 40, 0, 15, "black"),
    new Ball(200, 150, 0, 0, 15, "red"),
  ];

  private static fromLeftGlanceBelow = [
    new Ball(100, 180, 40, 0, 15, "black"),
    new Ball(200, 150, 0, 0, 15, "red"),
  ];

  private static fromTopLeftAbove = [
    new Ball(50, 120, 20, 20, 15, "black"),
    new Ball(100, 200, -20, -20, 15, "red"),
  ];

  private static fromTopLeftBelow = [
    new Ball(50, 180, 20, 20, 15, "black"),
    new Ball(100, 200, -20, -20, 15, "red"),
  ];

  private static fromTopLeft2 = [
    new Ball(50, 150, 20, 20, 15, "black"),
    new Ball(100, 200, -20, -20, 15, "red"),
  ];

  private static fromTopRightAbove = [
    new Ball(200, 80, -20, 20, 15, "black"),
    new Ball(100, 200, 20, -20, 15, "red"),
  ];

  private static single = [
    new Ball(20, 50, 40, 0, 20, "red"),
  ];

  private static test = [
    new Ball(100, 50, 40, 40, 15, "red"),
    new Ball(200, 80, -40, -40, 12, "blue"),
    new Ball(200, 150, 0, 0, 12, "orange"),
    new Ball(220, 180, -10, 15, 12, "magenta"),
    new Ball(300, 180, 0, -35, 12, "cyan"),
  ];

  constructor (canvas: HTMLCanvasElement) {
    canvas.width = 400;
    canvas.height = 300;
    this.canvas = canvas;
    this.balls = RPool.test;
    this.draw();
  } // constructor

  getEnergy() {
    var result = 0;
    for (var i = 0; i < this.balls.length; i++) {
      result += this.balls[i].getEnergy();
    }
    return result;
  } // getEnergy

  getMomentum() {
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
  } // getMomentum

  private draw() {
    var ctx = this.canvas.getContext("2d");
    ctx.fillStyle = "green";
    ctx.rect(0, 0, 400, 300);
    ctx.fill();
    for (var i = 0; i < this.balls.length; i++) {
      this.balls[i].draw(ctx);
    }
  } // draw

  private update(dt: number) {
    while (dt > 0) {
      var bounces = [];
      var mint = dt;
      for (var i = 0; i < this.balls.length; i++) {
        var ball = this.balls[i];
        var t = ball.sideXCollisionTime(0, 400);
        if (t != undefined && t <= mint) {
          var bounce = { type: "x", b1: ball, b2: <Ball>null };
          if (t === mint) {
            bounces.push(bounce);
          } else {
            bounces = [bounce];
            mint = t;
          }
        }
        t = ball.sideYCollisionTime(0, 300);
        if (t != undefined && t <= mint) {
          var bounce = { type: "y", b1: ball, b2: <Ball>null };
          if (t === mint) {
            bounces.push(bounce);
          } else {
            bounces = [bounce];
            mint = t;
          }
        }
        for (var j = i + 1; j < this.balls.length; j++) {
          var otherBall = this.balls[j];
          t = ball.collisionTime(otherBall);
          if (t != undefined && t <= mint) {
            var bounce = { type: "b", b1: ball, b2: otherBall };
            if (t === mint) {
              bounces.push(bounce);
            } else {
              bounces = [bounce];
              mint = t;
            }
          }
        }
      }
      if (mint > 0) {
        for (var i = 0; i < this.balls.length; i++) {
          var ball = this.balls[i];
          var dx = ball.v * mint;
          var dy = ball.w * mint
          ball.x += dx;
          ball.y += dy;
          var ds2 = dx * dx + dy * dy;
          if (ds2 > 0) {
            var delta = Math.sqrt(ds2) / ball.radius;
            var alpha = Math.atan2(ball.w, ball.v);
            var newPhi = alpha + Math.atan2(Math.sin(ball.theta) * Math.sin(ball.phi - alpha), Math.sin(ball.theta) * Math.cos(ball.phi - alpha) * Math.cos(delta) + Math.cos(ball.theta) * Math.sin(delta));
            var newTheta = Math.acos(-Math.sin(ball.theta) * Math.cos(ball.phi - alpha) * Math.sin(delta) + Math.cos(ball.theta) * Math.cos(delta));
            ball.theta = newTheta;
            ball.phi = newPhi;
          }
          var speed2 = ball.v * ball.v + ball.w * ball.w;
          if (speed2 > 0) {
            var airResistanceDecelleration = this.parameters.airDragFactor * speed2 / ball.radius;
            var rollingResistanceDecelleration = this.parameters.rollingResistance * this.parameters.g;
            var totalDecelleration = airResistanceDecelleration + rollingResistanceDecelleration;
            var speed = Math.sqrt(speed2);
            var newSpeed = speed - totalDecelleration * mint;
            if (newSpeed <= 0) {
              ball.v = 0;
              ball.w = 0;
            } else {
              ball.v = ball.v * newSpeed / speed;
              ball.w = ball.w * newSpeed / speed;
            }
          }
        }
      }
      for (var i = 0; i < bounces.length; i++) {
        var bounce = bounces[i];
        switch (bounce.type) {
          case "x":
            this.audioBallSide.volume = Math.min(this.maxSpeed, Math.abs(bounce.b1.v)) / this.maxSpeed;
            this.audioBallSide.play();
            bounce.b1.v = -bounce.b1.v * this.parameters.sideRestitution;
            break;
          case "y":
            this.audioBallSide.volume = Math.min(this.maxSpeed, Math.abs(bounce.b1.w)) / this.maxSpeed;
            this.audioBallSide.play();
            bounce.b1.w = -bounce.b1.w * this.parameters.sideRestitution;
            break;
          case "b":
            var relativeSpeed = Math.abs((bounce.b1.v - bounce.b2.v) * (bounce.b1.x - bounce.b2.x) + (bounce.b1.w - bounce.b2.w) * (bounce.b1.y - bounce.b2.y));
            this.audioBallBall.volume = Math.min(this.maxSpeed, relativeSpeed) / this.maxSpeed;
            this.audioBallBall.play();
            bounce.b1.collide(bounce.b2, this.parameters.ballRestitution);
            break;
        }
      }
      dt -= mint;
    }
    this.draw();
  } // update

  start() {
    if (this.timerToken === undefined) {
      this.timerToken = setInterval(() => this.update(this.stepTime), this.stepTime * 1000);
    }
  } // start

  stop() {
    if (this.timerToken !== undefined) {
      clearTimeout(this.timerToken);
      this.timerToken = undefined;
    }
  } // stop

  step() {
    if (this.timerToken === undefined) {
      this.update(this.stepTime);
    }
  } // step

} // class RPool

$(() => {
  var canvas = <HTMLCanvasElement> document.getElementById('canvas');
  var game = new RPool(canvas);
  $("#start").click(event => game.start());
  $("#stop").click(event => game.stop());
  $("#step").click(event => game.step());
  game.start();
});
