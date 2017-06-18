"use strict"

window.onload = function() {
    const game = new Phaser.Game(960, 420, Phaser.AUTO, 'game', null, false, false)
    game.state.add('play', new Play())
    game.state.start('play', true, false)
}
