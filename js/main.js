class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.height = 0;
        this.coins = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gameOver = false;
        this.keys = {};
        this.animationFrame = 0;
        
        // Cámara
        this.camera = { y: 0 };
        
        // Inicializar jugador
        this.player = new Player(200, 500, this);
        
        // Plataformas y monedas
        this.platforms = [];
        this.coins_array = [];
        this.generateInitialPlatforms();
        
        // Referencia a elementos de la UI
        this.scoreElement = document.getElementById('score');
        this.heightElement = document.getElementById('height');
        this.coinsElement = document.getElementById('coins');
        this.levelElement = document.getElementById('level');
        this.collisionLog = document.getElementById('collision-log');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Iniciar el juego
        this.start();
    }
    
    setupEventListeners() {
        // Eventos de teclado
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Botones de reinicio
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restart();
        });
        
        document.getElementById('restartButtonGameOver').addEventListener('click', () => {
            this.restart();
        });
    }
    
    generateInitialPlatforms() {
        // Plataforma de inicio
        this.platforms.push(new Platform(150, 550, 100, 10, 'normal'));
        
        // Generar plataformas hacia arriba
        for (let i = 1; i < 50; i++) {
            const x = Math.random() * (this.canvas.width - 80);
            const y = 550 - (i * 120);
            this.platforms.push(new Platform(x, y, 80, 10, 'normal'));
            
            // Añadir monedas aleatoriamente (70% de probabilidad)
            if (Math.random() < 0.7) {
                const coinX = x + Math.random() * 60;
                const coinY = y - 30;
                this.coins_array.push(new Coin(coinX, coinY));
            }
        }
    }
    
    generateMorePlatforms() {
        const topPlatform = Math.min(...this.platforms.map(p => p.y));
        
        if (topPlatform > this.camera.y - 1000) {
            for (let i = 0; i < 10; i++) {
                const x = Math.random() * (this.canvas.width - 80);
                const y = topPlatform - 120 - (i * 120);
                this.platforms.push(new Platform(x, y, 80, 10, 'normal'));
                
                // Añadir monedas aleatoriamente (70% de probabilidad)
                if (Math.random() < 0.7) {
                    const coinX = x + Math.random() * 60;
                    const coinY = y - 30;
                    this.coins_array.push(new Coin(coinX, coinY));
                }
            }
        }
    }
    
    start() {
        this.gameRunning = true;
        this.gameLoop();
    }
    
    restart() {
        this.score = 0;
        this.height = 0;
        this.coins = 0;
        this.level = 1;
        this.gameRunning = true;
        this.gameOver = false;
        this.camera.y = 0;
        this.animationFrame = 0;
        
        this.player = new Player(200, 500, this);
        this.platforms = [];
        this.coins_array = [];
        this.generateInitialPlatforms();
        
        this.gameOverScreen.style.display = 'none';
        
        this.updateUI();
        this.resetCollisionLog();
        
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gameOver) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        this.animationFrame++;
        
        // Actualizar jugador
        this.player.update();
        
        // Actualizar monedas
        this.coins_array.forEach(coin => coin.update());
        
        // Actualizar cámara para seguir al jugador
        if (this.player.y < this.camera.y + 200) {
            this.camera.y = this.player.y - 200;
        }
        
        // Actualizar altura y nivel
        const currentHeight = Math.max(0, Math.floor((550 - this.player.y) / 10));
        if (currentHeight > this.height) {
            this.height = currentHeight;
            
            // Subir nivel cada 100m
            const newLevel = Math.floor(this.height / 100) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.addCollisionLog(`¡NIVEL ${this.level}! Mayor velocidad`);
                // Aumentar velocidad del jugador
                this.player.moveSpeed = 5 + (this.level - 1) * 1;
                this.player.jumpPower = -15 - (this.level - 1) * 0.5;
            }
        }
        
        // Verificar colisiones con monedas
        this.checkCoinCollisions();
        
        // Generar más plataformas si es necesario
        this.generateMorePlatforms();
        
        // Verificar si el jugador cayó fuera de la pantalla
        if (this.player.y > this.camera.y + this.canvas.height + 100) {
            this.endGame();
        }
        
        // Actualizar UI
        this.updateUI();
    }
    
    render() {
        // Limpiar canvas
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Guardar estado del contexto
        this.ctx.save();
        
        // Aplicar transformación de cámara
        this.ctx.translate(0, -this.camera.y);
        
        // Renderizar plataformas
        this.platforms.forEach(platform => {
            if (platform.y > this.camera.y - 50 && platform.y < this.camera.y + this.canvas.height + 50) {
                platform.render(this.ctx);
            }
        });
        
        // Renderizar monedas
        this.coins_array.forEach(coin => {
            if (coin.y > this.camera.y - 50 && coin.y < this.camera.y + this.canvas.height + 50) {
                coin.render(this.ctx, this.animationFrame);
            }
        });
        
        // Renderizar jugador
        this.player.render(this.ctx, this.animationFrame);
        
        // Restaurar estado del contexto
        this.ctx.restore();
        
        // Renderizar elementos de UI fijos (si los hay)
        this.renderUI();
    }
    
    renderUI() {
        // Aquí se pueden renderizar elementos de UI directamente en el canvas si es necesario
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.heightElement.textContent = this.height + 'm';
        this.coinsElement.textContent = this.coins;
        this.levelElement.textContent = this.level;
    }
    
    checkCoinCollisions() {
        for (let i = this.coins_array.length - 1; i >= 0; i--) {
            const coin = this.coins_array[i];
            if (this.player.x + this.player.width > coin.x &&
                this.player.x < coin.x + coin.width &&
                this.player.y + this.player.height > coin.y &&
                this.player.y < coin.y + coin.height) {
                
                // Moneda recolectada
                this.coins += 1;
                this.score += 5;
                this.addCollisionLog(`¡Moneda! +5 puntos`);
                this.coins_array.splice(i, 1);
            }
        }
    }
    
    addCollisionLog(message) {
        this.collisionLog.textContent = message;
        
        // Volver a "En espera..." después de 2 segundos
        setTimeout(() => {
            if (this.collisionLog.textContent === message) {
                this.collisionLog.textContent = "En espera...";
            }
        }, 2000);
    }
    
    resetCollisionLog() {
        this.collisionLog.textContent = "En espera...";
    }
    
    endGame() {
        this.gameOver = true;
        this.gameRunning = false;
        
        document.getElementById('finalHeight').textContent = this.height + 'm';
        document.getElementById('finalScore').textContent = this.score;
        
        this.gameOverScreen.style.display = 'flex';
    }
}

class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.velX = 0;
        this.velY = 0;
        this.game = game;
        this.onGround = false;
        this.jumpPower = -15;
        this.gravity = 0.5;
        this.maxFallSpeed = 15;
        this.moveSpeed = 5;
        this.lastPlatformY = y; // Para tracking de nuevas plataformas
        this.bounceAnimation = 0;
    }
    
    update() {
        // Movimiento horizontal
        if (this.game.keys['ArrowLeft'] || this.game.keys['a'] || this.game.keys['A']) {
            this.velX = -this.moveSpeed;
        } else if (this.game.keys['ArrowRight'] || this.game.keys['d'] || this.game.keys['D']) {
            this.velX = this.moveSpeed;
        } else {
            this.velX *= 0.8; // Fricción
        }
        
        // Aplicar gravedad
        this.velY += this.gravity;
        
        // Limitar velocidad de caída
        if (this.velY > this.maxFallSpeed) {
            this.velY = this.maxFallSpeed;
        }
        
        // Actualizar posición
        this.x += this.velX;
        this.y += this.velY;
        
        // Actualizar animación de rebote
        if (this.bounceAnimation > 0) {
            this.bounceAnimation--;
        }
        
        // Wrap around horizontal
        if (this.x < 0) {
            this.x = this.game.canvas.width;
        } else if (this.x > this.game.canvas.width) {
            this.x = 0;
        }
        
        // Verificar colisiones con plataformas
        this.checkPlatformCollisions();
    }
    
    checkPlatformCollisions() {
        for (let platform of this.game.platforms) {
            if (this.velY > 0 && // Solo cuando está cayendo
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width &&
                this.y + this.height > platform.y &&
                this.y + this.height < platform.y + platform.height + 10) {
                
                // Colisión detectada
                this.y = platform.y - this.height;
                this.velY = this.jumpPower;
                this.onGround = true;
                this.bounceAnimation = 10; // Animación de rebote
                
                // Log de colisión
                this.game.addCollisionLog(`Plataforma en Y: ${Math.floor(platform.y)}`);
                
                // Verificar si es una nueva plataforma más alta (nueva lógica de puntuación)
                if (platform.y < this.lastPlatformY) {
                    this.game.score += 10;
                    this.lastPlatformY = platform.y;
                    this.game.addCollisionLog(`¡Nueva altura! +10 puntos`);
                }
                
                break;
            }
        }
    }
    
    render(ctx, animationFrame) {
        // Efecto de animación en el tamaño
        const bounceScale = this.bounceAnimation > 0 ? 1 + (this.bounceAnimation / 50) : 1;
        const adjustedWidth = this.width * bounceScale;
        const adjustedHeight = this.height * bounceScale;
        const offsetX = (adjustedWidth - this.width) / 2;
        const offsetY = (adjustedHeight - this.height) / 2;
        
        // Cuerpo del jugador (retro style con animación)
        ctx.fillStyle = this.velY < 0 ? '#00FF44' : '#00FF00'; // Verde más brillante cuando salta
        ctx.fillRect(this.x - offsetX, this.y - offsetY, adjustedWidth, adjustedHeight);
        
        // Ojos (parpadeo cada 60 frames)
        if (Math.floor(animationFrame / 60) % 2 === 0) {
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x + 4, this.y + 4, 3, 3);
            ctx.fillRect(this.x + 13, this.y + 4, 3, 3);
        }
        
        // Boca (sonrisa cuando salta)
        ctx.fillStyle = '#000';
        if (this.velY < 0) {
            // Sonrisa
            ctx.fillRect(this.x + 6, this.y + 12, 2, 2);
            ctx.fillRect(this.x + 9, this.y + 11, 2, 2);
            ctx.fillRect(this.x + 12, this.y + 12, 2, 2);
        } else {
            // Boca normal
            ctx.fillRect(this.x + 6, this.y + 12, 8, 2);
        }
    }
}

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;
        this.collected = false;
        this.rotation = 0;
        this.bobOffset = 0;
    }
    
    update() {
        this.rotation += 0.1;
        this.bobOffset = Math.sin(this.rotation * 2) * 2;
    }
    
    render(ctx, animationFrame) {
        if (this.collected) return;
        
        const renderY = this.y + this.bobOffset;
        
        // Efecto de rotación de la moneda
        const rotationPhase = Math.floor(animationFrame / 10) % 8;
        
        ctx.fillStyle = '#FFD700'; // Dorado
        
        if (rotationPhase < 2 || rotationPhase > 5) {
            // Moneda vista de frente (círculo)
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, renderY + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Símbolo de moneda
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x + 4, renderY + 3, 1, 6);
            ctx.fillRect(this.x + 7, renderY + 3, 1, 6);
            ctx.fillRect(this.x + 3, renderY + 5, 6, 1);
        } else {
            // Moneda vista de lado (elipse)
            ctx.save();
            ctx.scale(0.3, 1);
            ctx.beginPath();
            ctx.arc((this.x + this.width/2) / 0.3, renderY + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Brillo
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(this.x + 2, renderY + 2, 2, 2);
    }
}

class Platform {
    constructor(x, y, width, height, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }
    
    render(ctx) {
        // Plataforma normal (estilo retro)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Borde
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Patrón retro
        ctx.fillStyle = '#EEEEEE';
        for (let i = 0; i < this.width; i += 10) {
            ctx.fillRect(this.x + i, this.y + 1, 1, this.height - 2);
        }
    }
}

// Inicializar el juego cuando la página esté cargada
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});