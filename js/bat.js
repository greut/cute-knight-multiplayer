"use strict"

class Bat extends Phaser.Sprite {
    constructor(game, x, y, key, frame) {
        super(game, x, y, key || 'bat', frame)

        this.anchor.set(.5, .5)

        this.game.physics.arcade.enable(this)
        this.body.setSize(20, 16, 6, 7)
        this.body.immovable = true
    }
}
