var Ball = (function () {
    function Ball(x, y, v, w, radius, color) {
        this.x = x;
        this.y = y;
        this.v = v;
        this.w = w;
        this.radius = radius;
        this.color = color;
        this.theta = 0;
        this.phi = 0;
    }
    Ball.prototype.getMass = function () {
        return Math.pow(this.radius, 3);
    };
    Ball.prototype.getEnergy = function () {
        return this.getMass() * (this.v * this.v + this.w * this.w) / 2;
    };
    Ball.prototype.getMomentum = function () {
        var mass = this.getMass();
        return {
            x: mass * this.v,
            y: mass * this.w
        };
    };
    Ball.prototype.ellipse = function (ctx, x, y, w, h) {
        var kappa = .5522848, ox = (w / 2) * kappa, oy = (h / 2) * kappa, xe = x + w, ye = y + h, xm = x + w / 2, ym = y + h / 2;
        ctx.moveTo(x, ym);
        ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
        ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
        ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
        ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
        ctx.closePath();
    };
    Ball.prototype.draw = function (ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        var gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 3);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, "black");
        var whiteGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 3);
        whiteGradient.addColorStop(0, "white");
        whiteGradient.addColorStop(1, "black");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        if(this.theta < Math.PI / 2) {
            var d = this.radius * Math.sin(this.theta);
            var r = 4;
            var cosTheta = Math.cos(this.theta);
            var s = r * cosTheta;
            if(d - s < this.radius) {
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
                ctx.fill();
                ctx.restore();
            }
        }
        ctx.restore();
    };
    Ball.prototype.collisionTime = function (other) {
        var dv = this.v - other.v;
        var dw = this.w - other.w;
        var dx = this.x - other.x;
        var dy = this.y - other.y;
        var p = (dv * dx + dw * dy);
        if(p >= 0) {
            return null;
        }
        var dv2 = dv * dv + dw * dw;
        var r = this.radius + other.radius;
        var q = dv2 * r * r - Math.pow(dv * dy - dw * dx, 2);
        if(q < 0) {
            return null;
        }
        q = Math.sqrt(q);
        if(p <= q) {
            return (-p - q) / dv2;
        }
        return (-p + q) / dv2;
    };
    Ball.prototype.sideCollisionTime = function (x, v, min, max) {
        if(v === 0) {
            return null;
        }
        var result;
        if(v < 0) {
            result = (min - x + this.radius) / v;
        } else {
            result = (max - x - this.radius) / v;
        }
        if(result >= 0) {
            return result;
        }
        return null;
    };
    Ball.prototype.sideXCollisionTime = function (min, max) {
        return this.sideCollisionTime(this.x, this.v, min, max);
    };
    Ball.prototype.sideYCollisionTime = function (min, max) {
        return this.sideCollisionTime(this.y, this.w, min, max);
    };
    Ball.prototype.collide = function (otherBall, restitution) {
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
    Ball.prototype.updatePosition = function (t) {
        var dx = this.v * t;
        var dy = this.w * t;
        this.x += dx;
        this.y += dy;
        var ds2 = dx * dx + dy * dy;
        if(ds2 > 0) {
            var delta = Math.sqrt(ds2) / this.radius;
            var alpha = Math.atan2(this.w, this.v);
            var newPhi = alpha + Math.atan2(Math.sin(this.theta) * Math.sin(this.phi - alpha), Math.sin(this.theta) * Math.cos(this.phi - alpha) * Math.cos(delta) + Math.cos(this.theta) * Math.sin(delta));
            var newTheta = Math.acos(-Math.sin(this.theta) * Math.cos(this.phi - alpha) * Math.sin(delta) + Math.cos(this.theta) * Math.cos(delta));
            this.theta = newTheta;
            this.phi = newPhi;
        }
    };
    Ball.prototype.updateVelocity = function (t, airDragFactor, rollingResistanceDecelleration) {
        var speed2 = this.v * this.v + this.w * this.w;
        if(speed2 > 0) {
            var airResistanceDecelleration = airDragFactor * speed2 / this.radius;
            var totalDecelleration = airResistanceDecelleration + rollingResistanceDecelleration;
            var speed = Math.sqrt(speed2);
            var newSpeed = speed - totalDecelleration * t;
            if(newSpeed <= 0) {
                this.v = 0;
                this.w = 0;
            } else {
                this.v = this.v * newSpeed / speed;
                this.w = this.w * newSpeed / speed;
            }
        }
    };
    return Ball;
})();
var poolParameters = {
    ballRadius: 2.25 * 2.54 / 100 / 2,
    ballMass: 6 / 35.2739619,
    ballBallFriction: 0.05,
    ballBallRestitution: 0.95,
    ballClothRollingResistance: 0.01,
    ballClothSlidingFriction: 0.2,
    ballClothSpinDeceleration: 10,
    ballSideRestitution: 0.75,
    ballClothRestitution: 0.5,
    curTipBallFriction: 0.6,
    cueTipBallRestitution: 0.75,
    tableWidth: 1.93,
    tableHeight: 0.965
};
var RPool = (function () {
    function RPool(canvas, balls) {
        this.parameters = {
            sideRestitution: poolParameters.ballSideRestitution,
            ballRestitution: poolParameters.ballBallRestitution,
            rollingResistance: poolParameters.ballClothRollingResistance,
            g: 9.81,
            ballDensity: poolParameters.ballMass / (4 / 3 * Math.PI * Math.pow(poolParameters.ballRadius, 3)),
            airDragFactor: 3 / 8 * 0.47 * 1.2 / (poolParameters.ballMass / (4 / 3 * Math.PI * Math.pow(poolParameters.ballRadius, 3)))
        };
        this.balls = [];
        this.audioBallBall = new Audio("sounds/ball-ball.mp3");
        this.audioBallSide = new Audio("sounds/ball-side.mp3");
        this.maxSpeed = 100;
        this.stepTime = 1 / 30;
        canvas.width = 400;
        canvas.height = 300;
        this.canvas = canvas;
        this.balls = balls;
        this.draw();
    }
    RPool.prototype.getEnergy = function () {
        var result = 0;
        for(var i = 0; i < this.balls.length; i++) {
            result += this.balls[i].getEnergy();
        }
        return result;
    };
    RPool.prototype.getMomentum = function () {
        var result = {
            x: 0,
            y: 0
        };
        for(var i = 0; i < this.balls.length; i++) {
            var p = this.balls[i].getMomentum();
            result.x += p.x;
            result.y += p.y;
        }
        return result;
    };
    RPool.prototype.draw = function () {
        var ctx = this.canvas.getContext("2d");
        ctx.fillStyle = "green";
        ctx.rect(0, 0, 400, 300);
        ctx.fill();
        for(var i = 0; i < this.balls.length; i++) {
            this.balls[i].draw(ctx);
        }
    };
    RPool.prototype.detectCollisions = function (dt, minx, maxx, miny, maxy) {
        var result = {
            t: dt,
            collisions: []
        };
        var addCollision = function (t, collision) {
            if(t === result.t) {
                result.collisions.push(collision);
            } else {
                result.collisions = [
                    collision
                ];
                result.t = t;
            }
        };
        for(var i = 0; i < this.balls.length; i++) {
            var ball = this.balls[i];
            var t = ball.sideXCollisionTime(minx, maxx);
            if(t && t <= result.t) {
                addCollision(t, {
                    type: "x",
                    b1: ball,
                    b2: null
                });
            }
            t = ball.sideYCollisionTime(miny, maxy);
            if(t && t <= result.t) {
                addCollision(t, {
                    type: "y",
                    b1: ball,
                    b2: null
                });
            }
            for(var j = i + 1; j < this.balls.length; j++) {
                var otherBall = this.balls[j];
                t = ball.collisionTime(otherBall);
                if(t && t <= result.t) {
                    addCollision(t, {
                        type: "b",
                        b1: ball,
                        b2: otherBall
                    });
                }
            }
        }
        return result;
    };
    RPool.prototype.update = function (dt) {
        while(dt > 0) {
            var firstCollisions = this.detectCollisions(dt, 0, 400, 0, 300);
            if(firstCollisions.t > 0) {
                for(var i = 0; i < this.balls.length; i++) {
                    var ball = this.balls[i];
                    ball.updatePosition(firstCollisions.t);
                    ball.updateVelocity(firstCollisions.t, this.parameters.airDragFactor, this.parameters.rollingResistance * this.parameters.g);
                }
            }
            for(var i = 0; i < firstCollisions.collisions.length; i++) {
                var collision = firstCollisions.collisions[i];
                switch(collision.type) {
                    case "x":
                        this.audioBallSide.volume = Math.min(this.maxSpeed, Math.abs(collision.b1.v)) / this.maxSpeed;
                        this.audioBallSide.play();
                        collision.b1.v = -collision.b1.v * this.parameters.sideRestitution;
                        break;
                    case "y":
                        this.audioBallSide.volume = Math.min(this.maxSpeed, Math.abs(collision.b1.w)) / this.maxSpeed;
                        this.audioBallSide.play();
                        collision.b1.w = -collision.b1.w * this.parameters.sideRestitution;
                        break;
                    case "b":
                        var relativeSpeed = Math.abs((collision.b1.v - collision.b2.v) * (collision.b1.x - collision.b2.x) + (collision.b1.w - collision.b2.w) * (collision.b1.y - collision.b2.y));
                        this.audioBallBall.volume = Math.min(this.maxSpeed, relativeSpeed) / this.maxSpeed;
                        this.audioBallBall.play();
                        collision.b1.collide(collision.b2, this.parameters.ballRestitution);
                        break;
                }
            }
            dt -= firstCollisions.t;
        }
        this.draw();
    };
    RPool.prototype.start = function () {
        var _this = this;
        if(!this.timerToken) {
            this.timerToken = setInterval(function () {
                return _this.update(_this.stepTime);
            }, this.stepTime * 1000);
        }
    };
    RPool.prototype.stop = function () {
        if(this.timerToken) {
            clearTimeout(this.timerToken);
            this.timerToken = undefined;
        }
    };
    RPool.prototype.step = function () {
        if(!this.timerToken) {
            this.update(this.stepTime);
        }
    };
    return RPool;
})();
var initialBalls = {
    fromLeft: [
        new Ball(100, 150, 40, 0, 10, "black"), 
        new Ball(200, 150, 0, 0, 10, "red"), 
        
    ],
    fromRight: [
        new Ball(300, 150, -40, 0, 10, "black"), 
        new Ball(200, 150, 0, 0, 10, "red"), 
        
    ],
    fromTop: [
        new Ball(200, 75, 0, 40, 10, "black"), 
        new Ball(200, 150, 0, 0, 10, "red"), 
        
    ],
    fromBottom: [
        new Ball(200, 225, 0, -40, 10, "black"), 
        new Ball(200, 150, 0, 0, 10, "red"), 
        
    ],
    fromTopLeft: [
        new Ball(150, 100, 20, 20, 10, "black"), 
        new Ball(200, 150, 0, 0, 10, "red"), 
        
    ],
    toTopLeftCorner: [
        new Ball(75, 75, -20, -20, 10, "black"), 
        new Ball(50, 50, 0, 0, 10, "red"), 
        
    ],
    fromLeftTwoHorizontal: [
        new Ball(100, 150, 40, 0, 10, "black"), 
        new Ball(200, 150, 0, 0, 10, "red"), 
        new Ball(220, 150, 0, 0, 10, "yellow"), 
        
    ],
    fromLeftFourHorizontal: [
        new Ball(100, 150, 40, 0, 15, "black"), 
        new Ball(200, 150, 0, 0, 10, "red"), 
        new Ball(220, 150, 0, 0, 10, "yellow"), 
        new Ball(240, 150, 0, 0, 10, "yellow"), 
        new Ball(260, 150, 0, 0, 10, "yellow"), 
        
    ],
    fromLeftTwoVertical: [
        new Ball(100, 150, 40, 0, 10, "black"), 
        new Ball(200, 140, 0, 0, 10, "red"), 
        new Ball(200, 160, 0, 0, 10, "yellow"), 
        
    ],
    onLeftBorder: [
        new Ball(75, 150, -20, 0, 10, "black"), 
        new Ball(10, 150, 0, 0, 10, "red"), 
        
    ],
    fromLeftAbove: [
        new Ball(100, 140, 40, 0, 15, "black"), 
        new Ball(200, 150, 0, 0, 15, "red"), 
        
    ],
    fromLeftBelow: [
        new Ball(100, 160, 40, 0, 15, "black"), 
        new Ball(200, 150, 0, 0, 15, "red"), 
        
    ],
    fromLeftGlanceAbove: [
        new Ball(100, 120, 40, 0, 15, "black"), 
        new Ball(200, 150, 0, 0, 15, "red"), 
        
    ],
    fromLeftGlanceBelow: [
        new Ball(100, 180, 40, 0, 15, "black"), 
        new Ball(200, 150, 0, 0, 15, "red"), 
        
    ],
    fromTopLeftAbove: [
        new Ball(50, 120, 20, 20, 15, "black"), 
        new Ball(100, 200, -20, -20, 15, "red"), 
        
    ],
    fromTopLeftBelow: [
        new Ball(50, 180, 20, 20, 15, "black"), 
        new Ball(100, 200, -20, -20, 15, "red"), 
        
    ],
    fromTopLeft2: [
        new Ball(50, 150, 20, 20, 15, "black"), 
        new Ball(100, 200, -20, -20, 15, "red"), 
        
    ],
    fromTopRightAbove: [
        new Ball(200, 80, -20, 20, 15, "black"), 
        new Ball(100, 200, 20, -20, 15, "red"), 
        
    ],
    single: [
        new Ball(20, 50, 40, 0, 20, "red"), 
        
    ],
    test: [
        new Ball(100, 50, 40, 40, 15, "red"), 
        new Ball(200, 80, -40, -40, 12, "blue"), 
        new Ball(200, 150, 0, 0, 12, "orange"), 
        new Ball(220, 180, -10, 15, 12, "magenta"), 
        new Ball(300, 180, 0, -35, 12, "cyan"), 
        
    ]
};
function getQueryParams(qs) {
    qs = qs.split("+").join(" ");
    var re = /[?&]?([^=]+)=([^&]*)/;
    var params = {
    };
    var tokens;
    var index = 0;
    while(tokens = re.exec(qs.substr(index))) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
        index += tokens.index + tokens[0].length;
    }
    return params;
}
$(function () {
    var canvas = document.getElementById('canvas');
    var ballsName = getQueryParams(document.location.search)["init"] || "test";
    var balls = (initialBalls[ballsName] || []);
    if(balls.length === 0) {
        alert("There is no initial ball set '" + ballsName + "'");
    }
    var game = new RPool(canvas, balls);
    $("#start").click(function (event) {
        return game.start();
    });
    $("#stop").click(function (event) {
        return game.stop();
    });
    $("#step").click(function (event) {
        return game.step();
    });
    game.start();
});
