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

//---------//

let essentiaExtractor;
let audioURL = "./resources/AScale.mp3";

let audioData;

const AudioContext = window.AudioContext || window.webkitAudioContext
let audioCtx = new AudioContext()
let plotChroma;
let plotContainerId = "plot-div";

let isComputed = false;
let frameSize = 4096;
let hopSize = 2048;

const upload = () => {
    var file = document.querySelector(".file-select").files[0]
    var reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById("audio-player").src = e.target.result
    }
    reader.readAsDataURL(file)
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
    let chords = [];
    let hpcpgram = [];
    for (var i = 0; i < audioFrames.size(); i++) {
        hpcpgram.push(essentiaExtractor.hpcpExtractor(essentiaExtractor.vectorToArray(audioFrames.get(i))))
        for (const hcpc of hpcpgram) {
            console.log(hcpc)
        }
    }

    plotChroma.create(
        hpcpgram,
        "HPCP Chroma",
        audioData.length,
        audioCtx.sampleRate,
        hopSize
    );
    isComputed = true;
}

$(document).ready(function() {
    plotChroma = new EssentiaPlot.PlotHeatmap(
        Plotly,
        plotContainerId,
        "chroma",
        EssentiaPlot.LayoutChromaPlot
    );

    EssentiaWASM().then(async function(WasmModule) {
        essentiaExtractor = new EssentiaExtractor(WasmModule);

        $("#log-div").html (
            "<h5> essentia-" + essentiaExtractor.version + " wasm backend loaded ..."
        );
        
        $("#log-div").append (
            '<button id="btn" class="ui white inverted button"> Compute HPCP Chroma </button>'
        )

        var button = document.getElementById("btn")
        button.addEventListener("click", () => onClickFeatureExtractor(), false)
    })
})