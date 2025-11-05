// Game Configuration
const CONFIG = {
    width: 1200,
    height: 800,
    gravity: 0.15,
    maxVelocity: 4,
    thrustPower: 0.3,
    friction: 0.98,
    groundFriction: 0.85,
    tankSize: 16,
    bulletSpeed: 6,
    bulletSize: 4,
    digRadius: 20,
    maxFuel: 100,
    fuelConsumptionRate: 0.15,
    fuelRegenRate: 0.02,
    maxHealth: 100,
    maxAmmo: 10,
    shootCooldown: 500, // ms
};

// Game State
const game = {
    canvas: null,
    ctx: null,
    terrain: [],
    players: [],
    bullets: [],
    particles: [],
    keys: {},
    running: false,
    gameOver: false,
    lastTime: 0,
};

// Particle class for visual effects
class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += CONFIG.gravity * 0.5;
        this.life--;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(Math.floor(this.x), Math.floor(this.y), 2, 2);
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }
}

// Bullet class
class Bullet {
    constructor(x, y, vx, vy, owner) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.owner = owner;
        this.size = CONFIG.bulletSize;
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += CONFIG.gravity * 0.05;

        // Check bounds
        if (this.x < 0 || this.x >= CONFIG.width || this.y < 0 || this.y >= CONFIG.height) {
            this.active = false;
            return;
        }

        // Check terrain collision
        if (isSolid(Math.floor(this.x), Math.floor(this.y))) {
            this.explode();
            this.active = false;
        }
    }

    explode() {
        // Create explosion - dig terrain
        digTerrain(this.x, this.y, 15);

        // Create particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            game.particles.push(new Particle(
                this.x, this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ff' + Math.floor(Math.random() * 100 + 155).toString(16) + '00',
                30
            ));
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.owner.color;
        ctx.fillRect(
            Math.floor(this.x - this.size / 2),
            Math.floor(this.y - this.size / 2),
            this.size,
            this.size
        );
    }
}

// Tank class
class Tank {
    constructor(x, y, color, controls) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.color = color;
        this.controls = controls;
        this.size = CONFIG.tankSize;
        this.health = CONFIG.maxHealth;
        this.fuel = CONFIG.maxFuel;
        this.ammo = CONFIG.maxAmmo;
        this.lastShot = 0;
        this.alive = true;
    }

    update(deltaTime) {
        if (!this.alive) return;

        const wasGrounded = this.isGrounded();

        // Apply gravity
        this.vy += CONFIG.gravity;

        // Handle input
        if (game.keys[this.controls.up] && this.fuel > 0) {
            this.vy -= CONFIG.thrustPower;
            this.fuel -= CONFIG.fuelConsumptionRate;
            this.spawnThrustParticle();
        }
        if (game.keys[this.controls.down] && this.fuel > 0) {
            this.vy += CONFIG.thrustPower;
            this.fuel -= CONFIG.fuelConsumptionRate;
            this.spawnThrustParticle();
        }
        if (game.keys[this.controls.left] && this.fuel > 0) {
            this.vx -= CONFIG.thrustPower;
            this.fuel -= CONFIG.fuelConsumptionRate;
            this.spawnThrustParticle();
        }
        if (game.keys[this.controls.right] && this.fuel > 0) {
            this.vx += CONFIG.thrustPower;
            this.fuel -= CONFIG.fuelConsumptionRate;
            this.spawnThrustParticle();
        }

        // Shooting
        if (game.keys[this.controls.fire]) {
            this.shoot();
        }

        // Apply friction
        if (wasGrounded) {
            this.vx *= CONFIG.groundFriction;
        } else {
            this.vx *= CONFIG.friction;
            this.vy *= CONFIG.friction;
        }

        // Limit velocity
        this.vx = Math.max(-CONFIG.maxVelocity, Math.min(CONFIG.maxVelocity, this.vx));
        this.vy = Math.max(-CONFIG.maxVelocity, Math.min(CONFIG.maxVelocity, this.vy));

        // Move and handle collisions
        this.move();

        // Regenerate fuel slowly when not moving much
        if (Math.abs(this.vx) < 0.5 && Math.abs(this.vy) < 0.5) {
            this.fuel = Math.min(CONFIG.maxFuel, this.fuel + CONFIG.fuelRegenRate);
        }

        this.fuel = Math.max(0, this.fuel);

        // Dig terrain where tank is
        this.digCurrentPosition();
    }

    spawnThrustParticle() {
        if (Math.random() > 0.5) {
            game.particles.push(new Particle(
                this.x + (Math.random() - 0.5) * this.size,
                this.y + (Math.random() - 0.5) * this.size,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                this.color,
                15
            ));
        }
    }

    isGrounded() {
        // Check if tank is touching ground
        const checkPoints = [
            { x: this.x - this.size / 2, y: this.y + this.size / 2 + 1 },
            { x: this.x, y: this.y + this.size / 2 + 1 },
            { x: this.x + this.size / 2, y: this.y + this.size / 2 + 1 },
        ];

        return checkPoints.some(p => isSolid(Math.floor(p.x), Math.floor(p.y)));
    }

    move() {
        // Move horizontally
        const nextX = this.x + this.vx;
        if (!this.checkCollision(nextX, this.y)) {
            this.x = nextX;
        } else {
            this.vx = 0;
        }

        // Move vertically
        const nextY = this.y + this.vy;
        if (!this.checkCollision(this.x, nextY)) {
            this.y = nextY;
        } else {
            this.vy = 0;
        }

        // Keep in bounds
        this.x = Math.max(this.size / 2, Math.min(CONFIG.width - this.size / 2, this.x));
        this.y = Math.max(this.size / 2, Math.min(CONFIG.height - this.size / 2, this.y));
    }

    checkCollision(x, y) {
        // Check corners and center of tank
        const points = [
            { x: x - this.size / 2, y: y - this.size / 2 },
            { x: x + this.size / 2, y: y - this.size / 2 },
            { x: x - this.size / 2, y: y + this.size / 2 },
            { x: x + this.size / 2, y: y + this.size / 2 },
            { x: x, y: y },
        ];

        return points.some(p => isSolid(Math.floor(p.x), Math.floor(p.y)));
    }

    digCurrentPosition() {
        // Dig out space for tank
        digTerrain(this.x, this.y, this.size / 2 + 2);
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot < CONFIG.shootCooldown) return;
        if (this.ammo <= 0) return;

        this.lastShot = now;
        this.ammo--;

        // Calculate shooting direction (towards the other player)
        const otherPlayer = game.players.find(p => p !== this);
        const dx = otherPlayer.x - this.x;
        const dy = otherPlayer.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const bulletVx = (dx / dist) * CONFIG.bulletSpeed;
        const bulletVy = (dy / dist) * CONFIG.bulletSpeed;

        game.bullets.push(new Bullet(this.x, this.y, bulletVx, bulletVy, this));

        // Recoil
        this.vx -= bulletVx * 0.3;
        this.vy -= bulletVy * 0.3;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
            this.explode();
        }
    }

    explode() {
        // Create death explosion
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            game.particles.push(new Particle(
                this.x, this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                this.color,
                60
            ));
        }
    }

    draw(ctx, viewY) {
        if (!this.alive) return;

        const drawY = this.y - viewY;

        // Draw tank body
        ctx.fillStyle = this.color;
        ctx.fillRect(
            Math.floor(this.x - this.size / 2),
            Math.floor(drawY - this.size / 2),
            this.size,
            this.size
        );

        // Draw tank treads
        ctx.fillStyle = '#000';
        ctx.fillRect(
            Math.floor(this.x - this.size / 2),
            Math.floor(drawY + this.size / 2 - 3),
            this.size,
            3
        );

        // Draw turret
        ctx.fillStyle = this.color;
        ctx.fillRect(
            Math.floor(this.x - this.size / 4),
            Math.floor(drawY - this.size / 2 - 4),
            this.size / 2,
            4
        );
    }
}

// Terrain functions
function initTerrain() {
    game.terrain = [];
    for (let y = 0; y < CONFIG.height; y++) {
        game.terrain[y] = [];
        for (let x = 0; x < CONFIG.width; x++) {
            // Create varied terrain with some open spaces
            let solid = false;

            // Top 20% is always empty (sky)
            if (y < CONFIG.height * 0.2) {
                solid = false;
            }
            // Create layered terrain with some randomness
            else if (y > CONFIG.height * 0.3) {
                const noise = Math.sin(x * 0.02) * 30 + Math.cos(x * 0.05) * 20;
                const threshold = CONFIG.height * 0.4 + noise;
                solid = y > threshold;

                // Add some random caves
                if (solid && Math.random() > 0.98) {
                    const caveX = x;
                    const caveY = y;
                    const caveRadius = Math.random() * 40 + 20;

                    for (let cy = -caveRadius; cy < caveRadius; cy++) {
                        for (let cx = -caveRadius; cx < caveRadius; cx++) {
                            if (cx * cx + cy * cy < caveRadius * caveRadius) {
                                const tx = caveX + cx;
                                const ty = caveY + cy;
                                if (tx >= 0 && tx < CONFIG.width && ty >= 0 && ty < CONFIG.height) {
                                    game.terrain[ty][tx] = false;
                                }
                            }
                        }
                    }
                }
            }

            game.terrain[y][x] = solid;
        }
    }
}

function isSolid(x, y) {
    if (x < 0 || x >= CONFIG.width || y < 0 || y >= CONFIG.height) {
        return true;
    }
    return game.terrain[Math.floor(y)][Math.floor(x)];
}

function digTerrain(x, y, radius) {
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= radius * radius) {
                const tx = Math.floor(x + dx);
                const ty = Math.floor(y + dy);
                if (tx >= 0 && tx < CONFIG.width && ty >= 0 && ty < CONFIG.height) {
                    if (game.terrain[ty][tx]) {
                        // Create some dirt particles when digging
                        if (Math.random() > 0.95) {
                            game.particles.push(new Particle(
                                tx, ty,
                                (Math.random() - 0.5) * 2,
                                (Math.random() - 0.5) * 2,
                                '#8B4513',
                                20
                            ));
                        }
                    }
                    game.terrain[ty][tx] = false;
                }
            }
        }
    }
}

// Initialize game
function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    game.canvas.width = CONFIG.width;
    game.canvas.height = CONFIG.height;

    // Setup keyboard input
    document.addEventListener('keydown', (e) => {
        game.keys[e.key.toLowerCase()] = true;
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
        }

        // Restart game
        if (e.key.toLowerCase() === 'r' && game.gameOver) {
            startGame();
        }
    });

    document.addEventListener('keyup', (e) => {
        game.keys[e.key.toLowerCase()] = false;
    });

    // Start button
    document.getElementById('start-button').addEventListener('click', () => {
        document.getElementById('start-screen').style.display = 'none';
        startGame();
    });
}

function startGame() {
    game.gameOver = false;
    game.bullets = [];
    game.particles = [];

    // Hide game over screen
    document.getElementById('game-over').style.display = 'none';

    // Initialize terrain
    initTerrain();

    // Create players
    game.players = [
        new Tank(CONFIG.width * 0.25, CONFIG.height * 0.15, '#00ff00', {
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd',
            fire: ' ',
        }),
        new Tank(CONFIG.width * 0.75, CONFIG.height * 0.15, '#ff00ff', {
            up: 'i',
            down: 'k',
            left: 'j',
            right: 'l',
            fire: 'enter',
        }),
    ];

    // Dig initial spawn areas
    game.players.forEach(player => {
        digTerrain(player.x, player.y, 40);
    });

    if (!game.running) {
        game.running = true;
        game.lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

// Update game state
function update(deltaTime) {
    if (game.gameOver) return;

    // Update players
    game.players.forEach(player => player.update(deltaTime));

    // Update bullets
    game.bullets = game.bullets.filter(bullet => {
        bullet.update();

        // Check bullet-tank collisions
        if (bullet.active) {
            game.players.forEach(player => {
                if (player !== bullet.owner && player.alive) {
                    const dx = player.x - bullet.x;
                    const dy = player.y - bullet.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < player.size / 2) {
                        player.takeDamage(25);
                        bullet.explode();
                        bullet.active = false;
                    }
                }
            });
        }

        return bullet.active;
    });

    // Update particles
    game.particles = game.particles.filter(particle => {
        particle.update();
        return !particle.isDead();
    });

    // Check for game over
    const alivePlayers = game.players.filter(p => p.alive);
    if (alivePlayers.length === 1) {
        endGame(alivePlayers[0]);
    } else if (alivePlayers.length === 0) {
        endGame(null); // Draw
    }

    // Update HUD
    updateHUD();
}

function updateHUD() {
    // Player 1
    document.getElementById('p1-health').style.width = game.players[0].health + '%';
    document.getElementById('p1-fuel').style.width = game.players[0].fuel + '%';
    document.getElementById('p1-ammo').textContent = game.players[0].ammo;

    // Player 2
    document.getElementById('p2-health').style.width = game.players[1].health + '%';
    document.getElementById('p2-fuel').style.width = game.players[1].fuel + '%';
    document.getElementById('p2-ammo').textContent = game.players[1].ammo;
}

function endGame(winner) {
    game.gameOver = true;
    const gameOverDiv = document.getElementById('game-over');
    const winnerText = document.getElementById('winner-text');

    if (winner) {
        const playerNum = game.players.indexOf(winner) + 1;
        winnerText.textContent = `PLAYER ${playerNum} WINS!`;
        winnerText.style.color = winner.color;
    } else {
        winnerText.textContent = 'DRAW!';
        winnerText.style.color = '#ffff00';
    }

    gameOverDiv.style.display = 'block';
}

// Render game
function render() {
    const ctx = game.ctx;

    // Split screen rendering
    const splitY = CONFIG.height / 2;

    // Player 1 view (top half)
    ctx.save();
    ctx.rect(0, 0, CONFIG.width, splitY);
    ctx.clip();

    const p1ViewY = Math.max(0, Math.min(CONFIG.height - splitY, game.players[0].y - splitY / 2));
    renderView(ctx, p1ViewY, 0);

    ctx.restore();

    // Player 2 view (bottom half)
    ctx.save();
    ctx.rect(0, splitY, CONFIG.width, splitY);
    ctx.clip();

    const p2ViewY = Math.max(0, Math.min(CONFIG.height - splitY, game.players[1].y - splitY / 2));
    renderView(ctx, p2ViewY, splitY);

    ctx.restore();

    // Draw split line
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, splitY);
    ctx.lineTo(CONFIG.width, splitY);
    ctx.stroke();
}

function renderView(ctx, viewY, screenY) {
    // Clear background
    ctx.fillStyle = '#000033';
    ctx.fillRect(0, screenY, CONFIG.width, CONFIG.height / 2);

    // Draw terrain
    ctx.fillStyle = '#8B4513';
    for (let y = 0; y < CONFIG.height / 2; y++) {
        const worldY = Math.floor(y + viewY);
        if (worldY >= 0 && worldY < CONFIG.height) {
            for (let x = 0; x < CONFIG.width; x++) {
                if (game.terrain[worldY][x]) {
                    ctx.fillRect(x, y + screenY, 1, 1);
                }
            }
        }
    }

    // Draw particles
    game.particles.forEach(particle => {
        const drawY = particle.y - viewY + screenY;
        if (drawY >= screenY && drawY < screenY + CONFIG.height / 2) {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life / particle.maxLife;
            ctx.fillRect(Math.floor(particle.x), Math.floor(drawY), 2, 2);
            ctx.globalAlpha = 1;
        }
    });

    // Draw bullets
    game.bullets.forEach(bullet => {
        const drawY = bullet.y - viewY + screenY;
        if (drawY >= screenY && drawY < screenY + CONFIG.height / 2) {
            ctx.fillStyle = bullet.owner.color;
            ctx.fillRect(
                Math.floor(bullet.x - bullet.size / 2),
                Math.floor(drawY - bullet.size / 2),
                bullet.size,
                bullet.size
            );
        }
    });

    // Draw tanks
    game.players.forEach(player => {
        player.draw(ctx, viewY - screenY);
    });
}

// Game loop
function gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - game.lastTime) / 16.67, 2);
    game.lastTime = currentTime;

    update(deltaTime);
    render();

    if (game.running) {
        requestAnimationFrame(gameLoop);
    }
}

// Start the game
init();
