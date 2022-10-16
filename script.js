var canvas = document.querySelector(".drawing-canvas")
var context = canvas.getContext("2d")

var playButton = document.querySelector(".play-btn")
var infoButton = document.querySelector(".info-btn")
var overlay = document.querySelector(".overlay")

function infoOn() {
    overlay.style.display = "flex"
    document.getElementById("audio-player").style.display = "none"
}

function infoOff() {
    overlay.style.display = "none"
    document.getElementById("audio-player").style.display = "inline"
}

infoButton.onclick = function () {
    infoOn()
}

//---------//

let noteNames = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"]
let colors = ["#ff0200", "#d93973", "#ff514f", "#7f00ff", "#ff7f0b", "#5700bf", "#ff9933", "#1d00ff", "#fdff00", "#027fff", "#7fff00", "#09ff00"]
let essentiaExtractor;

let audioData;

const AudioContext = window.AudioContext || window.webkitAudioContext
let audioCtx = new AudioContext()

let frameSize = 4096;
let hopSize = 2048;
var file

const uploadToPlayer = () => {
    file = document.querySelector(".file-select").files[0]
    if (typeof file == "undefined") {
        document.querySelector(".title").textContent = "Invalid File"
    } else {
        var fileName = file.name
        document.querySelector(".title").textContent = fileName.substring(0, fileName.length - 4)
        var reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("audio-player").src = e.target.result
        }
        reader.readAsDataURL(file)
    }
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
    if (typeof file == "undefined") {
        document.querySelector(".title").textContent = "Unable to Paint"
        return;
    }

    audioData = await essentiaExtractor.getAudioChannelDataFromURL(document.getElementById("audio-player").src, audioCtx, 0)

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

    // Set up 
    context.clearRect(0, 0, canvas.width, canvas.height)
    var random = true
    if (document.getElementById("structured").checked) {
        random = false
    }

    for (var chord of chordsByChord) {
        var root = chord.root
        var quality = chord.quality()
        var intervals = chord.voicing()
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

        if (random) {
            var x = Math.floor(Math.random() * canvas.width)
            var y = Math.floor(Math.random() * canvas.height)
        } else {
            var x = numI1 * (1275.0 / 12)
            var y = numI2 * (850.0 / 12)
        }


        // console.log(numI1)
        switch (qualityI1) {
            case 'A':
                context.beginPath();
                context.arc(x, y, numI1 * 10, 0, Math.PI / 3 * numI1, Math.random() > 0.5)
                context.fill()
                context.closePath();
                break;
            case 'P':
                var rotation = Math.random() * Math.PI * 2
                context.rotate(rotation)
                context.lineWidth = "5.0"
                context.lineCap = "round"
                context.beginPath();
                context.moveTo(x, y)
                context.quadraticCurveTo(x + numI1 * 5, y - numI2 * 3, x + numI1 * 6, y)
                context.quadraticCurveTo(x + numI1 * 8, y + numI2 * 3, x + numI1 * 12, y)
                context.stroke()
                context.lineWidth = "1.0"
                context.lineCap = "butt"
                context.rotate(-rotation)
                break;
            case 'm':
                var rotation = Math.random() * Math.PI * 2
                context.rotate(rotation)
                var base = numI2 * 25
                var height = numI1 * 25
                context.lineWidth = "5.0"
                context.lineCap = "round"
                context.beginPath();
                context.moveTo(x - base / 2, y)
                context.lineTo(x, y + height)
                context.lineTo(x + base / 2, y)
                context.lineTo(x - base / 2, y)
                if (Math.random() < 0.5) {
                    context.stroke();
                } else {
                    context.fill();
                }
                context.closePath();
                context.lineWidth = "1.0"
                context.lineCap = "butt"
                context.rotate(-rotation)
                break;
            case 'M':
                var rg = context.createRadialGradient(x, y, numI1 * 5, x, y, numI1 * 11)
                rg.addColorStop(0, 'rgba(' + colorRGB.r + ', ' + colorRGB.b + ', ' + colorRGB.g + ', 1)')
                rg.addColorStop(1, 'rgba(' + colorRGB.r + ', ' + colorRGB.b + ', ' + colorRGB.g + ', 0)')
                context.fillStyle = rg

                context.beginPath();
                context.fillRect(x - (numI1 * 75) / 2, y - (numI1 * 50) / 2, numI1 * 75, numI1 * 50);
                context.closePath();
                break;
            case 'd':
                context.lineWidth = "5.0"
                context.lineCap = "round"
                context.beginPath();
                context.moveTo(x, y)
                context.lineTo(x + (Math.floor(Math.random() * 3) - 1) * numI2 * 6, y + (Math.floor(Math.random() * 3) - 1) * numI1 * 7)
                context.stroke()
                context.lineWidth = "1.0"
                context.lineCap = "butt"
                break;
            default:
                context.lineWidth = "5.0"
                context.lineCap = "round"
                context.beginPath();
                context.moveTo(x, y)
                context.lineTo(x + (Math.floor(Math.random() * 3) - 1) * numI2 * 6, y + (Math.floor(Math.random() * 3) - 1) * numI1 * 7)
                context.stroke()
                context.lineWidth = "1.0"
                context.lineCap = "butt"
                console.log("No Interval?")
        }
    }
}

$(document).ready(function () {
    EssentiaWASM().then(async function (WasmModule) {
        essentiaExtractor = new EssentiaExtractor(WasmModule);

        var button = document.getElementById("paint-btn")
        button.addEventListener("click", () => onClickFeatureExtractor(), false)
    })
})