"use strict"

class Hero extends Phaser.Sprite {
    constructor(game, name, x, y, key, frame) {
        super(game, x, y, key || 'hero', frame)

        this.anchor.set(.5, 1)

        this.animations.add('idle', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7], 10, true)
        this.animations.add('jump', [32, 33, 34, 35, 36], 10, false)
        this.animations.add('fall', [36])
        this.animations.add('walk', [61, 62, 63], 10, true)
        this.animations.add('duck', [16, 17, 18, 19, 20, 21, 21, 21, 21], 10, false)
        this.animations.add('upstab', [40, 41, 42, 43, 44, 0], 10)
        this.animations.add('stab', [48, 49, 50, 51, 52, 0], 10)
        this.animations.add('hurt', [56, 57, 58, 59, 56, 57, 58, 59], 10, false)

        this.game.physics.arcade.enable(this)
        this.body.setSize(20, 30, 22, 34)

        var attack = this.game.add.sprite(24, 0, '20x20')
        attack.anchor.set(0.5, 1)
        this.addChild(attack)

        var upAttack = this.game.add.sprite(0, -32, '20x20')
        upAttack.anchor.set(0.5, 1)
        this.addChild(upAttack)

        this.attacks = [attack, upAttack]

        this.text = this.game.add.text(0, 0, name, {
            font: "12px Arial",
            fill: "#000",
            align: "center",
            backgroundColor: "#fff"
        })
        this.text.padding.set(10, 10)
        this.text.alpha = .5
        this.text.anchor.set(.5, 0)
        this.addChild(this.text)

        this.speed = 200
        this.jumpSpeed = 400
        this.canAttack = true
        this.canMove = true
    }

    move(directions) {
        var {x, y, attack} = directions

        if (!this.canMove) {
            return
        }

        if (x != 0) {
            this.scale.x = x
            this.text.scale.x = x
        }

        if (this.canAttack && attack) {
            var anim
            if (y < 0) {
                anim = 'upstab'
            } else if (y > 0) {
                anim = 'duck'
            } else {
                anim = 'stab'
            }

            this.canAttack = false
            this.attacks[0].body.enable = true
            this.animations.play(anim).onComplete.add(() => {
                this.attacks[0].body.enable = false
                // Attack timer
                this.game.time.events.add(Phaser.Timer.SECOND / 2, () => {
                    this.canAttack = true
                }, this)
            }, this)
        } else {
            this.body.velocity.x = this.speed * x
        }

        if (y < 0 && (this.body.onFloor() || this.body.touching.down)) {
            this.body.velocity.y = -this.jumpSpeed
        }
    }

    hurt() {
        this.canMove = false
        this.body.velocity.x = 0
        this.animations.play('hurt').onComplete.add(() => {
            this.canMove = true
        })
    }

    update() {
        if (this.canAttack && this.canMove) {
            var anim = 'idle',
                currentAnim = this.animations.currentAnim.name
            if (this.body.velocity.y < 0) {
                anim = 'jump'
            } else if(this.body.velocity.y >= 0 && !this.body.onFloor()) {
                anim = 'fall'
            } else if(this.body.velocity.x != 0) {
                anim = 'walk'
            }
            if (anim != currentAnim) {
                this.animations.play(anim)
            }
        }
    }
}
