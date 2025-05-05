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
            collisionType: CollisionType.Passive // Start als Passive
        })
        this.isUnderwater = false
        this.canCatch = false
        this.sprite = Resources.Dobber.toSprite()
        this.sprite.scale = { x: 0.1, y: 0.1 }
        this.graphics.use(this.sprite)
    }
    update(engine, delta) {
        super.update(engine, delta)
        // CollisionType aanpassen
        this.collisionType = this.isUnderwater ? CollisionType.Active : CollisionType.Passive
        if (!this.isUnderwater) {
            this.sprite.opacity = 1
            if (engine.input.keyboard.isHeld(Keys.Up)) {
                this.pos.y = Math.max(30, this.pos.y - 5)
            }
            if (engine.input.keyboard.isHeld(Keys.Down)) {
                this.pos.y = Math.min(engine.drawHeight - 30, this.pos.y + 5)
            }
            if (engine.input.keyboard.isHeld(Keys.Left)) {
                this.pos.x = Math.max(30, this.pos.x - 5)
            }
            if (engine.input.keyboard.isHeld(Keys.Right)) {
                this.pos.x = Math.min(engine.drawWidth - 30, this.pos.x + 5)
            }
            if (engine.input.keyboard.wasPressed(Keys.Space)) {
                this.isUnderwater = true
                this.sprite.opacity = 0.3
                this.canCatch = true
            }
        } else {
            this.sprite.opacity = 0.3
            if (engine.input.keyboard.wasPressed(Keys.Space) && this.canCatch) {
                this.emit('trycatch')
                this.canCatch = false
            }
            if (!this.canCatch) {
                setTimeout(() => {
                    this.isUnderwater = false
                    this.sprite.opacity = 1
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
        game.add(this.scoreLabel)
        game.add(this.highScoreLabel)
        game.add(this.feedbackLabel)
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
        game.add(this.dobber)
        this.dobber.on('trycatch', () => this.handleCatch())
    }
    getScore() { return this.score }
    addPoints(points) {
        this.score += points
        this.game.ui.updateScore(this.score)
    }
    handleCatch() {
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
        } else if (trashOverlaps.length > 0) {
            const trash = trashOverlaps[0]
            trash.showRealTrash()
            this.addPoints(-trash.penalty)
            this.game.ui.showFeedback('Trash gevangen!')
        } else {
            this.game.ui.showFeedback('Mis!')
        }
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
            pixelRatio: 1 // Force pixel ratio to 1 to avoid WebGL issues
        })
        this.start(ResourceLoader).then(() => this.startGame())
    }

    startGame() {
        console.log("Starting the game!")
        
        // Add background
        const background = new Actor({
            x: this.drawWidth / 2,
            y: this.drawHeight / 2,
            width: this.drawWidth,
            height: this.drawHeight
        })
        background.graphics.use(Resources.Background.toSprite())
        this.add(background)
        
        // Initialize game objects
        this.player = new Player(this)
        this.ui = new UI(this)
        
        // Add initial fish and trash
        const fishTypes = [
            { shadow: Resources.ShadowFish1, real: Resources.Fish1, points: 10, minSpeed: 4, maxSpeed: 6 },
            { shadow: Resources.ShadowFish2, real: Resources.Fish2, points: 20, minSpeed: 5, maxSpeed: 8 },
            { shadow: Resources.ShadowRare, real: Resources.FishRare, points: 50, minSpeed: 6, maxSpeed: 10 }
        ]
        for (let i = 0; i < 7; i++) {
            const type = fishTypes[Math.floor(Math.random() * fishTypes.length)]
            const direction = Math.random() > 0.5 ? 1 : -1
            const speed = Math.random() * (type.maxSpeed - type.minSpeed) + type.minSpeed
            const y = Math.random() * (this.drawHeight - 60) + 30
            const x = direction === 1 ? -50 : this.drawWidth + 50
            const fish = new Fish(x, y, direction, speed, type.points, type.shadow, type.real)
            this.add(fish)
        }
        // Trash
        const trashTypes = [
            { shadow: Resources.ShadowTrash, real: Resources.Trash, penalty: 10, minSpeed: 4, maxSpeed: 8 }
        ]
        for (let i = 0; i < 4; i++) {
            const type = trashTypes[0]
            const direction = Math.random() > 0.5 ? 1 : -1
            const speed = Math.random() * (type.maxSpeed - type.minSpeed) + type.minSpeed
            const y = Math.random() * (this.drawHeight - 60) + 30
            const x = direction === 1 ? -50 : this.drawWidth + 50
            const trash = new Trash(x, y, direction, speed, type.shadow, type.real, type.penalty)
            this.add(trash)
        }
    }
}

new Game()
