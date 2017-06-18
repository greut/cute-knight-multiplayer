"use strict"

class Play {
    constructor() {
        this.move = {x: 0, y: 0, attack: false}
    }

    init() {
        this.game.renderer.renderSession.roundPixels = true
    }

    preload() {
        this.game.load.spritesheet('hero', 'images/sheet_hero_64x64.png', 64, 64, 64)
        this.game.load.spritesheet('snake', 'images/sheet_snake_64x64.png', 64, 64)
        this.game.load.spritesheet('bat', 'images/sheet_bat_32x32.png', 32, 32, 18)

        this.game.load.spritesheet('background', 'images/backgrounds.png', 231, 63, 3)

        this.game.load.image('20x20', 'images/20x20.png')

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
        this.map.setCollision(2)

        this.platforms = this.map.createLayer('platforms')
        this.platforms.resizeWorld()

        this.spawns = this.map.objects['spawns'].map(obj => {
            if (obj.name == 'spawn') {
                return {x: obj.x + obj.width / 2, y: obj.y + obj.height}
            }
        })

        this.cursor = this.input.keyboard.createCursorKeys()
        this.cursor.space = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR)

        this.heros = this.game.add.group()
        var {x, y} = this.game.rnd.pick(this.spawns)
        this.hero = new Hero(this.game, "Bob", x, y)
        this.heros.add(this.hero)

        var {x, y} = this.game.rnd.pick(this.spawns)
        var h = new Hero(this.game, "Alice", x, y)
        this.h = h
        this.heros.add(h)

        this.attacks = []
        this.heros.children.forEach(hero => {
            hero.attacks.forEach(attack => {
                this.game.physics.enable(attack)
                attack.body.enable = false
                attack.body.allowGravity = false
                attack.body.immovable = true
                this.attacks.push(attack)
            })
        })

        //this.snake = new Snake(this.game, this.game.world.centerX * 1.5, this.game.world.centerY / 2)
        //this.game.add.existing(this.snake)

        //this.bat = new Bat(this.game, this.game.world.centerX * 1.5, this.game.world.centerY * 1.5)
        //this.game.add.existing(this.bat)

        // Évènements de déplacements.

        this.cursor.left.onDown.add(() => {
            this.move.x = this.cursor.right.isDown ? 0 : -1
        }, this)
        this.cursor.left.onUp.add(() => {
            this.move.x = this.cursor.right.isDown ? 1 : 0
        }, this)
        this.cursor.right.onDown.add(() => {
            this.move.x = this.cursor.left.isDown ? 0 : 1
        }, this)
        this.cursor.right.onUp.add(() => {
            this.move.x = this.cursor.left.isDown ? -1 : 0
        }, this)

        this.cursor.up.onDown.add(() => {
            this.move.y = this.cursor.down.isDown ? 0 : -1
        }, this)
        this.cursor.up.onUp.add(() => {
            this.move.y = this.cursor.down.isDown ? 1 : 0
        }, this)
        this.cursor.down.onDown.add(() => {
            this.move.y = this.cursor.up.isDown ? 0 : 1
        }, this)
        this.cursor.down.onUp.add(() => {
            this.move.y = this.cursor.up.isDown ? -1 : 0
        }, this)

        this.cursor.space.onDown.add(() => {
            this.move.attack = true
        }, this)
        this.cursor.space.onUp.add(() => {
            this.move.attack = false
        }, this)

        this.game.physics.arcade.gravity.y = 600
        this.game.camera.follow(this.hero)
    }

    update() {
        this.heros.children.forEach(h => {this.world.wrap(h)}, this)

        //this.physics.arcade.collide(this.heros, this.snake)
        //this.physics.arcade.collide(this.heros, this.bat)


        this.physics.arcade.collide(this.heros, this.platforms)
        //this.physics.arcade.collide(this.bat, this.platforms)
        //this.physics.arcade.collide(this.snake, this.platforms)

        this.physics.arcade.overlap(this.attacks, this.heros, function(attack, hero){
            attack.body.enable = false
            hero.hurt()
        }, function(attack, hero) {
            return attack.parent != hero
        }, this)

        this.hero.move(this.move)
    }

    render() {
        //this.game.debug.bodyInfo(this.hero.attacks[0], 10, 40)
        //this.game.debug.bodyInfo(this.h, 10, 160)
        //this.game.debug.bodyInfo(this.hero.attacks[0], 10, 140)
    }
}
