

const camera = document.getElementById("camera");
const statusText = document.getElementById("status");
const resultImage = document.getElementById("resultImage");
const resultsList = document.getElementById("results");

let model = null;

// Load AI model
async function loadModel() {
    if (model) return model;

    statusText.textContent = "Loading AI model...";

    try {
        await tf.ready();
        model = await cocoSsd.load();

        statusText.textContent = "AI model ready!";
        return model;

    } catch (error) {
        statusText.textContent = "AI model loading failed.";
        throw error;
    }
}

// Start Camera
document.getElementById("startBtn").onclick = async () => {
    try {
        statusText.textContent = "Starting camera...";

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        camera.srcObject = stream;
        await camera.play();

        statusText.textContent = "Camera is running.";

        await loadModel();

    } catch (error) {
        statusText.textContent =
            "Error: " + error.message;
    }
};

// Draw detection boxes
function drawResults(source, predictions) {

    const canvas = document.createElement("canvas");

    canvas.width = source.videoWidth || source.naturalWidth || source.width;
    canvas.height = source.videoHeight || source.naturalHeight || source.height;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

    resultsList.innerHTML = "";

    predictions.forEach(item => {

        const [x, y, width, height] = item.bbox;

        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = "#00ff00";
        ctx.font = "16px Arial";

        ctx.fillText(
            item.class + " " + Math.round(item.score * 100) + "%",
            x,
            Math.max(y - 5, 18)
        );

        const li = document.createElement("li");

        li.textContent =
            item.class + " - " +
            Math.round(item.score * 100) +
            "% confidence";

        resultsList.appendChild(li);
    });

    if (predictions.length === 0) {
        resultsList.innerHTML =
            "<li>No supported objects detected.</li>";
    }

    resultImage.src = canvas.toDataURL("image/jpeg");
}

// Detect image or camera frame
async function detectImage(source) {

    try {
        await loadModel();

        statusText.textContent = "Detecting objects...";

        const predictions = await model.detect(source);

        drawResults(source, predictions);

        statusText.textContent =
            "Detection completed! " +
            predictions.length + " objects detected.";

    } catch (error) {

        statusText.textContent =
            "Detection error: " + error.message;

        console.error(error);
    }
}

// Detect Live Frame
document.getElementById("captureBtn").onclick = () => {

    if (!camera.srcObject || !camera.videoWidth) {

        statusText.textContent = "Start the camera first.";
        return;
    }

    detectImage(camera);
};

// Upload Image
document.getElementById("uploadBtn").onclick = () => {

    const file = document.getElementById("fileInput").files[0];

    if (!file) {
        statusText.textContent = "Choose an image first.";
        return;
    }

    const image = new Image();

    image.onload = () => {
        detectImage(image);
        URL.revokeObjectURL(image.src);
    };

    image.onerror = () => {
        statusText.textContent = "Unable to load image.";
        URL.revokeObjectURL(image.src);
    };

    image.src = URL.createObjectURL(file);
};

