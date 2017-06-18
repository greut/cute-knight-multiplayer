"use strict"

class Play {
    constructor() {
        // Tous les joueurs
        this.players = {}
        // Héro et Nom du joueur
        this.hero = undefined
        this.name = undefined
        // Touches pressées en cours
        this.move = {x: 0, y: 0, attack: false}
    }

    init() {
        this.game.renderer.renderSession.roundPixels = true
    }

    preload() {
        this.game.load.spritesheet('hero', 'images/sheet_hero_64x64.png', 64, 64, 64)
        this.game.load.image('20x20', 'images/20x20.png')

        this.game.load.spritesheet('background', 'images/backgrounds.png', 231, 63, 3)

        this.game.load.tilemap('map', 'tmx/map.json', null, Phaser.Tilemap.TILED_JSON)
        this.game.load.image('spritesheet', 'images/spritesheet.png')
    }

    create() {
        this.background = this.game.add.sprite(0, 0, 'background')
        this.background.width = this.game.width
        this.background.height = this.game.height
        this.background.fixedToCamera = true

        this.map = this.game.add.tilemap('map')
        this.map.addTilesetImage('spritesheet')

        this.platforms = this.map.createLayer('platforms')
        this.platforms.resizeWorld()

        // WebSocket
        this.socket = io()

        this.socket.on('connect', this.onConnect.bind(this))
        this.socket.on('ready', this.onReady.bind(this))
        this.socket.on('new', this.onNew.bind(this))
        this.socket.on('dead', this.onDead.bind(this))
        this.socket.on('update', this.onUpdate.bind(this))

        // Évènements de déplacements.

        var cursor = this.input.keyboard.createCursorKeys()
        cursor.space = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR)

        // gauche <-> droite
        cursor.left.onDown.add(() => {
            this.move.x = cursor.right.isDown ? 0 : -1
            this.emitMove()
        }, this)
        cursor.left.onUp.add(() => {
            this.move.x = cursor.right.isDown ? 1 : 0
            this.emitMove()
        }, this)
        cursor.right.onDown.add(() => {
            this.move.x = cursor.left.isDown ? 0 : 1
            this.emitMove()
        }, this)
        cursor.right.onUp.add(() => {
            this.move.x = cursor.left.isDown ? -1 : 0
            this.emitMove()
        }, this)
        // haut ^-v bas
        cursor.up.onDown.add(() => {
            this.move.y = cursor.down.isDown ? 0 : -1
            this.emitMove()
        }, this)
        cursor.up.onUp.add(() => {
            this.move.y = cursor.down.isDown ? 1 : 0
            this.emitMove()
        }, this)
        cursor.down.onDown.add(() => {
            this.move.y = cursor.up.isDown ? 0 : 1
            this.emitMove()
        }, this)
        cursor.down.onUp.add(() => {
            this.move.y = cursor.up.isDown ? -1 : 0
            this.emitMove()
        }, this)
        // espace (attaque ou protection)
        cursor.space.onDown.add(() => {
            this.move.attack = true
            this.emitMove()
        }, this)
        cursor.space.onUp.add(() => {
            this.move.attack = false
            this.emitMove()
        }, this)
    }

    emitMove() {
        // Envoi des touches dans la connexion
        this.socket.emit('move', {id: this.id, move: this.move})
    }

    // Web-Socket

    // Première étape, se connecter avec un HELLO
    onConnect() {
        while (!this.name) {
            this.name = prompt('Username', '')
        }
        this.socket.emit('hello', {name: this.name})
    }

    // On nous répond avec READY
    onReady(data) {
        // Suppression des anciens états.
        Object.keys(this.players).forEach(key => {
            this.onDead({id: key})
        }, this)

        // Création de notre héros
        var me = data.me
        this.id = me.id
        this.hero = this.onNew(me)

        this.game.camera.follow(this.hero)

        // Création des autres joueurs
        data.others.forEach(other => {
            this.onNew(other)
        }, this)
    }

    // Un nouveau joueur entre
    onNew(other) {
        var user = new Hero(this.game, other.name, other.position.x, other.position.y)
        user.scale.x = other.scale.x
        this.game.add.existing(user)
        this.players[other.id] = user

        return user
    }

    // Un joueur quitte
    onDead(other) {
        if (other.id in this.players) {
            this.players[other.id].kill()
            delete this.players[other.id]
        }
    }

    // L'état du jeu est modifié
    onUpdate(state) {
        state.players.forEach(user => {
            var player = this.players[user.id]
            if (player) {
                player.onUpdate(user)
            }
        }, this)
    }
}
