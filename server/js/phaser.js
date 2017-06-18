// Hack
// https://github.com/crisu83/capthatflag/blob/feature/phaser-server/server/app/phaser.js

const Canvas = require('canvas')
const jsdom = require('jsdom')
const { XMLHttpRequest } = require('xmlhttprequest')
const { window } = new jsdom.JSDOM('<!DOCTYPE html><main></main>')
const { document } = window

window.Uint32Array = Uint32Array
window.Element = undefined
window.CanvasRenderingContext2D = true
// dummy
window.focus = () => { console.log('focus') }
window.scrollTo = () => { console.log('scrollTo') }

global.document = document
global.window = window
global.navigator = {userAgent: 'node.js'}
global.Canvas = Canvas
global.Image = Canvas.Image
global.PIXI = require('phaser-ce/build/custom/pixi')
global.XMLHttpRequest = XMLHttpRequest

const Phaser = require('phaser-ce/build/custom/phaser-arcade-physics.min')

global.Phaser = Phaser

module.exports = Phaser
