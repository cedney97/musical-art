var canvas = document.querySelector(".drawing-canvas")
var context = canvas.getContext("2d")

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

//---------//

let noteNames = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"]
let colors = ["#ff0200", "#ff514f", "#ff7f0b", "#ff9933", "#fdff00", "#7fff00", "#09ff00", "#027fff", "#1d00ff", "#5700bf", "#7f00ff", "#d93973"]
let essentiaExtractor;

let audioData;

const AudioContext = window.AudioContext || window.webkitAudioContext
let audioCtx = new AudioContext()
let plotChroma;
let plotContainerId = "plot-div";

let isComputed = false;
let frameSize = 4096;
let hopSize = 2048;

const uploadToPlayer = () => {
    var file = document.querySelector(".file-select").files[0]
    var reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById("audio-player").src = e.target.result
    }
    reader.readAsDataURL(file)
}

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

async function onClickFeatureExtractor() {
    audioData = await essentiaExtractor.getAudioChannelDataFromURL(document.getElementById("audio-player").src, audioCtx, 0)

    if (isComputed) {
        plotChroma.destroy();
        isComputed = false;
    }

    essentiaExtractor.frameSize = frameSize;
    essentiaExtractor.hopSize = hopSize;
    essentiaExtractor.sampleRate = audioCtx.sampleRate;
    essentiaExtractor.profile.HPCP.nonLnear = true;

    let audioFrames = essentiaExtractor.FrameGenerator(audioData, frameSize, hopSize);
    let chordsByNote = [];
    let chordsByChord = [];
    let chordsByIntervals = [];
    let hpcpgram = [];
    for (var i = 0; i < audioFrames.size(); i++) {
        var ext = essentiaExtractor.hpcpExtractor(essentiaExtractor.vectorToArray(audioFrames.get(i)))
        hpcpgram.push(ext)
    }

    for (var hpcp of hpcpgram) {
        // console.log(hpcp)
        var maxi1 = 0
        var maxi2 = 0
        var maxi3 = 0
        for (var i = 0; i < hpcp.length; i++) {
            if (hpcp[i] > hpcp[maxi1]) {
                maxi1 = i
            }
        }
        for (var i = 0; i < hpcp.length; i++) {
            if (hpcp[i] > hpcp[maxi2] && hpcp[i] < hpcp[maxi1]) {
                maxi2 = i
            }
        }
        for (var i = 0; i < hpcp.length; i++) {
            if (hpcp[i] > hpcp[maxi3] && hpcp[i] < hpcp[maxi2]) {
                maxi3 = i
            }
        }
        var notes = [teoria.note(noteNames[(maxi1 + 9) % 12]), teoria.note(noteNames[(maxi2 + 9) % 12]), teoria.note(noteNames[(maxi3 + 9) % 12])]
        chordsByNote.push(notes)
    }

    for (var notes of chordsByNote) {
        var chord = teoria.chord(notes[0].toString())
        var intervals = ["P1", teoria.interval(notes[0], notes[1]).simple(true).toString(), teoria.interval(notes[0], notes[2]).simple(true).toString()]
        chord.voicing(intervals)
        chordsByChord.push(chord)
        chordsByIntervals.push(intervals)
        // console.log(chord.simple())
    }

    for (var chord of chordsByChord) {
        var root = chord.root
        var quality = chord.quality()
        var intervals = chord.voicing()
        var randX = Math.floor(Math.random() * canvas.width)
        var randY = Math.floor(Math.random() * canvas.height)
        var colorHex = colors[root.chroma()]
        var colorRGB = hexToRgb(colorHex)
        // console.log(color + " in " + intervals + " as " + quality)
        context.fillStyle = colorHex
        context.strokeStyle = colorHex

        // For first interval
        var qualityI1 = intervals[1].toString().charAt(0)
        var numI1 = intervals[1].toString().charAt(1)
        var qualityI2 = intervals[2].toString().charAt(0)
        var numI2 = intervals[1].toString().charAt(1)

        // console.log(numI1)
        switch (qualityI1) {
            case 'A':
                console.log("Augmented Interval")
                context.beginPath();
                context.arc(randX, randY, numI1 * 10, 0, Math.PI / 3 * numI1, Math.random() > 0.5)
                context.fill()
                context.closePath();
                break;
            case 'P':
                console.log("Perfect Interval")
                break;
            case 'm':
                var rotation = Math.random() * Math.PI * 2
                context.rotate(rotation)
                var base = numI2 * 25
                var height = numI1 * 25
                context.beginPath();
                context.moveTo(randX - base / 2, randY)
                context.lineTo(randX, randY + height)
                context.lineTo(randX + base / 2, randY)
                context.lineTo(randX - base / 2, randY)
                if (Math.random() < 0.5) {
                    context.stroke();
                } else {
                    context.fill();
                }
                context.closePath();
                context.rotate(-rotation)
                console.log("minor Interval")
                break;
            case 'M':
                var rg = context.createRadialGradient(randX, randY, numI1 * 5, randX, randY, numI1 * 11)
                rg.addColorStop(0, 'rgba(' + colorRGB.r  + ', ' + colorRGB.b + ', ' + colorRGB.g + ', 1)')
                rg.addColorStop(1, 'rgba(' + colorRGB.r  + ', ' + colorRGB.b + ', ' + colorRGB.g + ', 0)')
                context.fillStyle = rg

                context.beginPath();
                context.fillRect(randX - (numI1 * 75) / 2, randY - (numI1 * 50) / 2, numI1 * 75, numI1 * 50);
                console.log("Major Interval")
                context.closePath();
                break;
            case 'd':
                
                console.log("diminished Interval")
                break;
            default:
                console.log("No Interval?")
        }
    }
    isComputed = true;
}

$(document).ready(function () {
    EssentiaWASM().then(async function (WasmModule) {
        essentiaExtractor = new EssentiaExtractor(WasmModule);

        $("#log-div").html(
            "<h5> essentia-" + essentiaExtractor.version + " wasm backend loaded ..."
        );

        $("#log-div").append(
            '<button id="btn" class="ui white inverted button"> Compute HPCP Chroma </button>'
        )

        var button = document.getElementById("btn")
        button.addEventListener("click", () => onClickFeatureExtractor(), false)
    })
})