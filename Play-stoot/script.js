"use strict";

/* =========================================================
   STOOT 4.0 - BROWSER VERSION
   Based on the original SFML game
   ========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = 1280;
const HEIGHT = 720;

const PI = Math.PI;

const ASSET_PATH = "../assets/";

/* =========================================================
   GAME STATE
   ========================================================= */

const STATE = {
    MAIN_MENU: "main_menu",
    SHIP_SELECT: "ship_select",
    LEVEL_SELECT: "level_select",
    SETTINGS: "settings",
    PLAYING: "playing",
    PAUSED: "paused",
    GAME_OVER: "game_over"
};

let state = STATE.MAIN_MENU;

let selectedShip = 0;
let selectedLevel = 1;

let score = 0;
let destroyed = 0;
let coins = 0;
let level = 1;
let combo = 0;
let comboTimer = 0;

let laserTimer = 0;
let asteroidTimer = 0;
let powerTimer = 5;
let enemySpawnTimer = 1;

let mouse = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    down: false
};

const keys = {};

let lastTime = 0;
let gameTime = 0;

/* =========================================================
   ASSETS
   ========================================================= */

const assets = {};

const assetFiles = {
    playerBlue: "player_blue.png",
    playerRed: "player_red.png",
    playerGreen: "player_green.png",
    playerPurple: "player_purple.png",

    enemyChaser: "enemy_chaser.png",
    enemyDodger: "enemy_dodger.png",
    enemyShooter: "enemy_shooter.png",

    asteroidSmall: "asteroid_small.png",
    asteroidMedium: "asteroid_medium.png",
    asteroidLarge: "asteroid_large.png",

    laserBlue: "laser_blue.png",
    laserGreen: "laser_green.png",
    laserPurple: "laser_purple.png",
    laserRed: "laser_red.png",

    background1: "background-1.png",

    healthFull: "health_full-heart.png",
    healthHalf: "health_half-heart.png",
    healthEmpty: "health_empty-heart.png",

    goldCoin: "gold-coin.png",

    healthPower: "health_power-up.png",
    rapidFirePower: "rapid-fire_power-up.png",
    tripleLaserPower: "triple-laser_power-up.png",
    speedBoostPower: "speed-boost_power-up.png",
    shieldPower: "shield_power-up.png",
    bombPower: "space-bomb_power-up.png"
};

let totalAssets = Object.keys(assetFiles).length;
let loadedAssets = 0;

/* =========================================================
   LOAD ASSETS
   ========================================================= */

function loadAssets() {

    return new Promise(resolve => {

        for (const [name, file] of Object.entries(assetFiles)) {

            const image = new Image();

            image.onload = () => {

                loadedAssets++;

                const progress =
                    (loadedAssets / totalAssets) * 100;

                document.getElementById(
                    "loading-progress"
                ).style.width = `${progress}%`;

                if (loadedAssets === totalAssets) {
                    resolve();
                }
            };

            image.onerror = () => {

                console.warn(
                    "Could not load asset:",
                    file
                );

                loadedAssets++;

                const progress =
                    (loadedAssets / totalAssets) * 100;

                document.getElementById(
                    "loading-progress"
                ).style.width = `${progress}%`;

                if (loadedAssets === totalAssets) {
                    resolve();
                }
            };

            image.src = ASSET_PATH + file;

            assets[name] = image;
        }
    });
}

/* =========================================================
   MATH
   ========================================================= */

function distance(a, b) {

    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);
}

function length(v) {

    return Math.sqrt(
        v.x * v.x +
        v.y * v.y
    );
}

function normalize(v) {

    const l = length(v);

    if (l === 0) {
        return {
            x: 0,
            y: 0
        };
    }

    return {
        x: v.x / l,
        y: v.y / l
    };
}

function fromAngle(angle, speed) {

    return {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
    };
}

function angleBetween(a, b) {

    return Math.atan2(
        b.y - a.y,
        b.x - a.x
    );
}

function randomFloat(min, max) {

    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {

    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}

function clamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );
}

/* =========================================================
   DRAW HELPERS
   ========================================================= */

function drawImageCentered(
    image,
    x,
    y,
    width,
    height,
    rotation = 0
) {

    if (!image || !image.complete || !image.naturalWidth) {
        return;
    }

    ctx.save();

    ctx.translate(x, y);

    ctx.rotate(rotation);

    ctx.drawImage(
        image,
        -width / 2,
        -height / 2,
        width,
        height
    );

    ctx.restore();
}

function drawText(
    text,
    x,
    y,
    size = 20,
    color = "#ffffff",
    align = "left"
) {

    ctx.save();

    ctx.font =
        `${size}px Arial, Helvetica, sans-serif`;

    ctx.fillStyle = color;

    ctx.textAlign = align;

    ctx.textBaseline = "middle";

    ctx.fillText(
        text,
        x,
        y
    );

    ctx.restore();
}

function drawCenteredText(
    text,
    x,
    y,
    size = 20,
    color = "#ffffff"
) {

    drawText(
        text,
        x,
        y,
        size,
        color,
        "center"
    );
}

function roundedRect(
    x,
    y,
    width,
    height,
    radius
) {

    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        width,
        height,
        radius
    );
}

function drawPanel(
    x,
    y,
    width,
    height,
    fill = "rgba(10,20,40,0.94)",
    stroke = "#3c96ff",
    lineWidth = 2
) {

    ctx.save();

    roundedRect(
        x,
        y,
        width,
        height,
        3
    );

    ctx.fillStyle = fill;

    ctx.fill();

    ctx.strokeStyle = stroke;

    ctx.lineWidth = lineWidth;

    ctx.stroke();

    ctx.restore();
}

function drawButton(
    text,
    x,
    y,
    width,
    height,
    hovered = false
) {

    ctx.save();

    ctx.fillStyle = hovered
        ? "rgba(35,70,120,0.98)"
        : "rgba(15,25,50,0.90)";

    ctx.strokeStyle = hovered
        ? "#64d2ff"
        : "#3c96ff";

    ctx.lineWidth = hovered ? 3 : 2;

    ctx.fillRect(
        x,
        y,
        width,
        height
    );

    ctx.strokeRect(
        x,
        y,
        width,
        height
    );

    drawCenteredText(
        text,
        x + width / 2,
        y + height / 2,
        26,
        hovered
            ? "#b4f0ff"
            : "#ffffff"
    );

    ctx.restore();
}

function isInside(
    x,
    y,
    width,
    height
) {

    return (
        mouse.x >= x &&
        mouse.x <= x + width &&
        mouse.y >= y &&
        mouse.y <= y + height
    );
}

/* =========================================================
   BACKGROUND
   ========================================================= */

function drawBackground() {

    const bg = assets.background1;

    if (
        bg &&
        bg.complete &&
        bg.naturalWidth
    ) {

        ctx.drawImage(
            bg,
            0,
            0,
            WIDTH,
            HEIGHT
        );

    } else {

        ctx.fillStyle = "#000";

        ctx.fillRect(
            0,
            0,
            WIDTH,
            HEIGHT
        );

        drawStars();
    }
}

function drawStars() {

    ctx.save();

    for (let i = 0; i < 100; i++) {

        const x =
            (i * 173) % WIDTH;

        const y =
            (i * 97) % HEIGHT;

        const alpha =
            0.2 +
            ((i * 37) % 60) / 100;

        ctx.fillStyle =
            `rgba(180,210,255,${alpha})`;

        ctx.fillRect(
            x,
            y,
            1.5,
            1.5
        );
    }

    ctx.restore();
}

/* =========================================================
   PLAYER
   ========================================================= */

class Player {

    constructor() {

        this.position = {
            x: WIDTH / 2,
            y: HEIGHT / 2
        };

        this.speed = 430;

        this.health = 5;
        this.maxHealth = 5;

        this.shipColor = 0;

        this.shield = false;

        this.shieldTimer = 0;
        this.rapidFireTimer = 0;
        this.tripleLaserTimer = 0;
        this.speedTimer = 0;

        this.rotation = 0;
    }

    getImage() {

        if (this.shipColor === 0) {
            return assets.playerBlue;
        }

        if (this.shipColor === 1) {
            return assets.playerRed;
        }

        if (this.shipColor === 2) {
            return assets.playerGreen;
        }

        return assets.playerPurple;
    }

    getLaserImage() {

        if (this.shipColor === 0) {
            return assets.laserBlue;
        }

        if (this.shipColor === 1) {
            return assets.laserRed;
        }

        if (this.shipColor === 2) {
            return assets.laserGreen;
        }

        return assets.laserPurple;
    }

    update(dt) {

        let movement = {
            x: 0,
            y: 0
        };

        if (keys["w"] || keys["arrowup"]) {
            movement.y -= 1;
        }

        if (keys["s"] || keys["arrowdown"]) {
            movement.y += 1;
        }

        if (keys["a"] || keys["arrowleft"]) {
            movement.x -= 1;
        }

        if (keys["d"] || keys["arrowright"]) {
            movement.x += 1;
        }

        movement = normalize(movement);

        let currentSpeed = this.speed;

        if (this.speedTimer > 0) {
            currentSpeed *= 1.7;
        }

        this.position.x +=
            movement.x *
            currentSpeed *
            dt;

        this.position.y +=
            movement.y *
            currentSpeed *
            dt;

        this.position.x =
            clamp(
                this.position.x,
                70,
                WIDTH - 70
            );

        this.position.y =
            clamp(
                this.position.y,
                100,
                HEIGHT - 80
            );

        if (length(movement) > 0.1) {

            const targetAngle =
                Math.atan2(
                    movement.y,
                    movement.x
                ) *
                180 /
                PI +
                90;

            let difference =
                targetAngle -
                this.rotation;

            while (difference > 180) {
                difference -= 360;
            }

            while (difference < -180) {
                difference += 360;
            }

            this.rotation +=
                difference *
                Math.min(
                    1,
                    dt * 8
                );

            if (
                Math.random() <
                dt * 45
            ) {

                engineParticles.push(
                    new EngineParticle({
                        x: this.position.x,
                        y: this.position.y + 35
                    })
                );
            }
        }

        this.shieldTimer =
            Math.max(
                0,
                this.shieldTimer - dt
            );

        this.rapidFireTimer =
            Math.max(
                0,
                this.rapidFireTimer - dt
            );

        this.tripleLaserTimer =
            Math.max(
                0,
                this.tripleLaserTimer - dt
            );

        this.speedTimer =
            Math.max(
                0,
                this.speedTimer - dt
            );

        if (this.shieldTimer <= 0) {
            this.shield = false;
        }
    }

    damage() {

        if (this.shield) {
            return;
        }

        this.health--;

        if (this.health < 0) {
            this.health = 0;
        }
    }

    alive() {

        return this.health > 0;
    }

    draw() {

        drawImageCentered(
            this.getImage(),
            this.position.x,
            this.position.y,
            80,
            80,
            this.rotation * PI / 180
        );

        if (this.shield) {

            const pulse =
                55 +
                Math.sin(gameTime * 6) * 5;

            ctx.save();

            ctx.beginPath();

            ctx.arc(
                this.position.x,
                this.position.y,
                pulse,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                "rgba(50,190,255,0.82)";

            ctx.lineWidth = 5;

            ctx.stroke();

            ctx.restore();
        }
    }
}

const player = new Player();

/* =========================================================
   ENGINE PARTICLE
   ========================================================= */

class EngineParticle {

    constructor(position) {

        this.x = position.x;
        this.y = position.y;

        this.radius =
            randomFloat(2, 5);

        this.velocity = {
            x: randomFloat(-25, 25),
            y: randomFloat(50, 120)
        };

        this.life =
            randomFloat(
                0.25,
                0.55
            );

        this.maxLife = this.life;
    }

    update(dt) {

        this.x +=
            this.velocity.x * dt;

        this.y +=
            this.velocity.y * dt;

        this.life -= dt;
    }

    draw() {

        if (this.life <= 0) {
            return;
        }

        ctx.save();

        ctx.globalAlpha =
            Math.max(
                0,
                this.life /
                this.maxLife
            );

        ctx.fillStyle =
            "#46beff";

        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            this.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }

    alive() {

        return this.life > 0;
    }
}

/* =========================================================
   EXPLOSION PARTICLE
   ========================================================= */

class Particle {

    constructor(position) {

        this.x = position.x;
        this.y = position.y;

        this.radius =
            randomFloat(2, 5);

        this.velocity = {
            x: randomFloat(-200, 200),
            y: randomFloat(-200, 200)
        };

        this.life = 1;
    }

    update(dt) {

        this.x +=
            this.velocity.x * dt;

        this.y +=
            this.velocity.y * dt;

        this.velocity.x *= 0.95;
        this.velocity.y *= 0.95;

        this.life -= dt;

        if (this.life < 0) {
            this.life = 0;
        }
    }

    draw() {

        if (this.life <= 0) {
            return;
        }

        ctx.save();

        ctx.globalAlpha =
            this.life;

        ctx.fillStyle =
            "#ffb432";

        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            this.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }

    alive() {

        return this.life > 0;
    }
}

const particles = [];
const engineParticles = [];

function createExplosion(
    position,
    amount
) {

    for (let i = 0; i < amount; i++) {

        particles.push(
            new Particle(position)
        );
    }
}

/* =========================================================
   LASER
   ========================================================= */

class Laser {

    constructor(
        image,
        start,
        direction,
        speed = 850
    ) {

        this.image = image;

        this.x = start.x;
        this.y = start.y;

        const dir =
            normalize(direction);

        this.velocity = {
            x: dir.x * speed,
            y: dir.y * speed
        };

        this.rotation =
            Math.atan2(
                direction.y,
                direction.x
            ) +
            PI / 2;

        this.alive = true;
    }

    update(dt) {

        this.x +=
            this.velocity.x * dt;

        this.y +=
            this.velocity.y * dt;

        if (
            this.x < -100 ||
            this.x > WIDTH + 100 ||
            this.y < -100 ||
            this.y > HEIGHT + 100
        ) {

            this.alive = false;
        }
    }

    draw() {

        drawImageCentered(
            this.image,
            this.x,
            this.y,
            24,
            48,
            this.rotation
        );
    }
}

const lasers = [];
const enemyLasers = [];

/* =========================================================
   ASTEROID
   ========================================================= */

class Asteroid {

    constructor(
        image,
        position,
        size
    ) {

        this.image = image;

        this.x = position.x;
        this.y = position.y;

        this.size = size;

        this.alive = true;

        if (size === 3) {

            this.health = 3;

            this.scale = 0.55;

            this.drawSize = 120;

        } else if (size === 2) {

            this.health = 2;

            this.scale = 0.38;

            this.drawSize = 85;

        } else {

            this.health = 1;

            this.scale = 0.25;

            this.drawSize = 60;
        }

        const angle =
            randomFloat(
                0,
                PI * 2
            );

        let speed;

        if (size === 3) {

            speed =
                randomFloat(50, 100);

        } else if (size === 2) {

            speed =
                randomFloat(80, 140);

        } else {

            speed =
                randomFloat(120, 190);
        }

        this.velocity =
            fromAngle(
                angle,
                speed
            );

        this.rotation =
            randomFloat(
                0,
                PI * 2
            );
    }

    update(dt) {

        this.x +=
            this.velocity.x * dt;

        this.y +=
            this.velocity.y * dt;

        if (this.x < -150) {
            this.x = WIDTH + 150;
        }

        if (this.x > WIDTH + 150) {
            this.x = -150;
        }

        if (this.y < -150) {
            this.y = HEIGHT + 150;
        }

        if (this.y > HEIGHT + 150) {
            this.y = -150;
        }

        this.rotation +=
            35 *
            PI /
            180 *
            dt;
    }

    hit() {

        this.health--;

        if (this.health <= 0) {
            this.alive = false;
        }
    }

    draw() {

        drawImageCentered(
            this.image,
            this.x,
            this.y,
            this.drawSize,
            this.drawSize,
            this.rotation
        );
    }
}

const asteroids = [];

/* =========================================================
   ENEMY
   ========================================================= */

const ENEMY_TYPE = {
    CHASER: 0,
    DODGER: 1,
    SHOOTER: 2
};

class Enemy {

    constructor(
        image,
        type,
        position
    ) {

        this.image = image;

        this.type = type;

        this.x = position.x;
        this.y = position.y;

        this.velocity = {
            x: randomFloat(-60, 60),
            y: randomFloat(50, 120)
        };

        this.health = 3;

        this.alive = true;

        this.shootTimer = 2;

        this.rotation = 0;
    }

    update(
        dt,
        playerPosition
    ) {

        const direction =
            normalize({
                x:
                    playerPosition.x -
                    this.x,

                y:
                    playerPosition.y -
                    this.y
            });

        if (
            this.type ===
            ENEMY_TYPE.CHASER
        ) {

            this.velocity =
                {
                    x: direction.x * 120,
                    y: direction.y * 120
                };

        } else if (
            this.type ===
            ENEMY_TYPE.DODGER
        ) {

            this.velocity.x =
                Math.sin(
                    this.y * 0.01
                ) * 180;

            this.velocity.y = 100;

        } else {

            this.velocity.y = 65;

            if (
                Math.abs(
                    playerPosition.x -
                    this.x
                ) < 250
            ) {

                this.velocity.x =
                    this.x <
                    playerPosition.x
                        ? 100
                        : -100;
            }
        }

        this.x +=
            this.velocity.x * dt;

        this.y +=
            this.velocity.y * dt;

        this.x =
            clamp(
                this.x,
                60,
                WIDTH - 60
            );

        this.y =
            clamp(
                this.y,
                50,
                HEIGHT - 100
            );

        this.shootTimer -= dt;
    }

    hit() {

        this.health--;

        if (this.health <= 0) {
            this.alive = false;
        }
    }

    draw() {

        drawImageCentered(
            this.image,
            this.x,
            this.y,
            85,
            85,
            this.rotation
        );
    }
}

const enemies = [];

/* =========================================================
   POWER UPS
   ========================================================= */

const POWER_TYPE = {
    HEALTH: 0,
    RAPID_FIRE: 1,
    TRIPLE_LASER: 2,
    SPEED: 3,
    SHIELD: 4,
    BOMB: 5
};

class PowerUp {

    constructor(
        image,
        type,
        position
    ) {

        this.image = image;

        this.type = type;

        this.x = position.x;
        this.y = position.y;

        this.velocity = {
            x: 0,
            y: randomFloat(30, 60)
        };

        this.rotation = 0;

        this.alive = true;
    }

    update(dt) {

        this.y +=
            this.velocity.y * dt;

        this.rotation +=
            80 *
            PI /
            180 *
            dt;

        if (
            this.y >
            HEIGHT + 100
        ) {

            this.alive = false;
        }
    }

    draw() {

        drawImageCentered(
            this.image,
            this.x,
            this.y,
            65,
            65,
            this.rotation
        );
    }
}

const powerups = [];

/* =========================================================
   SPAWN HELPERS
   ========================================================= */

function spawnAsteroid() {

    const side =
        randomInt(0, 3);

    let position;

    if (side === 0) {

        position = {
            x: randomFloat(0, WIDTH),
            y: -100
        };

    } else if (side === 1) {

        position = {
            x: WIDTH + 100,
            y: randomFloat(0, HEIGHT)
        };

    } else if (side === 2) {

        position = {
            x: randomFloat(0, WIDTH),
            y: HEIGHT + 100
        };

    } else {

        position = {
            x: -100,
            y: randomFloat(0, HEIGHT)
        };
    }

    const size =
        randomInt(1, 3);

    let image;

    if (size === 3) {

        image =
            assets.asteroidLarge;

    } else if (size === 2) {

        image =
            assets.asteroidMedium;

    } else {

        image =
            assets.asteroidSmall;
    }

    asteroids.push(
        new Asteroid(
            image,
            position,
            size
        )
    );
}

function spawnEnemy() {

    const choice =
        randomInt(0, 2);

    let type;
    let image;

    if (choice === 0) {

        type =
            ENEMY_TYPE.CHASER;

        image =
            assets.enemyChaser;

    } else if (choice === 1) {

        type =
            ENEMY_TYPE.DODGER;

        image =
            assets.enemyDodger;

    } else {

        type =
            ENEMY_TYPE.SHOOTER;

        image =
            assets.enemyShooter;
    }

    enemies.push(
        new Enemy(
            image,
            type,
            {
                x: randomFloat(
                    100,
                    WIDTH - 100
                ),
                y: -80
            }
        )
    );
}

function spawnPowerUp() {

    const type =
        randomInt(0, 5);

    let image;

    switch (type) {

        case POWER_TYPE.HEALTH:
            image =
                assets.healthPower;
            break;

        case POWER_TYPE.RAPID_FIRE:
            image =
                assets.rapidFirePower;
            break;

        case POWER_TYPE.TRIPLE_LASER:
            image =
                assets.tripleLaserPower;
            break;

        case POWER_TYPE.SPEED:
            image =
                assets.speedBoostPower;
            break;

        case POWER_TYPE.SHIELD:
            image =
                assets.shieldPower;
            break;

        default:
            image =
                assets.bombPower;
            break;
    }

    powerups.push(
        new PowerUp(
            image,
            type,
            {
                x: randomFloat(
                    80,
                    WIDTH - 80
                ),
                y: -80
            }
        )
    );
}

/* =========================================================
   RESET GAME
   ========================================================= */

function resetGame() {

    player.health = 5;

    player.position = {
        x: WIDTH / 2,
        y: HEIGHT / 2
    };

    player.rotation = 0;

    player.shield = false;

    player.shieldTimer = 0;
    player.rapidFireTimer = 0;
    player.tripleLaserTimer = 0;
    player.speedTimer = 0;

    score = 0;
    destroyed = 0;
    coins = 0;

    combo = 0;
    comboTimer = 0;

    level = selectedLevel;

    laserTimer = 0;
    asteroidTimer = 0;

    powerTimer = 5;
    enemySpawnTimer = 1;

    lasers.length = 0;
    enemyLasers.length = 0;
    asteroids.length = 0;
    enemies.length = 0;
    powerups.length = 0;
    particles.length = 0;
    engineParticles.length = 0;
}

/* =========================================================
   SHOOTING
   ========================================================= */

function shoot() {

    const direction = {
        x:
            mouse.x -
            player.position.x,

        y:
            mouse.y -
            player.position.y
    };

    if (length(direction) <= 5) {
        return;
    }

    const laserImage =
        player.getLaserImage();

    if (
        player.tripleLaserTimer > 0
    ) {

        const baseAngle =
            angleBetween(
                player.position,
                mouse
            );

        for (
            let i = -1;
            i <= 1;
            i++
        ) {

            const angle =
                baseAngle +
                i * 0.16;

            lasers.push(
                new Laser(
                    laserImage,
                    player.position,
                    fromAngle(
                        angle,
                        1
                    )
                )
            );
        }

    } else {

        lasers.push(
            new Laser(
                laserImage,
                player.position,
                direction
            )
        );
    }
}

/* =========================================================
   COLLISIONS
   ========================================================= */

function handleCollisions() {

    /* -----------------------------------------
       PLAYER LASER -> ASTEROID
       ----------------------------------------- */

    for (const laser of lasers) {

        if (!laser.alive) {
            continue;
        }

        for (const asteroid of asteroids) {

            if (!asteroid.alive) {
                continue;
            }

            if (
                distance(
                    laser,
                    asteroid
                ) <
                45 *
                asteroid.size
            ) {

                laser.alive = false;

                asteroid.hit();

                if (!asteroid.alive) {

                    const pos = {
                        x: asteroid.x,
                        y: asteroid.y
                    };

                    const points =
                        asteroid.size * 10;

                    score +=
                        points *
                        Math.max(
                            1,
                            combo
                        );

                    coins +=
                        asteroid.size;

                    destroyed++;

                    combo++;

                    comboTimer = 2.5;

                    createExplosion(
                        pos,
                        18
                    );

                    /* SPLIT ASTEROID */

                    if (
                        asteroid.size > 1
                    ) {

                        const newSize =
                            asteroid.size - 1;

                        const image =
                            newSize === 2
                                ? assets.asteroidMedium
                                : assets.asteroidSmall;

                        for (
                            let i = 0;
                            i < 2;
                            i++
                        ) {

                            const child =
                                new Asteroid(
                                    image,
                                    pos,
                                    newSize
                                );

                            child.velocity =
                                fromAngle(
                                    randomFloat(
                                        0,
                                        PI * 2
                                    ),
                                    randomFloat(
                                        90,
                                        180
                                    )
                                );

                            asteroids.push(
                                child
                            );
                        }
                    }

                    break;
                }
            }
        }
    }

    /* -----------------------------------------
       PLAYER LASER -> ENEMY
       ----------------------------------------- */

    for (const laser of lasers) {

        if (!laser.alive) {
            continue;
        }

        for (const enemy of enemies) {

            if (!enemy.alive) {
                continue;
            }

            if (
                distance(
                    laser,
                    enemy
                ) < 65
            ) {

                laser.alive = false;

                enemy.hit();

                if (!enemy.alive) {

                    score +=
                        50 *
                        Math.max(
                            1,
                            combo
                        );

                    coins += 10;

                    combo++;

                    comboTimer = 3;

                    createExplosion(
                        {
                            x: enemy.x,
                            y: enemy.y
                        },
                        30
                    );
                }

                break;
            }
        }
    }

    /* -----------------------------------------
       ENEMY LASER -> PLAYER
       ----------------------------------------- */

    for (const laser of enemyLasers) {

        if (!laser.alive) {
            continue;
        }

        if (
            distance(
                laser,
                player.position
            ) < 55
        ) {

            laser.alive = false;

            player.damage();

            combo = 0;

            createExplosion(
                player.position,
                8
            );
        }
    }

    /* -----------------------------------------
       ENEMY -> PLAYER
       ----------------------------------------- */

    for (const enemy of enemies) {

        if (!enemy.alive) {
            continue;
        }

        if (
            distance(
                enemy,
                player.position
            ) < 75
        ) {

            enemy.alive = false;

            player.damage();

            combo = 0;

            createExplosion(
                player.position,
                15
            );
        }
    }

    /* -----------------------------------------
       ASTEROID -> PLAYER
       ----------------------------------------- */

    for (const asteroid of asteroids) {

        if (!asteroid.alive) {
            continue;
        }

        if (
            distance(
                asteroid,
                player.position
            ) <
            45 *
            asteroid.size
        ) {

            asteroid.alive = false;

            player.damage();

            combo = 0;

            createExplosion(
                player.position,
                12
            );
        }
    }

    /* -----------------------------------------
       POWERUP -> PLAYER
       ----------------------------------------- */

    for (const power of powerups) {

        if (!power.alive) {
            continue;
        }

        if (
            distance(
                power,
                player.position
            ) < 65
        ) {

            power.alive = false;

            applyPowerUp(
                power.type
            );
        }
    }
}

/* =========================================================
   POWERUPS
   ========================================================= */

function applyPowerUp(type) {

    switch (type) {

        case POWER_TYPE.HEALTH:

            player.health++;

            if (
                player.health >
                player.maxHealth
            ) {

                player.health =
                    player.maxHealth;
            }

            break;

        case POWER_TYPE.RAPID_FIRE:

            player.rapidFireTimer =
                8;

            break;

        case POWER_TYPE.TRIPLE_LASER:

            player.tripleLaserTimer =
                8;

            break;

        case POWER_TYPE.SPEED:

            player.speedTimer =
                8;

            break;

        case POWER_TYPE.SHIELD:

            player.shield = true;

            player.shieldTimer =
                8;

            break;

        case POWER_TYPE.BOMB:

            /* DESTROY ASTEROIDS */

            for (
                const asteroid of asteroids
            ) {

                if (!asteroid.alive) {
                    continue;
                }

                asteroid.alive = false;

                score +=
                    asteroid.size * 5;

                coins +=
                    asteroid.size;

                createExplosion(
                    {
                        x: asteroid.x,
                        y: asteroid.y
                    },
                    10
                );
            }

            /* DESTROY ENEMIES */

            for (
                const enemy of enemies
            ) {

                if (!enemy.alive) {
                    continue;
                }

                enemy.alive = false;

                score += 100;

                coins += 10;

                createExplosion(
                    {
                        x: enemy.x,
                        y: enemy.y
                    },
                    20
                );
            }

            break;
    }

    createExplosion(
        player.position,
        12
    );
}

/* =========================================================
   UPDATE GAME
   ========================================================= */

function updateGame(dt) {

    if (state !== STATE.PLAYING) {
        return;
    }

    /* LEVEL */

    level =
        selectedLevel +
        Math.floor(
            destroyed / 15
        );

    if (level > 10) {
        level = 10;
    }

    /* PLAYER */

    player.update(dt);

    /* SHOOTING */

    laserTimer -= dt;

    const fireRate =
        player.rapidFireTimer > 0
            ? 0.12
            : 0.35;

    if (
        mouse.down &&
        laserTimer <= 0
    ) {

        laserTimer =
            fireRate;

        shoot();
    }

    /* LASERS */

    for (const laser of lasers) {
        laser.update(dt);
    }

    /* ASTEROIDS */

    asteroidTimer -= dt;

    const asteroidSpawnRate =
        Math.max(
            0.35,
            1.15 -
            level * 0.06
        );

    if (asteroidTimer <= 0) {

        asteroidTimer =
            asteroidSpawnRate;

        spawnAsteroid();
    }

    for (const asteroid of asteroids) {
        asteroid.update(dt);
    }

    /* ENEMIES */

    enemySpawnTimer -= dt;

    const maxEnemies =
        2 +
        Math.floor(level / 3);

    if (
        enemySpawnTimer <= 0 &&
        enemies.length < maxEnemies
    ) {

        enemySpawnTimer =
            randomFloat(3, 7);

        spawnEnemy();
    }

    for (const enemy of enemies) {

        enemy.update(
            dt,
            player.position
        );

        if (
            enemy.shootTimer <= 0
        ) {

            enemy.shootTimer =
                randomFloat(
                    1.5,
                    3
                );

            const direction = {
                x:
                    player.position.x -
                    enemy.x,

                y:
                    player.position.y -
                    enemy.y
            };

            enemyLasers.push(
                new Laser(
                    assets.laserRed,
                    {
                        x: enemy.x,
                        y: enemy.y
                    },
                    direction,
                    500
                )
            );
        }
    }

    /* ENEMY LASERS */

    for (
        const laser of enemyLasers
    ) {

        laser.update(dt);
    }

    /* POWERUPS */

    powerTimer -= dt;

    if (powerTimer <= 0) {

        powerTimer =
            randomFloat(
                10,
                18
            );

        spawnPowerUp();
    }

    for (
        const power of powerups
    ) {

        power.update(dt);
    }

    /* PARTICLES */

    for (
        const particle of particles
    ) {

        particle.update(dt);
    }

    for (
        const particle of engineParticles
    ) {

        particle.update(dt);
    }

    /* COLLISIONS */

    handleCollisions();

    /* CLEANUP */

    removeDeadObjects();

    /* COMBO */

    if (comboTimer > 0) {

        comboTimer -= dt;

        if (comboTimer <= 0) {
            combo = 0;
        }
    }

    /* DEATH */

    if (!player.alive()) {

        state =
            STATE.GAME_OVER;
    }
}

function removeDeadObjects() {

    for (
        let i = lasers.length - 1;
        i >= 0;
        i--
    ) {

        if (!lasers[i].alive) {
            lasers.splice(i, 1);
        }
    }

    for (
        let i = enemyLasers.length - 1;
        i >= 0;
        i--
    ) {

        if (!enemyLasers[i].alive) {
            enemyLasers.splice(i, 1);
        }
    }

    for (
        let i = asteroids.length - 1;
        i >= 0;
        i--
    ) {

        if (!asteroids[i].alive) {
            asteroids.splice(i, 1);
        }
    }

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        if (!enemies[i].alive) {
            enemies.splice(i, 1);
        }
    }

    for (
        let i = powerups.length - 1;
        i >= 0;
        i--
    ) {

        if (!powerups[i].alive) {
            powerups.splice(i, 1);
        }
    }

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        if (!particles[i].alive()) {
            particles.splice(i, 1);
        }
    }

    for (
        let i = engineParticles.length - 1;
        i >= 0;
        i--
    ) {

        if (!engineParticles[i].alive()) {
            engineParticles.splice(i, 1);
        }
    }
}

/* =========================================================
   HEALTH HUD
   ========================================================= */

function drawHealth() {

    for (let i = 0; i < 5; i++) {

        const image =
            i < player.health
                ? assets.healthFull
                : assets.healthEmpty;

        if (
            image &&
            image.complete &&
            image.naturalWidth
        ) {

            ctx.drawImage(
                image,
                25 + i * 50,
                22,
                35,
                35
            );
        }
    }
}

/* =========================================================
   HUD
   ========================================================= */

function drawHUD() {

    drawHealth();

    /* SCORE PANEL */

    drawPanel(
        WIDTH - 330,
        15,
        300,
        100,
        "rgba(0,0,20,0.75)",
        "#3c96ff",
        2
    );

    drawText(
        "SCORE",
        WIDTH - 310,
        37,
        16,
        "#8cb4dc"
    );

    drawText(
        score.toString(),
        WIDTH - 310,
        64,
        25
    );

    drawText(
        "COINS",
        WIDTH - 170,
        37,
        16,
        "#8cb4dc"
    );

    drawText(
        coins.toString(),
        WIDTH - 170,
        64,
        25,
        "#ffd23c"
    );

    /* LEVEL */

    drawPanel(
        WIDTH / 2 - 85,
        20,
        170,
        65,
        "rgba(0,0,20,0.75)",
        "#8c50ff",
        2
    );

    drawCenteredText(
        `LEVEL ${level}`,
        WIDTH / 2,
        52,
        22,
        "#be96ff"
    );

    /* COMBO */

    if (combo > 1) {

        drawCenteredText(
            `COMBO x${combo}`,
            WIDTH / 2,
            HEIGHT - 45,
            26,
            "#ff823c"
        );
    }

    /* POWERUP STATUS */

    let y = 130;

    if (
        player.rapidFireTimer > 0
    ) {

        drawText(
            `RAPID FIRE  ${Math.ceil(
                player.rapidFireTimer
            )}s`,
            25,
            y,
            17,
            "#64d2ff"
        );

        y += 25;
    }

    if (
        player.tripleLaserTimer > 0
    ) {

        drawText(
            `TRIPLE LASER  ${Math.ceil(
                player.tripleLaserTimer
            )}s`,
            25,
            y,
            17,
            "#c864ff"
        );

        y += 25;
    }

    if (
        player.speedTimer > 0
    ) {

        drawText(
            `SPEED BOOST  ${Math.ceil(
                player.speedTimer
            )}s`,
            25,
            y,
            17,
            "#64ff96"
        );

        y += 25;
    }

    if (player.shield) {

        drawText(
            `SHIELD  ${Math.ceil(
                player.shieldTimer
            )}s`,
            25,
            y,
            17,
            "#50c8ff"
        );
    }
}

/* =========================================================
   GAME DRAW
   ========================================================= */

function drawGame() {

    drawBackground();

    /* ENGINE PARTICLES */

    for (
        const particle of engineParticles
    ) {

        particle.draw();
    }

    /* EXPLOSIONS */

    for (
        const particle of particles
    ) {

        particle.draw();
    }

    /* ASTEROIDS */

    for (
        const asteroid of asteroids
    ) {

        asteroid.draw();
    }

    /* POWERUPS */

    for (
        const power of powerups
    ) {

        power.draw();
    }

    /* ENEMIES */

    for (
        const enemy of enemies
    ) {

        enemy.draw();
    }

    /* PLAYER LASERS */

    for (
        const laser of lasers
    ) {

        laser.draw();
    }

    /* ENEMY LASERS */

    for (
        const laser of enemyLasers
    ) {

        laser.draw();
    }

    /* PLAYER */

    player.draw();

    /* HUD */

    drawHUD();
}

/* =========================================================
   MENU BACKGROUND
   ========================================================= */

function drawMenuBackground() {

    drawBackground();

    ctx.fillStyle =
        "rgba(0,0,20,0.51)";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );
}

/* =========================================================
   MAIN MENU
   ========================================================= */

function drawMainMenu() {

    drawMenuBackground();

    drawCenteredText(
        "STOOT",
        WIDTH / 2,
        115,
        80,
        "#64d2ff"
    );

    drawCenteredText(
        "SPACE COMBAT",
        WIDTH / 2,
        180,
        24,
        "#b4bed2"
    );

    drawButton(
        "PLAY",
        WIDTH / 2 - 150,
        250,
        300,
        65,
        isInside(
            WIDTH / 2 - 150,
            250,
            300,
            65
        )
    );

    drawButton(
        "CHOOSE SHIP",
        WIDTH / 2 - 150,
        335,
        300,
        65,
        isInside(
            WIDTH / 2 - 150,
            335,
            300,
            65
        )
    );

    drawButton(
        "SETTINGS",
        WIDTH / 2 - 150,
        420,
        300,
        65,
        isInside(
            WIDTH / 2 - 150,
            420,
            300,
            65
        )
    );

    drawButton(
        "EXIT",
        WIDTH / 2 - 150,
        505,
        300,
        65,
        isInside(
            WIDTH / 2 - 150,
            505,
            300,
            65
        )
    );

    drawCenteredText(
        "W A S D  -  MOVE",
        WIDTH / 2,
        HEIGHT - 55,
        18,
        "#a0b4d2"
    );
}

/* =========================================================
   SHIP SELECT
   ========================================================= */

function drawShipSelect() {

    drawMenuBackground();

    drawCenteredText(
        "CHOOSE YOUR SHIP",
        WIDTH / 2,
        70,
        46,
        "#64d2ff"
    );

    const images = [
        assets.playerBlue,
        assets.playerRed,
        assets.playerGreen,
        assets.playerPurple
    ];

    const names = [
        "BLUE FALCON",
        "RED COMET",
        "GREEN PHANTOM",
        "PURPLE NOVA"
    ];

    const stats = [
        "BALANCED",
        "HIGH DAMAGE",
        "HIGH SPEED",
        "HIGH FIRE RATE"
    ];

    for (let i = 0; i < 4; i++) {

        const x =
            140 +
            i * 270;

        const hovered =
            isInside(
                x,
                160,
                220,
                360
            );

        drawPanel(
            x,
            160,
            220,
            360,
            i === selectedShip
                ? "rgba(30,70,120,0.94)"
                : "rgba(10,20,40,0.90)",
            i === selectedShip
                ? "#64e6ff"
                : "#3264a0",
            i === selectedShip
                ? 5
                : 2
        );

        drawImageCentered(
            images[i],
            x + 110,
            290,
            105,
            105
        );

        drawCenteredText(
            names[i],
            x + 110,
            390,
            21
        );

        drawCenteredText(
            stats[i],
            x + 110,
            430,
            16,
            "#96bedc"
        );

        drawCenteredText(
            `SHIP ${i + 1}`,
            x + 110,
            475,
            18,
            "#64d2ff"
        );

        if (hovered) {

            ctx.save();

            ctx.strokeStyle =
                "#b4f0ff";

            ctx.lineWidth = 2;

            ctx.strokeRect(
                x + 4,
                164,
                212,
                352
            );

            ctx.restore();
        }
    }

    drawButton(
        "BACK",
        50,
        610,
        180,
        55,
        isInside(
            50,
            610,
            180,
            55
        )
    );

    drawButton(
        "CONTINUE",
        WIDTH - 230,
        610,
        180,
        55,
        isInside(
            WIDTH - 230,
            610,
            180,
            55
        )
    );

    drawCenteredText(
        "CLICK A SHIP TO SELECT IT",
        WIDTH / 2,
        650,
        18,
        "#b4bed2"
    );
}

/* =========================================================
   LEVEL SELECT
   ========================================================= */

function drawLevelSelect() {

    drawMenuBackground();

    drawCenteredText(
        "SELECT LEVEL",
        WIDTH / 2,
        70,
        50,
        "#64d2ff"
    );

    for (let i = 1; i <= 10; i++) {

        const column =
            (i - 1) % 5;

        const row =
            Math.floor(
                (i - 1) / 5
            );

        const x =
            190 +
            column * 190;

        const y =
            180 +
            row * 160;

        const selected =
            i === selectedLevel;

        drawPanel(
            x,
            y,
            140,
            110,
            selected
                ? "rgba(40,80,130,0.96)"
                : "rgba(10,20,40,0.92)",
            selected
                ? "#64e6ff"
                : "#3264a0",
            selected
                ? 4
                : 2
        );

        drawCenteredText(
            i.toString(),
            x + 70,
            y + 43,
            38
        );

        drawCenteredText(
            "LEVEL",
            x + 70,
            y + 82,
            14,
            "#8caac8"
        );
    }

    drawButton(
        "BACK",
        50,
        610,
        180,
        55,
        isInside(
            50,
            610,
            180,
            55
        )
    );

    drawButton(
        "START GAME",
        WIDTH - 260,
        610,
        210,
        55,
        isInside(
            WIDTH - 260,
            610,
            210,
            55
        )
    );

    drawCenteredText(
        "SELECT A LEVEL WITH THE MOUSE",
        WIDTH / 2,
        600,
        18,
        "#aabed2"
    );
}

/* =========================================================
   SETTINGS
   ========================================================= */

function drawSettings() {

    drawMenuBackground();

    drawCenteredText(
        "SETTINGS",
        WIDTH / 2,
        90,
        52,
        "#64d2ff"
    );

    drawPanel(
        340,
        160,
        600,
        380,
        "rgba(10,20,40,0.94)",
        "#3c96dc",
        3
    );

    drawText(
        "CONTROLS",
        380,
        220,
        28,
        "#64d2ff"
    );

    drawText(
        "W A S D",
        390,
        280,
        22
    );

    drawText(
        "Move ship",
        570,
        280,
        20,
        "#aab4c8"
    );

    drawText(
        "MOUSE",
        390,
        330,
        22
    );

    drawText(
        "Aim and fire",
        570,
        330,
        20,
        "#aab4c8"
    );

    drawText(
        "P",
        390,
        380,
        22
    );

    drawText(
        "Pause",
        570,
        380,
        20,
        "#aab4c8"
    );

    drawText(
        "ESC",
        390,
        430,
        22
    );

    drawText(
        "Exit",
        570,
        430,
        20,
        "#aab4c8"
    );

    drawText(
        "GAME VERSION",
        390,
        485,
        20,
        "#64d2ff"
    );

    drawText(
        "STOOT 4.0",
        570,
        485,
        20
    );

    drawButton(
        "BACK",
        WIDTH / 2 - 100,
        570,
        200,
        55,
        isInside(
            WIDTH / 2 - 100,
            570,
            200,
            55
        )
    );
}

/* =========================================================
   PAUSE
   ========================================================= */

function drawPause() {

    ctx.fillStyle =
        "rgba(0,0,0,0.71)";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    drawPanel(
        WIDTH / 2 - 250,
        HEIGHT / 2 - 150,
        500,
        300,
        "rgba(10,20,40,0.98)",
        "#50aaff",
        4
    );

    drawCenteredText(
        "PAUSED",
        WIDTH / 2,
        245,
        50,
        "#64d2ff"
    );

    drawCenteredText(
        "CLICK RESUME OR PRESS P",
        WIDTH / 2,
        275,
        17,
        "#a0b4c8"
    );

    drawButton(
        "RESUME",
        WIDTH / 2 - 150,
        300,
        300,
        60,
        isInside(
            WIDTH / 2 - 150,
            300,
            300,
            60
        )
    );

    drawButton(
        "MAIN MENU",
        WIDTH / 2 - 150,
        390,
        300,
        60,
        isInside(
            WIDTH / 2 - 150,
            390,
            300,
            60
        )
    );
}

/* =========================================================
   GAME OVER
   ========================================================= */

function drawGameOver() {

    ctx.fillStyle =
        "rgba(0,0,0,0.76)";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    drawPanel(
        WIDTH / 2 - 350,
        HEIGHT / 2 - 190,
        700,
        380,
        "rgba(10,15,30,0.98)",
        "#64aaff",
        4
    );

    drawCenteredText(
        "GAME OVER",
        WIDTH / 2,
        210,
        58,
        "#ff5a5a"
    );

    drawCenteredText(
        "FINAL SCORE",
        WIDTH / 2,
        285,
        20,
        "#a0b4d2"
    );

    drawCenteredText(
        score.toString(),
        WIDTH / 2,
        325,
        38,
        "#ffdc64"
    );

    drawButton(
        "RESTART",
        WIDTH / 2 - 220,
        430,
        200,
        60,
        isInside(
            WIDTH / 2 - 220,
            430,
            200,
            60
        )
    );

    drawButton(
        "MAIN MENU",
        WIDTH / 2 + 20,
        430,
        200,
        60,
        isInside(
            WIDTH / 2 + 20,
            430,
            200,
            60
        )
    );
}

/* =========================================================
   DRAW EVERYTHING
   ========================================================= */

function draw() {

    ctx.clearRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    if (
        state === STATE.MAIN_MENU
    ) {

        drawMainMenu();

    } else if (
        state === STATE.SHIP_SELECT
    ) {

        drawShipSelect();

    } else if (
        state === STATE.LEVEL_SELECT
    ) {

        drawLevelSelect();

    } else if (
        state === STATE.SETTINGS
    ) {

        drawSettings();

    } else {

        drawGame();

        if (
            state === STATE.PAUSED
        ) {

            drawPause();
        }

        if (
            state === STATE.GAME_OVER
        ) {

            drawGameOver();
        }
    }
}

/* =========================================================
   INPUT
   ========================================================= */

function getCanvasMousePosition(event) {

    const rect =
        canvas.getBoundingClientRect();

    return {
        x:
            (event.clientX -
                rect.left) *
            WIDTH /
            rect.width,

        y:
            (event.clientY -
                rect.top) *
            HEIGHT /
            rect.height
    };
}

canvas.addEventListener(
    "mousemove",
    event => {

        mouse =
            {
                ...mouse,
                ...getCanvasMousePosition(event)
            };
    }
);

canvas.addEventListener(
    "mousedown",
    event => {

        if (
            event.button !== 0
        ) {
            return;
        }

        mouse =
            {
                ...mouse,
                ...getCanvasMousePosition(event),
                down: true
            };

        handleMouseClick();
    }
);

window.addEventListener(
    "mouseup",
    event => {

        if (
            event.button === 0
        ) {

            mouse.down = false;
        }
    }
);

window.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.toLowerCase();

        keys[key] = true;

        if (
            key === "p" ||
            key === "escape"
        ) {

            event.preventDefault();
        }

        if (
            key === "p"
        ) {

            if (
                state === STATE.PLAYING
            ) {

                state =
                    STATE.PAUSED;

            } else if (
                state === STATE.PAUSED
            ) {

                state =
                    STATE.PLAYING;
            }
        }

        if (
            key === "escape"
        ) {

            if (
                state === STATE.PLAYING
            ) {

                state =
                    STATE.PAUSED;

            } else if (
                state === STATE.PAUSED
            ) {

                state =
                    STATE.PLAYING;

            } else {

                state =
                    STATE.MAIN_MENU;
            }
        }
    }
);

window.addEventListener(
    "keyup",
    event => {

        keys[
            event.key.toLowerCase()
        ] = false;
    }
);

/* =========================================================
   CLICK HANDLING
   ========================================================= */

function handleMouseClick() {

    /* MAIN MENU */

    if (
        state === STATE.MAIN_MENU
    ) {

        if (
            isInside(
                WIDTH / 2 - 150,
                250,
                300,
                65
            )
        ) {

            state =
                STATE.LEVEL_SELECT;

            return;
        }

        if (
            isInside(
                WIDTH / 2 - 150,
                335,
                300,
                65
            )
        ) {

            state =
                STATE.SHIP_SELECT;

            return;
        }

        if (
            isInside(
                WIDTH / 2 - 150,
                420,
                300,
                65
            )
        ) {

            state =
                STATE.SETTINGS;

            return;
        }

        if (
            isInside(
                WIDTH / 2 - 150,
                505,
                300,
                65
            )
        ) {

            /*
             * Browsers cannot close a normal tab
             * with JavaScript.
             *
             * Instead, return to the game page.
             */

            state =
                STATE.MAIN_MENU;

            return;
        }
    }

    /* SHIP SELECT */

    else if (
        state === STATE.SHIP_SELECT
    ) {

        for (let i = 0; i < 4; i++) {

            const x =
                140 +
                i * 270;

            if (
                isInside(
                    x,
                    160,
                    220,
                    360
                )
            ) {

                selectedShip = i;

                player.shipColor =
                    i;

                return;
            }
        }

        if (
            isInside(
                50,
                610,
                180,
                55
            )
        ) {

            state =
                STATE.MAIN_MENU;

            return;
        }

        if (
            isInside(
                WIDTH - 230,
                610,
                180,
                55
            )
        ) {

            state =
                STATE.LEVEL_SELECT;

            return;
        }
    }

    /* LEVEL SELECT */

    else if (
        state === STATE.LEVEL_SELECT
    ) {

        for (
            let i = 1;
            i <= 10;
            i++
        ) {

            const column =
                (i - 1) % 5;

            const row =
                Math.floor(
                    (i - 1) / 5
                );

            const x =
                190 +
                column * 190;

            const y =
                180 +
                row * 160;

            if (
                isInside(
                    x,
                    y,
                    140,
                    110
                )
            ) {

                selectedLevel = i;

                return;
            }
        }

        if (
            isInside(
                50,
                610,
                180,
                55
            )
        ) {

            state =
                STATE.MAIN_MENU;

            return;
        }

        if (
            isInside(
                WIDTH - 260,
                610,
                210,
                55
            )
        ) {

            resetGame();

            state =
                STATE.PLAYING;

            return;
        }
    }

    /* SETTINGS */

    else if (
        state === STATE.SETTINGS
    ) {

        if (
            isInside(
                WIDTH / 2 - 100,
                570,
                200,
                55
            )
        ) {

            state =
                STATE.MAIN_MENU;
        }
    }

    /* PAUSED */

    else if (
        state === STATE.PAUSED
    ) {

        if (
            isInside(
                WIDTH / 2 - 150,
                300,
                300,
                60
            )
        ) {

            state =
                STATE.PLAYING;

            return;
        }

        if (
            isInside(
                WIDTH / 2 - 150,
                390,
                300,
                60
            )
        ) {

            state =
                STATE.MAIN_MENU;

            return;
        }
    }

    /* GAME OVER */

    else if (
        state === STATE.GAME_OVER
    ) {

        if (
            isInside(
                WIDTH / 2 - 220,
                430,
                200,
                60
            )
        ) {

            resetGame();

            state =
                STATE.PLAYING;

            return;
        }

        if (
            isInside(
                WIDTH / 2 + 20,
                430,
                200,
                60
            )
        ) {

            state =
                STATE.MAIN_MENU;

            return;
        }
    }
}

/* =========================================================
   GAME LOOP
   ========================================================= */

function gameLoop(timestamp) {

    if (!lastTime) {
        lastTime = timestamp;
    }

    let dt =
        (timestamp - lastTime) /
        1000;

    lastTime = timestamp;

    if (dt > 0.05) {
        dt = 0.05;
    }

    gameTime += dt;

    updateGame(dt);

    draw();

    requestAnimationFrame(
        gameLoop
    );
}

/* =========================================================
   START
   ========================================================= */

async function startGame() {

    await loadAssets();

    const loading =
        document.getElementById(
            "loading"
        );

    loading.style.display =
        "none";

    requestAnimationFrame(
        gameLoop
    );
}

startGame();