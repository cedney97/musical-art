var canvas = document.querySelector(".drawing-canvas")
var context = canvas.getContext("2d")
context.fillStyle = "#FF0000"
context.fillRect(5, 5, canvas.width - 10, canvas.height - 10)

var playButton = document.querySelector(".play-btn")
var infoButton = document.querySelector(".info-btn")
var overlay = document.querySelector(".overlay")
var isPainting = false

function infoOn() {
    overlay.style.display = "block"
    paintingOff()
}

function infoOff() {
    overlay.style.display = "none"
}

function paintingOn() {
    isPainting = true
    playButton.innerHTML = '<i class="fa-solid fa-music"></i>  Listening...'
}

function paintingOff() {
    isPainting = false
    playButton.innerHTML = '<i class="fa-solid fa-paintbrush"></i>  Start Painting'
}

playButton.onclick = function () {
    if (!isPainting) {
        paintingOn()
    } else {
        paintingOff()
    }
}

infoButton.onclick = function () {
    infoOn()
}