"use strict"

class Snake extends Phaser.Sprite {
    constructor(game, x, y, key, frame) {
        super(game, x, y, key || 'snake', frame)

        this.anchor.set(.5, 1)

        this.game.physics.arcade.enable(this)
        this.body.setSize(30, 20, 17, 44)
        this.body.immovable = true
    }
}
