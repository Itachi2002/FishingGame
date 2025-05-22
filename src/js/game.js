import '../css/style.css'
import { Actor, Engine, Vector, DisplayMode, Keys, Color, CollisionType, Label, Font, FontUnit } from "excalibur"
import { Resources, ResourceLoader } from './resources.js'

// Base class for all underwater objects (Fish and Trash)
class Shadow extends Actor {
    constructor(x, y, direction = 1, speed = 1) {
        super({
            x: x,
            y: y,
            width: 30,
            height: 20,
            collisionType: CollisionType.Active
        })
        this.speed = speed
        this.direction = direction // 1 for right, -1 for left
        this.time = 0
        this.stopped = false
    }

    update(engine, delta) {
        super.update(engine, delta)
        if (!this.stopped) {
            this.time += delta
            this.vel.y = 0
            this.vel.x = this.speed * this.direction
        } else {
            this.vel.x = 0
        }
        // Wrap around
        if (this.pos.x < -100) {
            this.pos.x = engine.drawWidth + 100
        } else if (this.pos.x > engine.drawWidth + 100) {
            this.pos.x = -100
        }
    }
}

// Fish class met shadow en echte vis
class Fish extends Shadow {
    constructor(x, y, direction, speed, points, shadowSprite, realSprite) {
        super(x, y, direction, speed)
        this.points = points
        this.isShadow = true
        this.shadowSprite = shadowSprite
        this.realSprite = realSprite
        const fishShadow = shadowSprite.toSprite()
        fishShadow.scale = { x: 0.1, y: 0.1 }
        this.graphics.use(fishShadow)
    }
    showRealFish() {
        const real = this.realSprite.toSprite()
        real.scale = { x: 0.1, y: 0.1 }
        this.graphics.use(real)
        this.isShadow = false
        setTimeout(() => this.kill(), 700)
    }
}

// Trash class met shadow en echte trash
class Trash extends Shadow {
    constructor(x, y, direction, speed, shadowSprite, realSprite, penalty) {
        super(x, y, direction, speed)
        this.penalty = penalty
        this.isShadow = true
        this.shadowSprite = shadowSprite
        this.realSprite = realSprite
        const trashShadow = shadowSprite.toSprite()
        trashShadow.scale = { x: 0.1, y: 0.1 }
        this.graphics.use(trashShadow)
    }
    showRealTrash() {
        const real = this.realSprite.toSprite()
        real.scale = { x: 0.1, y: 0.1 }
        this.graphics.use(real)
        this.isShadow = false
        setTimeout(() => this.kill(), 700)
    }
}

// Dobber class, altijd vrij bewegen
class Dobber extends Actor {
    constructor() {
        super({
            x: 200,
            y: 200,
            width: 15,
            height: 15,
            collisionType: CollisionType.Passive
        })
        this.isUnderwater = false
        this.canCatch = false
        this.sprite = Resources.Dobber.toSprite()
        this.sprite.scale = { x: 0.1, y: 0.1 }
        this.graphics.use(this.sprite)
        this._lastCollided = null
        this.underwaterTimer = null
        this.catchTimeLimit = 800 // Reduced from 1000 to 800ms for more challenge
        this.moveSpeed = 4 // Reduced from 5 to 4 for more precise control
    }

    update(engine, delta) {
        super.update(engine, delta)
        this.collisionType = this.isUnderwater ? CollisionType.Active : CollisionType.Passive

        if (!this.isUnderwater) {
            this.sprite.opacity = 1
            const overlap = engine.currentScene.actors.find(actor =>
                ((actor instanceof Fish || actor instanceof Trash) && actor.isShadow && isOverlap(this, actor))
            )
            if (overlap) {
                this.isUnderwater = true
                this.sprite.opacity = 0.3
                this.canCatch = true
                overlap.stopped = true
                this._lastCollided = overlap
                // Start timer when going underwater
                if (this.underwaterTimer) clearTimeout(this.underwaterTimer)
                this.underwaterTimer = setTimeout(() => {
                    if (this.isUnderwater) {
                        this.isUnderwater = false
                        this.canCatch = false
                        this.sprite.opacity = 1
                        engine.ui.showFeedback('Te laat!')
                        // Make the fish/trash disappear
                        if (this._lastCollided) {
                            if (this._lastCollided instanceof Fish) {
                                engine.ui.showFeedback('Vis ontsnapt!')
                                setTimeout(() => engine.spawnFish(), 700)
                            } else if (this._lastCollided instanceof Trash) {
                                engine.ui.showFeedback('Trash gezonken!')
                                setTimeout(() => engine.spawnTrash(), 700)
                            }
                            this._lastCollided.kill()
                            this._lastCollided = null
                        }
                    }
                }, this.catchTimeLimit)
            } else {
                this._lastCollided = null
            }

            if (engine.input.keyboard.isHeld(Keys.Up)) {
                this.pos.y = Math.max(30, this.pos.y - this.moveSpeed)
            }
            if (engine.input.keyboard.isHeld(Keys.Down)) {
                this.pos.y = Math.min(engine.drawHeight - 30, this.pos.y + this.moveSpeed)
            }
            if (engine.input.keyboard.isHeld(Keys.Left)) {
                this.pos.x = Math.max(30, this.pos.x - this.moveSpeed)
            }
            if (engine.input.keyboard.isHeld(Keys.Right)) {
                this.pos.x = Math.min(engine.drawWidth - 30, this.pos.x + this.moveSpeed)
            }
        } else {
            this.sprite.opacity = 0.3
            if (engine.input.keyboard.wasPressed(Keys.Space) && this.canCatch) {
                clearTimeout(this.underwaterTimer)
                this.emit('trycatch')
                this.canCatch = false
            }
            if (!this.canCatch) {
                if (this.underwaterTimer) clearTimeout(this.underwaterTimer)
                setTimeout(() => {
                    this.isUnderwater = false
                    this.sprite.opacity = 1
                    if (this._lastCollided && this._lastCollided.isShadow) {
                        this._lastCollided.stopped = false
                    }
                }, 700)
            }
        }
    }
}

// UI class voor feedback
class UI {
    constructor(game) {
        this.game = game
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0
        this.scoreLabel = new Label({
            text: '',
            pos: new Vector(100, 50),
            font: new Font({ size: 24, unit: FontUnit.Px, color: Color.White })
        })
        this.highScoreLabel = new Label({
            text: '',
            pos: new Vector(100, 80),
            font: new Font({ size: 20, unit: FontUnit.Px, color: Color.White })
        })
        this.feedbackLabel = new Label({
            text: '',
            pos: new Vector(game.drawWidth / 2 - 60, 100),
            font: new Font({ size: 32, unit: FontUnit.Px, color: Color.Yellow })
        })
        
        // Create lives container with background
        this.livesContainer = new Actor({
            x: game.drawWidth -250,
            y: 50,
            width: 180,
            height: 50
        })
        
        // Add semi-transparent background to lives container
        const livesBg = new Actor({
            x: 65,
            y: 0,
            width: 300,
            height: 50,
            color: new Color(0, 0, 0, 0.5)
        })
        this.livesContainer.addChild(livesBg)
        
        // Add "Lives:" label
        const livesLabel = new Label({
            text: 'Lives:',
            pos: new Vector(-70, -15),
            font: new Font({ size: 30, unit: FontUnit.Px, color: Color.White })
        })
        this.livesContainer.addChild(livesLabel)
        
        // Create trash icons for lives
        this.lives = []
        this.maxLives = 3
        this.updateLives(this.maxLives)
        
        game.add(this.scoreLabel)
        game.add(this.highScoreLabel)
        game.add(this.feedbackLabel)
        game.add(this.livesContainer)
    }
    
    updateLives(currentLives) {
        // Remove old lives
        this.lives.forEach(life => life.kill())
        this.lives = []
        
        // Place trash icons to the right of the label, with less spacing
        const startX = 60; // Start after the label
        for (let i = 0; i < this.maxLives; i++) {
            const trashSprite = Resources.Trash.toSprite()
            trashSprite.scale = { x: 0.07, y: 0.07 }
            trashSprite.opacity = i < currentLives ? 1 : 0.3
            
            const trashIcon = new Actor({
                x: startX + (i * 60), // Less spacing between icons
                y: 0,
                width: 32,
                height: 32
            })
            trashIcon.graphics.use(trashSprite)
            this.livesContainer.addChild(trashIcon)
            this.lives.push(trashIcon)
        }
    }
    
    updateScore(score) {
        if (score > this.highScore) {
            this.highScore = score
            localStorage.setItem('highScore', this.highScore)
        }
        this.scoreLabel.text = `Score: ${score}`
        this.highScoreLabel.text = `High Score: ${this.highScore}`
    }
    
    showFeedback(text) {
        this.feedbackLabel.text = text
        setTimeout(() => { this.feedbackLabel.text = '' }, 900)
    }
}

// Player class: vang vis bij collision+spatie, collision alleen als dobber onder water is
class Player {
    constructor(game) {
        this.dobber = new Dobber()
        this.score = 0
        this.game = game
        this.lives = 3
        game.add(this.dobber)
        this.dobber.on('trycatch', () => this.handleCatch())
    }
    getScore() { return this.score }
    addPoints(points) {
        this.score += points
        this.game.ui.updateScore(this.score)
    }
    handleCatch() {
        if (this.game.isGameOver) return
        // Check alle overlappingen op dit moment
        const fishOverlaps = this.game.currentScene.actors.filter(actor =>
            (actor instanceof Fish && actor.isShadow && isOverlap(this.dobber, actor))
        )
        const trashOverlaps = this.game.currentScene.actors.filter(actor =>
            (actor instanceof Trash && actor.isShadow && isOverlap(this.dobber, actor))
        )
        if (fishOverlaps.length > 0) {
            const fish = fishOverlaps[0]
            fish.showRealFish()
            this.addPoints(fish.points)
            this.game.ui.showFeedback('Gevangen!')
            Resources.FishCaught.play()
            setTimeout(() => this.game.spawnFish(), 700)
        } else if (trashOverlaps.length > 0) {
            const trash = trashOverlaps[0]
            trash.showRealTrash()
            this.lives--
            this.game.ui.updateLives(this.lives)
            this.addPoints(-trash.penalty)
            this.game.trashCaught++
            this.game.ui.showFeedback('Trash gevangen!')
            Resources.TrashSound.play()
            setTimeout(() => this.game.spawnTrash(), 700)
            if (this.lives <= 0) {
                this.gameOver()
            }
        } else {
            this.game.ui.showFeedback('Mis!')
        }
    }
    gameOver() {
        this.game.isGameOver = true
        this.game.ui.showFeedback('GAME OVER!')
        this.dobber.isUnderwater = false
        this.dobber.canCatch = false
        this.game.showRestartButton()
    }
}

function isOverlap(a, b) {
    return (
        a.pos.x < b.pos.x + b.width &&
        a.pos.x + a.width > b.pos.x &&
        a.pos.y < b.pos.y + b.height &&
        a.pos.y + a.height > b.pos.y
    );
}

export class Game extends Engine {
    constructor() {
        super({ 
            width: 1280,
            height: 720,
            maxFps: 60,
            displayMode: DisplayMode.FitScreen,
            pixelRatio: 1
         })
        this.trashCaught = 0
        this.isGameOver = false
        this.restartButton = null
        this.background = null
        this.player = null
        this.ui = null
        this.start(ResourceLoader).then(() => this.startGame())
    }

    startGame() {
        // First, remove all existing actors
        this.currentScene.actors.forEach(actor => {
            actor.kill()
        })
        
        // Reset game state
        this.isGameOver = false
        this.trashCaught = 0
        this.player = null
        this.ui = null
        this.restartButton = null
        
        // Create new background
        this.background = new Actor({
            x: this.drawWidth / 2,
            y: this.drawHeight / 2,
            width: this.drawWidth,
            height: this.drawHeight
        })
        this.background.graphics.use(Resources.Background.toSprite())
        this.add(this.background)
        
        // Create new player and UI
        this.player = new Player(this)
        this.ui = new UI(this)
        
        // Spawn initial fish and trash
        for (let i = 0; i < 5; i++) this.spawnFish()
        for (let i = 0; i < 2; i++) this.spawnTrash()
    }

    spawnFish() {
        if (this.isGameOver) return
        // Zeldzame vis: 1 op 20 kans
        const rareChance = Math.random()
        let type
        if (rareChance < 0.05) {
            // Make rare fish much faster
            type = { 
                shadow: Resources.ShadowRare, 
                real: Resources.FishRare, 
                points: 50, 
                minSpeed: (15 + this.player.score/10)*5, // Increased base speed
                maxSpeed: (20 + this.player.score/5)*5  // Increased max speed
            }
        } else if (Math.random() < 0.5) {
            type = { shadow: Resources.ShadowFish1, real: Resources.Fish1, points: 10, minSpeed: (6 + this.player.score/25)*2, maxSpeed: (8 + this.player.score/12)*2 }
        } else {
            type = { shadow: Resources.ShadowFish2, real: Resources.Fish2, points: 20, minSpeed: (7 + this.player.score/20)*2, maxSpeed: (10 + this.player.score/10)*2 }
        }
        const direction = Math.random() > 0.5 ? 1 : -1
        const speed = Math.random() * (type.maxSpeed - type.minSpeed) + type.minSpeed
        const y = Math.random() * (this.drawHeight - 60) + 30
        const x = direction === 1 ? -50 : this.drawWidth + 50
        const fish = new Fish(x, y, direction, speed, type.points, type.shadow, type.real)
        fish.on('exitviewport', () => { this.remove(fish); this.spawnFish() })
        this.add(fish)
    }

    spawnTrash() {
        if (this.isGameOver) return
        const type = { shadow: Resources.ShadowTrash, real: Resources.Trash, penalty: 10, minSpeed: (6 + this.player.score/15)*2, maxSpeed: (10 + this.player.score/8)*2 }
        const direction = Math.random() > 0.5 ? 1 : -1
        const speed = Math.random() * (type.maxSpeed - type.minSpeed) + type.minSpeed
        const y = Math.random() * (this.drawHeight - 60) + 30
        const x = direction === 1 ? -50 : this.drawWidth + 50
        const trash = new Trash(x, y, direction, speed, type.shadow, type.real, type.penalty)
        trash.on('exitviewport', () => { this.remove(trash); this.spawnTrash() })
        this.add(trash)
    }

    // Helper om alle actors behalve background te verwijderen
    clearActors() {
        this.currentScene.actors.forEach(actor => {
            if (actor !== this.background) {
                actor.kill()
            }
        })
    }

    showRestartButton() {
        if (this.restartButton) return
        
        // Create a semi-transparent overlay
        const overlay = new Actor({
            x: this.drawWidth / 2,
            y: this.drawHeight / 2,
            width: this.drawWidth,
            height: this.drawHeight,
            color: new Color(0, 0, 0, 0.5)
        })
        this.add(overlay)
        
        // Create restart button
        this.restartButton = new Actor({
            x: this.drawWidth / 2,
            y: this.drawHeight / 2 + 60,
            width: 200,
            height: 60,
            color: Color.Azure
        })
        
        const label = new Label({
            text: 'Restart',
            pos: new Vector(this.drawWidth / 2 - 50, this.drawHeight / 2 + 50),
            font: new Font({ size: 32, unit: FontUnit.Px, color: Color.Black })
        })
        
        // Add click handler with a small delay to ensure cleanup
        this.restartButton.on('pointerup', () => {
            // Remove UI elements first
            overlay.kill()
            this.restartButton.kill()
            label.kill()
            
            // Small delay before restarting to ensure cleanup
            setTimeout(() => {
                this.restartButton = null
                this.startGame()
            }, 100)
        })
        
        this.add(this.restartButton)
        this.add(label)
    }
}

new Game()
