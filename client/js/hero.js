"use strict"

class Hero extends Phaser.Sprite {
    constructor(game, name, x, y, key, frame) {
        super(game, x, y, key || 'hero', frame)

        this.anchor.set(.5, 1)

        // Animations

        this.animations.add('idle', [0])
        this.animations.add('jump', [32])
        this.animations.add('fall', [36])
        this.animations.add('walk', [61])

        // Temps des animations sur le serveur (en fps)
        this.animations.add('death', [8], 1, false)
        this.animations.add('duck', [16], 2, false)
        this.animations.add('spawn', [24], 1, false)
        this.animations.add('upstab', [40], 2, false)
        this.animations.add('stab', [48], 2, false)
        this.animations.add('hurt', [56], 2, false)

        // Texte

        this.text = this.game.add.text(0, 0," " + name + " ", {
            font: "10px Arial",
            fill: "#000",
            align: "center",
            boundsAlignV: "middle",
            boundsAlignH: "center",
            backgroundColor: "#fff"
        })
        this.text.alpha = .5
        this.text.anchor.set(.5, 0)
        this.text.setTextBounds(0, 0, this.text.width, this.text.height)
        this.addChild(this.text)

        // Zones de collision

        /* debug
        var attack = this.game.add.sprite(24, 0, '20x20')
        attack.anchor.set(0.5, 1)
        this.addChild(attack)

        var upAttack = this.game.add.sprite(0, -32, '20x20')
        upAttack.anchor.set(0.5, 1)
        this.addChild(upAttack)
        //*/
    }

    onUpdate(state) {
        this.x = state.position.x
        this.y = state.position.y
        this.scale.x = state.scale.x
        this.text.scale.x = state.scale.x

        this.text.setText(" " + state.name + " " + state.health + " ")
        this.animations.play(state.animation)
    }
}
