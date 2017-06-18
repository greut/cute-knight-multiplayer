const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Phaser = require('./server/js/phaser')

const app = express()
const server = http.Server(app)

app.use('/libs', express.static('libs'))
app.use('/js', express.static('js'))
app.use('/client', express.static('client'))
app.use('/images', express.static('images'))
app.use('/tmx', express.static('tmx'))

const io = socketio(server, {origins: '*:*'}) // CORS

class Player extends Phaser.Sprite{
    constructor(state, name, id, x, y) {
        super(state.game, x, y, '20x30')

        // local
        this.name = name
        this.state = state
        this.id = id

        this.speed = 300
        this.jumpSpeed = 500

        this.health = 100
        this.frag = 0

        // animations
        this.animations.add('idle', [0])
        this.animations.add('jump', [0])
        this.animations.add('fall', [0])
        this.animations.add('walk', [0])
        this.animations.add('duck', [0], 2, false)
        this.animations.add('upstab', [0], 4, false)
        this.animations.add('stab', [0], 4, false)
        this.animations.add('hurt', [0], 2, false)
        this.animations.add('spawn', [0], 1, false)
        this.animations.add('death', [0], 1, false)

        this.animations.play('idle')

        // physics
        this.anchor.set(.5, 1)
        this.game.physics.arcade.enable(this)

        // Attack areas...
        var attack = this.game.add.sprite(24, 0, '20x20')
        attack.anchor.set(0.5, 1)
        this.addChild(attack)

        var upAttack = this.game.add.sprite(0, -32, '20x20')
        upAttack.anchor.set(0.5, 1)
        this.addChild(upAttack)

        this.attacks = {stab: attack, upstab: upAttack}

        this.canMove = true
        this.canAttack = true
        this.directions = {x:0, y:0, attack: false}
    }

    move(directions) {
        this.directions = directions
    }

    hurt() {
        if (!this.health || this.animations.currentAnim.name == 'duck') {
            return
        }

        this.canMove = false
        this.body.velocity.x = 0
        this.health -= 10
        if (this.health) {
            this.animations.play('hurt').onComplete.addOnce(() => {
                this.canMove = true
                this.canAttack = true
            }, this)
        } else {
            this.animations.play('death').onComplete.addOnce(() => {
                // Bye bye!
                this.state.delPlayer(this)
            }, this)
        }
    }

    update() {
        var attack = false,
            x = 0,
            y = 0,
            wantToJump = false,
            wantToDuck = false

        if (this.canMove) {
            x = this.directions.x
            y = this.directions.y
            attack = this.directions.attack

            if (x != 0) {
                this.scale.x = Math.sign(x) || 1
            }

            wantToJump = y < 0
            wantToDuck = y > 0

            this.body.velocity.x = this.speed * x

            // Jump
            //
            if (wantToJump && (this.body.onFloor() || this.body.touching.down)) {
                this.body.velocity.y = -this.jumpSpeed
            }
        }

        // Stab / Duck
        if (this.canAttack && attack) {
            var anim = 'stab'
            if (wantToJump) {
                anim = 'upstab'
            } else if (wantToDuck) {
                anim = 'duck'
            }

            // Le closure
            (function(anim) {
                this.canAttack = false
                // TODO: enable the right attack
                if (anim != 'duck') {
                    this.attacks[anim].body.enable = true
                }
                this.animations.play(anim).onComplete.addOnce(() => {
                    if (anim != 'duck') {
                        this.attacks[anim].body.enable = false
                    }
                    this.animations.play('idle')
                    this.game.time.events.add(Phaser.Timer.SECOND / 4, function() {
                        // Attack timer
                        this.canAttack = true
                        this.animations.play('idle')
                    }, this)
                }, this)
            }).bind(this)(anim)
        }


        // Animation
        var anim = 'idle',
            currentAnim = this.animations.currentAnim.name

        if (this.canMove && ['stab', 'upstab', 'duck'].indexOf(currentAnim) == -1) {
            if (this.body.velocity.y < 0) {
                anim = 'jump'
            } else if(this.body.velocity.y >= 0 && !this.body.onFloor()) {
                anim = 'fall'
            } else if(this.body.onFloor() && this.body.velocity.x != 0) {
                anim = 'walk'
            }
            if (anim != currentAnim) {
                this.animations.play(anim)
            }
        }
    }

    get json() {
        return  {
            id: this.id,
            name: this.name,
            frag: this.frag,
            health: this.health,
            position: {x: this.x, y: this.y},
            scale: {x: this.scale.x},
            animation: this.animations.currentAnim.name
        }
    }
}

class Play {
    constructor(ready) {
        this.users = {}
        this.counter = 0
        this.ready = ready
    }

    preload() {
        this.game.load.image('20x30', __dirname + '/server/images/20x30.png')
        this.game.load.image('20x20', __dirname + '/server/images/20x20.png')

        // file:// for XHR
        this.game.load.tilemap('map', 'file://' + __dirname + '/tmx/map.json', null, Phaser.Tilemap.TILED_JSON)
        this.game.load.image('spritesheet', __dirname + '/images/spritesheet.png')
    }

    create() {
        this.players = this.game.add.group()

        this.map = this.game.add.tilemap('map')
        this.map.addTilesetImage('spritesheet')
        this.map.setCollision(2)

        this.platforms = this.map.createLayer('platforms')
        this.platforms.resizeWorld()

        this.spawns = this.map.objects['spawns'].map(obj => {
            if (obj.name == 'spawn') {
                return {x: obj.x + obj.width, y: obj.y + obj.height}
            }
        })

        this.attacks = []

        this.game.physics.arcade.gravity.y = 600

        this.ready()
    }

    update() {
        var state = {players: []}
        for(var key in this.users) {
            var user = this.users[key]
            this.world.wrap(user, user.body.width/4)
            state.players.push(user.json)
        }

        this.game.physics.arcade.collide(this.players, this.platforms)

        this.game.physics.arcade.overlap(this.attacks, this.players, function(attack, hero){
            attack.body.enable = false
            hero.hurt()
            if (hero.health <= 0) {
                attack.parent.frag += 1
                attack.parent.health += 50
            }
        }, function(attack, hero) {
            return attack.parent != hero
        }, this)

        io.emit('update', state)

        if (Math.random() < .1) {
            this.attacks = this.attacks.filter(attack => {
                return attack.parent && attack.parent.health
            })
        }
    }

    addPlayer(name) {
        var id = ++this.counter
        var x = this.game.rnd.integerInRange(0, this.game.world.width)
        var y = this.game.rnd.integerInRange(0, this.game.world.height)
        var player = new Player(this, name||id, id, x, y)
        this.players.add(player)
        this.users[id] = player

        Object.keys(player.attacks).forEach(key => {
            var attack = player.attacks[key]
            this.game.physics.enable(attack)
            attack.body.enable = false
            attack.body.allowGravity = false
            attack.body.immovable = true
            this.attacks.push(attack)
        })

        return player
    }

    delPlayer(player) {
        Object.keys(player.attacks).forEach(key => {
            var attack = player.attacks[key],
                index = this.attacks.indexOf(attack)
            console.log(player.id, index)
            if (index >= 0) {
                this.attacks.splice(index, 1)
            }
        })
        this.players.remove(player)

        delete this.users[player.id]
    }
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/play', (req, res) => {
    res.sendFile(__dirname + '/client/index.html')
})

const game = new Phaser.Game(960, 600, Phaser.HEADLESS)
const play = new Play(() => {
    io.on('connection', socket => {
        console.log('a user is connected.')

        var user;

        socket.on('hello', data => {
            var {name} = data
            console.log('hello', name)

            var others = Object.keys(play.users).map(key => play.users[key].json)

            name = name.replace(/\bwww.*\b/, '❤')
                       .replace(/(porn|pussy|sex)/, '❤')

            user = play.addPlayer(name)

            socket.emit('ready', {
                me: user.json,
                others: others
            })
            socket.broadcast.emit('new', user.json)
        })

        socket.on('disconnect', () => {
            console.log('a user is disconnected.')
            if (user) {
                socket.broadcast.emit('dead', user.json)
                play.delPlayer(user)
                user = undefined
            }
        })

        socket.on('move', data => {
            var {id, move} = data
            var {x, y, attack} = move
            x = Math.sign(x)
            y = Math.sign(y)
            attack = !!attack
            //console.log(id, move)
            if (user) {
                user.move({x, y, attack})
            }
        })
    })

    server.listen(3000, '0.0.0.0', () => {
        console.log('listening on *:3000')
    })
})

game.state.add('play', play)
game.state.start('play', true, false)
game.desiredFps = 60 // default is 60
