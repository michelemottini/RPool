var Ball = (function () {
    function Ball(x, y, v, w, radius, color) {
        this.x = x;
        this.y = y;
        this.v = v;
        this.w = w;
        this.radius = radius;
        this.color = color;
        this.circleRadius = 4;
        this.phi = 0;
        this.theta = 0;
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
    Ball.prototype.draw = function (ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        var ballColorGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 3);
        ballColorGradient.addColorStop(0, this.color);
        ballColorGradient.addColorStop(1, "black");
        var whiteGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 3);
        whiteGradient.addColorStop(0, "white");
        whiteGradient.addColorStop(1, "black");
        ctx.fillStyle = ballColorGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        if(this.theta < Math.PI / 2) {
            var d = this.radius * Math.sin(this.theta);
            var cosTheta = Math.cos(this.theta);
            var s = this.circleRadius * cosTheta;
            if(d - s < this.radius) {
                var cosPhi = Math.cos(this.phi);
                var sinPhi = Math.sin(this.phi);
                ctx.clip();
                ctx.translate(d * cosPhi, d * sinPhi);
                ctx.rotate(this.phi);
                ctx.scale(cosTheta, 1);
                ctx.fillStyle = whiteGradient;
                ctx.beginPath();
                ctx.arc(0, 0, this.circleRadius, 0, 2 * Math.PI);
                ctx.fill();
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
    Ball.prototype.collide2 = function (otherBall1, otherBall2, restitution) {
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
    Ball.prototype.updatePosition = function (t) {
        var dx = this.v * t;
        var dy = this.w * t;
        this.x += dx;
        this.y += dy;
        var ds2 = dx * dx + dy * dy;
        if(ds2 > 0) {
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
    Ball.prototype.updateVelocity = function (t, airDragFactor, rollingResistanceDeceleration) {
        var speed2 = this.v * this.v + this.w * this.w;
        if(speed2 > 0) {
            var airResistanceDeceleration = airDragFactor * speed2 / this.radius;
            var totalDeceleration = airResistanceDeceleration + rollingResistanceDeceleration;
            var speed = Math.sqrt(speed2);
            var newSpeed = speed - totalDeceleration * t;
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
    ballDensity: 1,
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
    tableHeight: 0.965,
    airDensity: 1.229,
    sphereDragCoefficient: 0.5
};
poolParameters.ballDensity = poolParameters.ballMass / (4 / 3 * Math.PI * Math.pow(poolParameters.ballRadius, 3));
var RPool = (function () {
    function RPool(canvas, balls) {
        this.parameters = {
            sideRestitution: poolParameters.ballSideRestitution,
            ballRestitution: poolParameters.ballBallRestitution,
            rollingResistance: poolParameters.ballClothRollingResistance,
            g: 9.81,
            airDragFactor: 3 / 8 * poolParameters.sphereDragCoefficient * poolParameters.airDensity / poolParameters.ballDensity
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
        var tryMergeCollisions = function (collisions, collision) {
            if(collision.type !== "b") {
                return false;
            }
            for(var i = 0; i < collisions.length; i++) {
                var curCollision = collisions[i];
                if(curCollision.type === "b") {
                    if(curCollision.balls[0] === collision.balls[0]) {
                        collisions[i] = {
                            type: "b2",
                            balls: [
                                collision.balls[0], 
                                collision.balls[1], 
                                curCollision.balls[1]
                            ]
                        };
                        return true;
                    }
                    if(curCollision.balls[1] === collision.balls[0]) {
                        collisions[i] = {
                            type: "b2",
                            balls: [
                                collision.balls[0], 
                                collision.balls[1], 
                                curCollision.balls[0]
                            ]
                        };
                        return true;
                    }
                    if(curCollision.balls[1] === collision.balls[1]) {
                        collisions[i] = {
                            type: "b2",
                            balls: [
                                collision.balls[1], 
                                collision.balls[0], 
                                curCollision.balls[0]
                            ]
                        };
                        return true;
                    }
                }
            }
            return false;
        };
        var addCollision = function (t, collision) {
            if(t === result.t) {
                if(!tryMergeCollisions(result.collisions, collision)) {
                    result.collisions.push(collision);
                }
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
            if(t !== null && t <= result.t) {
                addCollision(t, {
                    type: "x",
                    balls: [
                        ball
                    ]
                });
            }
            t = ball.sideYCollisionTime(miny, maxy);
            if(t !== null && t <= result.t) {
                addCollision(t, {
                    type: "y",
                    balls: [
                        ball
                    ]
                });
            }
            for(var j = i + 1; j < this.balls.length; j++) {
                var otherBall = this.balls[j];
                t = ball.collisionTime(otherBall);
                if(t !== null && t <= result.t) {
                    addCollision(t, {
                        type: "b",
                        balls: [
                            ball, 
                            otherBall
                        ]
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
                        var ballX = collision.balls[0];
                        this.audioBallSide.volume = Math.min(this.maxSpeed, Math.abs(ballX.v)) / this.maxSpeed;
                        this.audioBallSide.play();
                        ballX.v = -ballX.v * this.parameters.sideRestitution;
                        break;
                    case "y":
                        var ballY = collision.balls[0];
                        this.audioBallSide.volume = Math.min(this.maxSpeed, Math.abs(ballY.w)) / this.maxSpeed;
                        this.audioBallSide.play();
                        ballY.w = -ballY.w * this.parameters.sideRestitution;
                        break;
                    case "b":
                        var ball0 = collision.balls[0];
                        var ball1 = collision.balls[1];
                        var relativeSpeed = Math.abs((ball0.v - ball1.v) * (ball0.x - ball1.x) + (ball0.w - ball1.w) * (ball0.y - ball1.y));
                        this.audioBallBall.volume = Math.min(this.maxSpeed, relativeSpeed) / this.maxSpeed;
                        this.audioBallBall.play();
                        ball0.collide(ball1, this.parameters.ballRestitution);
                        break;
                    case "b2":
                        var ball0 = collision.balls[0];
                        var ball1 = collision.balls[1];
                        var ball2 = collision.balls[2];
                        var relativeSpeed = Math.abs((ball0.v - ball1.v) * (ball0.x - ball1.x) + (ball0.w - ball1.w) * (ball0.y - ball1.y)) + Math.abs((ball0.v - ball2.v) * (ball0.x - ball2.x) + (ball0.w - ball2.w) * (ball0.y - ball2.y));
                        this.audioBallBall.volume = Math.min(this.maxSpeed, relativeSpeed) / this.maxSpeed;
                        this.audioBallBall.play();
                        ball0.collide2(ball1, ball2, this.parameters.ballRestitution);
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
    fromLeftTwo: [
        new Ball(100, 150, 40, 0, 10, "black"), 
        new Ball(209, 165.5885, 0, 0, 8, "red"), 
        new Ball(212, 129.2154, 0, 0, 14, "yellow"), 
        
    ],
    fromRightTwoVertical: [
        new Ball(200, 140, 0, 0, 10, "red"), 
        new Ball(200, 160, 0, 0, 10, "yellow"), 
        new Ball(300, 150, -40, 0, 10, "black"), 
        
    ],
    fromTopTwoHorizontal: [
        new Ball(190, 150, 0, 0, 10, "red"), 
        new Ball(200, 50, 0, 40, 10, "black"), 
        new Ball(210, 150, 0, 0, 10, "yellow"), 
        
    ],
    fromBottomTwoHorizontal: [
        new Ball(190, 150, 0, 0, 10, "red"), 
        new Ball(200, 250, 0, -40, 10, "black"), 
        new Ball(210, 150, 0, 0, 10, "yellow"), 
        
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
        new Ball(350, 250, -40, 30, 10, "red"), 
        
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
