
const camera = document.getElementById("camera");
const statusText = document.getElementById("status");
const resultImage = document.getElementById("resultImage");
const resultsList = document.getElementById("results");

// Replace this with your actual deployed backend URL
const API_URL = "YOUR_BACKEND_URL/detect";

// Start Camera
document.getElementById("startBtn").onclick = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        camera.srcObject = stream;
        statusText.textContent = "Camera is running.";

    } catch (error) {
        statusText.textContent =
            "Camera access denied or unavailable.";
    }
};

// Detect Image
async function detectImage(blob) {

    const formData = new FormData();
    formData.append("image", blob, "road.jpg");

    statusText.textContent = "Detecting objects...";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: formData
        });

        // Read response as text first
        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error(
                "Backend returned HTML instead of JSON. Check your backend URL and server."
            );
        }

        if (!response.ok) {
            throw new Error(data.error || "Detection failed");
        }

        resultImage.src =
            "data:image/jpeg;base64," + data.image;

        resultsList.innerHTML = "";

        if (!data.detections || data.detections.length === 0) {

            resultsList.innerHTML =
                "<li>No objects detected.</li>";

        } else {

            data.detections.forEach(item => {

                const li = document.createElement("li");

                li.textContent =
                    `${item.name} — ${item.confidence}% confidence`;

                resultsList.appendChild(li);
            });
        }

        statusText.textContent = "Detection completed.";

    } catch (error) {

        statusText.textContent =
            "Error: " + error.message;

        console.error(error);
    }
}

// Detect Live Frame
document.getElementById("captureBtn").onclick = () => {

    if (!camera.srcObject || !camera.videoWidth) {

        statusText.textContent = "Start the camera first.";
        return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;

    canvas.getContext("2d").drawImage(
        camera, 0, 0, canvas.width, canvas.height
    );

    canvas.toBlob(blob => {

        if (blob) {
            detectImage(blob);
        }

    }, "image/jpeg");
};

// Upload Image
document.getElementById("uploadBtn").onclick = () => {

    const file = document.getElementById("fileInput").files[0];

    if (!file) {

        statusText.textContent = "Choose an image first.";
        return;
    }

    detectImage(file);
};

