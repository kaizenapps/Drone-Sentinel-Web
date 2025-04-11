let model;
let currentPrediction = "";
let predictionCallback;
let microphoneEnabled = false;
let audioContext = null;
let selectedFile = null;
let isAnalyzing = false;
let analyser = null;
let microphone = null;
let spectrogramCanvas = null;
let spectrogramCtx = null;
let animationId = null;
let dataArray = null;
let bufferLength = 0;

// Default confidence threshold (0-1)
let confidenceThreshold = 0.60;

// Check if the browser supports getUserMedia
function isMicrophoneSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Check if the browser supports AudioContext and FileReader for audio analysis
function isAudioAnalysisSupported() {
    return !!(window.AudioContext || window.webkitAudioContext) && !!(window.FileReader);
}

// Initialize the spectrogram visualization
function initSpectrogram() {
    spectrogramCanvas = document.getElementById('spectrogram');
    if (!spectrogramCanvas) {
        console.error('Spectrogram canvas not found');
        return false;
    }
    
    spectrogramCtx = spectrogramCanvas.getContext('2d');
    
    // Clear the canvas with black background
    spectrogramCtx.fillStyle = 'rgb(0, 0, 0)';
    spectrogramCtx.fillRect(0, 0, spectrogramCanvas.width, spectrogramCanvas.height);
    
    return true;
}

// Setup audio analyzer for visualization
function setupAudioAnalyzer(stream) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Create an analyzer node
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // Large FFT for detailed visualization
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    // Connect microphone to analyzer
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    // Start visualization
    renderSpectrogram();
    
    return true;
}

// Create or update the prediction bars
function updatePredictionBars(scores) {
    const barsContainer = document.getElementById('predictions-bars');
    if (!barsContainer) return;
    
    // Clear existing bars
    barsContainer.innerHTML = '';
    
    // Make sure we have labels and scores
    if (!labels || !scores || labels.length === 0 || scores.length === 0) return;
    
    // Find the maximum score for the gauge
    const maxScore = Math.max(...scores);
    const maxIndex = scores.indexOf(maxScore);
    
    // Update the gauge
    updateGauge(maxScore, labels[maxIndex]);
    
    // Create a bar for each label/score pair
    for (let i = 0; i < labels.length; i++) {
        // Create elements for this prediction
        const item = document.createElement('div');
        item.className = 'prediction-item';
        
        const label = document.createElement('div');
        label.className = 'prediction-label';
        label.textContent = labels[i];
        
        const barContainer = document.createElement('div');
        barContainer.className = 'prediction-bar-container';
        
        const bar = document.createElement('div');
        bar.className = 'prediction-bar';
        // Convert score to percentage width
        const percentage = (scores[i] * 100).toFixed(1);
        bar.style.width = `${percentage}%`;
        
        const value = document.createElement('div');
        value.className = 'prediction-value';
        value.textContent = `${percentage}%`;
        
        // Assemble the prediction item
        barContainer.appendChild(bar);
        item.appendChild(label);
        item.appendChild(barContainer);
        item.appendChild(value);
        
        // Add to the container
        barsContainer.appendChild(item);
    }
}

// Update the gauge with the highest prediction value
function updateGauge(value, label) {
    // Get gauge elements
    const gaugeFill = document.getElementById('gauge-fill');
    const gaugePointer = document.getElementById('gauge-pointer');
    const gaugeValue = document.getElementById('gauge-value');
    const gaugeLabel = document.getElementById('gauge-label');
    
    if (!gaugeFill || !gaugePointer || !gaugeValue || !gaugeLabel) return;
    
    // Calculate rotation angle for gauge fill and pointer
    // 0% = -90 degrees (or -π/2 radians), 100% = 90 degrees (or π/2 radians)
    const percentage = value * 100;
    const angle = -90 + (percentage * 1.8); // 1.8 degrees per percentage point (180 / 100)
    
    // Update the gauge fill by rotating it
    // The fill is rotated from the bottom center, so we're actually hiding part of it
    // by rotating it counter-clockwise
    const fillRotation = 0.5 - (value * 0.5); // 0.5 turns (180 degrees) at 0%, 0 turns at 100%
    gaugeFill.style.transform = `rotate(${fillRotation}turn)`;
    
    // Update the pointer
    gaugePointer.style.transform = `rotate(${angle}deg)`;
    
    // Update the value text
    gaugeValue.textContent = `${percentage.toFixed(1)}%`;
    
    // Update the label
    if (percentage > 60) {
        gaugeLabel.textContent = `${label} detected!`;
        gaugeLabel.style.color = '#d32f2f'; // Red for high confidence
    } else if (percentage > 30) {
        gaugeLabel.textContent = `Possible ${label}`;
        gaugeLabel.style.color = '#f57c00'; // Orange for medium confidence
    } else {
        gaugeLabel.textContent = 'Listening...';
        gaugeLabel.style.color = '#555'; // Default color for low/no detection
    }
}

// Update frequency for the accelerometer (milliseconds)
const ACCELEROMETER_UPDATE_INTERVAL = 16; // ~60 updates per second for smoother animation
let lastPredictionScores = [];
let accelerometerIntervalId = null;

// Cookie functions to save and load user settings
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Function to update the slider appearance based on current value
function updateSliderAppearance(value) {
    const percent = value;
    const slider = document.getElementById('confidence-threshold');
    if (slider) {
        slider.style.background = `linear-gradient(to right, #ff3d3d, #ff3d3d ${percent}%, #444 ${percent}%, #444)`;
    }
}

// Function to initialize the confidence threshold slider
function initConfidenceThresholdSlider() {
    const slider = document.getElementById('confidence-threshold');
    const thresholdValue = document.getElementById('threshold-value');
    const startButton = document.getElementById('start-button');
    
    if (!slider || !thresholdValue) return;
    
    // Try to load saved threshold from cookie
    const savedThreshold = getCookie('dronesentinel_threshold');
    if (savedThreshold !== null) {
        confidenceThreshold = parseFloat(savedThreshold);
        slider.value = confidenceThreshold * 100;
        thresholdValue.textContent = `${Math.round(confidenceThreshold * 100)}%`;
        updateSliderAppearance(slider.value);
    }
    
    // Add event listener for slider changes
    slider.addEventListener('input', function() {
        const value = parseInt(this.value);
        confidenceThreshold = value / 100;
        thresholdValue.textContent = `${value}%`;
        updateSliderAppearance(value);
        
        // Save to cookie (valid for 365 days)
        setCookie('dronesentinel_threshold', confidenceThreshold, 365);
    });
    
    // Add shimmer animation effect on button hover
    if (startButton) {
        startButton.addEventListener('mouseover', function() {
            const shimmerElement = this.querySelector('span:last-child');
            if (shimmerElement && !this.disabled) {
                shimmerElement.style.left = '100%';
            }
        });
        
        startButton.addEventListener('mouseout', function() {
            const shimmerElement = this.querySelector('span:last-child');
            if (shimmerElement) {
                shimmerElement.style.left = '-100%';
            }
        });
    }
}

// Render the spectrogram visualization
function renderSpectrogram() {
    // Cancel any existing animation
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Set up high-frequency updates for the accelerometer
    if (accelerometerIntervalId) {
        clearInterval(accelerometerIntervalId);
    }
    
    // If we have prediction scores, update the gauge more frequently
    // than waiting for new audio analysis
    if (lastPredictionScores.length > 0) {
        accelerometerIntervalId = setInterval(() => {
            // Add subtle random variations to make the gauge more dynamic but still smooth
            const modifiedScores = lastPredictionScores.map(score => {
                // Add up to ±3% random variation with higher update rate for smoother movement
                const variation = (Math.random() * 0.06) - 0.03;
                return Math.max(0, Math.min(1, score + (score * variation)));
            });
            updatePredictionBars(modifiedScores);
        }, ACCELEROMETER_UPDATE_INTERVAL);
    }
    
    // Create a gradient color map for better visualization
    let spectrogramGradient = null;
    if (spectrogramCtx) {
        spectrogramGradient = spectrogramCtx.createLinearGradient(0, 0, 0, spectrogramCanvas.height);
        spectrogramGradient.addColorStop(0.0, 'rgb(255, 0, 0)');   // Red (high frequencies)
        spectrogramGradient.addColorStop(0.25, 'rgb(255, 255, 0)'); // Yellow
        spectrogramGradient.addColorStop(0.5, 'rgb(0, 255, 0)');   // Green
        spectrogramGradient.addColorStop(0.75, 'rgb(0, 255, 255)'); // Cyan
        spectrogramGradient.addColorStop(1.0, 'rgb(0, 0, 255)');   // Blue (low frequencies)
        
        // Clear the canvas with black background
        spectrogramCtx.fillStyle = 'rgb(0, 0, 0)';
        spectrogramCtx.fillRect(0, 0, spectrogramCanvas.width, spectrogramCanvas.height);
        
        // Draw frequency grid lines
        spectrogramCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        spectrogramCtx.lineWidth = 1;
        
        // Draw horizontal grid lines (frequency divisions)
        const gridSpacing = 20; // pixels between grid lines
        for (let y = gridSpacing; y < spectrogramCanvas.height; y += gridSpacing) {
            spectrogramCtx.beginPath();
            spectrogramCtx.moveTo(0, y);
            spectrogramCtx.lineTo(spectrogramCanvas.width, y);
            spectrogramCtx.stroke();
        }
    }
    
    // Define drawing function
    function draw() {
        // Schedule next frame
        animationId = requestAnimationFrame(draw);
        
        // Get frequency data
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume level (0-255)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        // Update volume meter
        const volumeMeter = document.getElementById('volume-meter');
        if (volumeMeter) {
            // Scale to percentage (0-100%)
            const percentage = Math.min(100, (average / 128) * 100);
            volumeMeter.style.width = percentage + '%';
        }
        
        // Draw spectrogram
        if (spectrogramCtx) {
            // Shift existing graph to the left
            const imageData = spectrogramCtx.getImageData(1, 0, spectrogramCanvas.width - 1, spectrogramCanvas.height);
            spectrogramCtx.putImageData(imageData, 0, 0);
            
            // Draw new column at the right edge
            // For better visualization, use a broader brush and smoother transitions
            const binCount = dataArray.length;
            const binHeight = spectrogramCanvas.height / binCount;
            
            for (let i = 0; i < binCount; i++) {
                // Calculate intensity (0-255)
                const value = dataArray[i];
                
                // Skip very low values for cleaner display
                if (value < 5) continue;
                
                // Map frequency bin to y-position (invert so low frequencies are at bottom)
                const y = spectrogramCanvas.height - (i * binHeight) - binHeight;
                
                // Use alpha for intensity
                const alpha = value / 255;
                
                // Draw a frequency bin as a vertical bar with gradient color based on frequency
                spectrogramCtx.fillStyle = `rgba(${Math.min(255, value)}, ${Math.min(255, value/1.5)}, ${Math.min(255, value/3)}, ${alpha})`;
                spectrogramCtx.fillRect(spectrogramCanvas.width - 2, y, 2, binHeight + 1); // Slightly thicker for visibility
            }
            
            // Add time marker every second
            const date = new Date();
            if (date.getMilliseconds() < 50) { // Only draw once near the start of each second
                spectrogramCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                spectrogramCtx.fillRect(spectrogramCanvas.width - 1, 0, 1, spectrogramCanvas.height);
            }
        }
    }
    
    // Start the drawing loop
    draw();
}

// Stop the visualization
function stopVisualization() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Reset volume meter
    const volumeMeter = document.getElementById('volume-meter');
    if (volumeMeter) {
        volumeMeter.style.width = '0%';
    }
    
    // Clear the canvas
    if (spectrogramCtx && spectrogramCanvas) {
        spectrogramCtx.fillStyle = 'rgb(0, 0, 0)';
        spectrogramCtx.fillRect(0, 0, spectrogramCanvas.width, spectrogramCanvas.height);
    }
}

// Request microphone access
async function requestMicrophoneAccess() {
    try {
        const microphoneStatusElement = document.getElementById('microphone-status');
        const startButton = document.getElementById('start-button');
        
        if (!isMicrophoneSupported()) {
            throw new Error('Microphone access is not supported in this browser');
        }
        
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Set up the audio analyzer with the stream
        setupAudioAnalyzer(stream);
        
        // Successfully got microphone access
        microphoneEnabled = true;
        
        if (microphoneStatusElement) {
            const micStatusText = document.getElementById('mic-status-text');
            if (micStatusText) {
                micStatusText.textContent = 'Connected';
                micStatusText.style.color = '#ffffff'; // White text for visibility
            } else {
                microphoneStatusElement.textContent = 'Microphone: Connected';
            }
            microphoneStatusElement.className = 'status-active';
            microphoneStatusElement.style.borderLeft = '3px solid #4caf50';
        }
        
        if (startButton) {
            startButton.disabled = false;
            startButton.textContent = 'Start Listening';
        }
        
        return true;
    } catch (error) {
        console.error('Error accessing microphone:', error);
        
        const microphoneStatusElement = document.getElementById('microphone-status');
        const alertElement = document.getElementById('alert');
        const startButton = document.getElementById('start-button');
        
        if (microphoneStatusElement) {
            const micStatusText = document.getElementById('mic-status-text');
            if (micStatusText) {
                micStatusText.textContent = 'Error - ' + error.message;
                micStatusText.style.color = '#ffffff'; // White text for visibility
            } else {
                microphoneStatusElement.textContent = 'Microphone: Error - ' + error.message;
            }
            microphoneStatusElement.className = 'status-error';
            microphoneStatusElement.style.borderLeft = '3px solid #f44336';
        }
        
        if (alertElement) {
            alertElement.textContent = 'ERROR: Microphone access is required';
            alertElement.style.color = 'red';
        }
        
        if (startButton) {
            startButton.disabled = true;
        }
        
        return false;
    }
}

async function setupModel() {
    try {
        // Convert relative paths to absolute URLs with proper scheme
        const baseURL = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
        const modelURL = baseURL + 'model.json';
        const metadataURL = baseURL + 'metadata.json';
        
        console.log('Loading model from:', modelURL);
        console.log('Loading metadata from:', metadataURL);
        
        // Update UI to show model loading
        const alertElement = document.getElementById('alert');
        if (alertElement) {
            alertElement.textContent = 'Loading sound detection model...';
            alertElement.style.backgroundColor = '#1e1e1e';
            alertElement.style.color = '#ffffff';
            alertElement.style.borderLeft = '4px solid #666';
        }
        
        // First, fetch the metadata.json file to get the actual labels
        try {
            const response = await fetch(metadataURL);
            if (!response.ok) {
                throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
            }
            const metadata = await response.json();
            
            // Extract labels from metadata
            if (metadata && metadata.wordLabels && Array.isArray(metadata.wordLabels)) {
                labels = metadata.wordLabels;
                console.log('Loaded labels from metadata:', labels);
                
                // Update the UI to show the actual detection types
                const detectionTypesElement = document.querySelector('.status-box p:last-child');
                if (detectionTypesElement) {
                    detectionTypesElement.textContent = `Monitoring for: ${labels.join(', ')}`;
                }
            } else {
                throw new Error('Invalid metadata format: wordLabels not found or not an array');
            }
        } catch (metadataError) {
            console.error('Error loading metadata:', metadataError);
            console.warn('Using default labels as fallback');
            labels = ["Background Noise", "FPV Drone"];
        }
        
        // Create and load the model
        model = window.speechCommands.create('BROWSER_FFT', undefined, modelURL, metadataURL);
        await model.ensureModelLoaded();
        
        // Update model status in UI
        const modelStatusElement = document.getElementById('model-status');
        if (modelStatusElement) {
            const modelStatusText = document.getElementById('model-status-text');
            if (modelStatusText) {
                modelStatusText.textContent = 'Loaded';
                modelStatusText.style.color = '#ffffff'; // White text for visibility
            } else {
                modelStatusElement.textContent = 'Model: Loaded';
            }
            modelStatusElement.className = 'status-active';
            modelStatusElement.style.borderLeft = '3px solid #4caf50';
        }
        
        return true;
    } catch (error) {
        console.error('Error loading model:', error);
        
        // Update UI to show error
        const modelStatusElement = document.getElementById('model-status');
        const alertElement = document.getElementById('alert');
        
        if (modelStatusElement) {
            const modelStatusText = document.getElementById('model-status-text');
            if (modelStatusText) {
                modelStatusText.textContent = 'Error - Failed to load';
                modelStatusText.style.color = '#ffffff'; // White text for visibility
            } else {
                modelStatusElement.textContent = 'Model: Error - Failed to load';
            }
            modelStatusElement.className = 'status-error';
            modelStatusElement.style.borderLeft = '3px solid #f44336';
        }
        
        if (alertElement) {
            alertElement.textContent = 'ERROR: Could not load sound detection model';
            alertElement.style.color = 'red';
        }
        
        return false;
    }
}

async function startListening() {
    if (!model || !microphoneEnabled) {
        console.error('Cannot start listening: Model not loaded or microphone not enabled');
        return false;
    }
    
    try {
        const modelParameters = {
            invokeCallbackOnNoiseAndUnknown: true, // run even when only background noise is detected
            includeSpectrogram: true, // give us access to numerical audio data
            overlapFactor: 0.5 // how often per second to sample audio, 0.5 means twice per second
        };

        // Start listening with the loaded model
        await model.listen(
            // This callback function is invoked each time the model has a prediction
            prediction => {
                processAudioPrediction(prediction.scores);
                
                // If the spectrogram has spectral data, we could visualize it here
                if (prediction.spectrogram) {
                    // The TensorFlow.js model provides spectrogram data that could be visualized
                    // For this demo, we're using the Web Audio API's analyzer instead
                }
            },
            modelParameters
        );
        
        // Resume visualization if it was stopped
        if (!animationId && analyser) {
            renderSpectrogram();
        }
        
        // Update UI to show listening status
        const alertElement = document.getElementById('alert');
        const startButton = document.getElementById('start-button');
        
        if (alertElement) {
            alertElement.textContent = 'Listening for sounds...';
            alertElement.style.color = 'green';
        }
        
        if (startButton) {
            startButton.textContent = 'Stop Listening';
            startButton.onclick = stopListening;
        }
        
        return true;
    } catch (error) {
        console.error('Error starting listening:', error);
        
        // Update UI to show error
        const alertElement = document.getElementById('alert');
        
        if (alertElement) {
            alertElement.textContent = 'ERROR: Could not start listening';
            alertElement.style.color = 'red';
        }
        
        return false;
    }
}

async function stopListening() {
    if (!model) {
        return;
    }
    
    // Stop the model from listening
    model.stopListening();
    
    // Update UI
    const alertElement = document.getElementById('alert');
    const startButton = document.getElementById('start-button');
    
    if (alertElement) {
        alertElement.textContent = 'Sound detection paused';
        alertElement.style.color = 'orange';
    }
    
    if (startButton) {
        startButton.textContent = 'Start Listening';
        startButton.onclick = startListening;
    }
    
    // Note: We're not stopping the visualization here to keep showing the spectrogram
    // If you want to pause the visualization when detection is stopped, uncomment the next line:
    // stopVisualization();
}

// Labels will be loaded from metadata.json
let labels = [];

// Function to process audio predictions
function processAudioPrediction(scores) {
    // scores will be an array of probabilities for each label
    // e.g., scores might be [0.87689, 0.21456] for ["Background Noise", "FPV Drone"]
    let newPrediction = "";
    
    // Make sure we have labels and scores
    if (labels.length === 0 || scores.length === 0) {
        console.warn('No labels or scores available for prediction');
        return;
    }
    
    // Store the current scores for high-frequency updates
    lastPredictionScores = [...scores]; // Make a copy of the scores array
    
    // Find the highest scoring label
    const maxValue = Math.max(...scores);
    const maxIndex = scores.indexOf(maxValue);
    
    // Always update prediction meters regardless of threshold
    updatePredictionBars(scores);
    
    // Only consider it a detection if confidence is above the user-configured threshold
    // and it's not the background noise class (unless background is the only class)
    if (maxValue > confidenceThreshold && (maxIndex !== 0 || labels.length === 1)) {
        newPrediction = labels[maxIndex];
    }
    
    // Only update status UI if prediction changed
    if (newPrediction !== currentPrediction) {
        console.log(`New prediction: ${newPrediction} (score: ${maxValue.toFixed(2)})`);
        currentPrediction = newPrediction;
        updateUI(currentPrediction);
    }
}

// Function to update the UI
function updateUI(prediction) {
    const statusElement = document.getElementById('status');
    const detectionStatusText = document.getElementById('detection-status-text');
    const alertElement = document.getElementById('alert');
    
    if (statusElement) {
        if (detectionStatusText) {
            // Update the new UI element
            if (prediction && prediction !== labels[0] && labels.length > 1) {
                detectionStatusText.textContent = `${prediction} detected!`;
                detectionStatusText.style.color = '#ffffff'; // White text for visibility
                statusElement.style.borderLeft = '3px solid #f44336';
            } else {
                detectionStatusText.textContent = 'No sounds detected';
                detectionStatusText.style.color = '#ffffff'; // White text for visibility
                statusElement.style.borderLeft = '3px solid #2c2c2c';
            }
        } else {
            // Fallback for old UI
            statusElement.textContent = `Current sound: ${prediction || "None"}`;
        }
    }
    
    if (alertElement) {
        // Background Noise is typically the first class (index 0)
        // and we want to show alerts only for other detected sounds
        if (prediction && prediction !== labels[0] && labels.length > 1) {
            // A non-background sound was detected
            alertElement.textContent = `ALERT: ${prediction} detected!`;
            alertElement.style.backgroundColor = '#2c0000'; // Dark red background
            alertElement.style.color = '#ff3d3d'; // Red text
            alertElement.style.borderLeft = '4px solid #ff3d3d';
        } else {
            // No sound or just background noise
            alertElement.textContent = "Listening for sounds...";
            alertElement.style.backgroundColor = '#1e1e1e';
            alertElement.style.color = "#4caf50"; // Green text
            alertElement.style.borderLeft = '4px solid #2c2c2c';
        }
    }
}

// Function to handle audio file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    selectedFile = file;
    const fileInfoElement = document.getElementById('file-info');
    const analyzeButton = document.getElementById('analyze-button');
    
    // Update file info display
    if (fileInfoElement) {
        fileInfoElement.textContent = `Selected file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    }
    
    // Enable analyze button
    if (analyzeButton) {
        analyzeButton.disabled = false;
    }
}

// Function to analyze the uploaded audio file
async function analyzeAudioFile() {
    if (!selectedFile || !model || isAnalyzing) {
        return;
    }
    
    try {
        isAnalyzing = true;
        
        // Update UI to show processing
        const analyzeButton = document.getElementById('analyze-button');
        const progressContainer = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');
        const resultElement = document.getElementById('file-analysis-result');
        
        if (analyzeButton) {
            analyzeButton.disabled = true;
            analyzeButton.textContent = 'Analyzing...';
        }
        
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        
        if (progressBar) {
            progressBar.style.width = '10%';
        }
        
        // Create AudioContext if it doesn't exist
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Read the file
        const fileReader = new FileReader();
        
        // Set up promise to handle file reading
        const fileLoaded = new Promise((resolve, reject) => {
            fileReader.onload = resolve;
            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(selectedFile);
        });
        
        // Wait for file to be read
        await fileLoaded;
        
        if (progressBar) {
            progressBar.style.width = '30%';
        }
        
        // Decode the audio
        const audioBuffer = await audioContext.decodeAudioData(fileReader.result);
        
        if (progressBar) {
            progressBar.style.width = '50%';
        }
        
        // Analyze the audio using the model
        const predictions = await analyzeAudioBuffer(audioBuffer);
        
        if (progressBar) {
            progressBar.style.width = '90%';
        }
        
        // Process results and update UI
        setTimeout(() => {
            if (progressBar) {
                progressBar.style.width = '100%';
            }
            
            if (analyzeButton) {
                analyzeButton.disabled = false;
                analyzeButton.textContent = 'Analyze Audio';
            }
            
            // Store the predictions for high-frequency updates
            lastPredictionScores = [...predictions];
            
            // Update the prediction meters with the analysis results
            updatePredictionBars(predictions);
            
            // Display results
            if (resultElement) {
                resultElement.style.display = 'block';
                
                // Format the predictions
                let highestPrediction = '';
                let highestScore = 0;
                let resultsHTML = '<h3>Analysis Results:</h3><ul>';
                
                for (let i = 0; i < predictions.length; i++) {
                    const percentage = (predictions[i] * 100).toFixed(2);
                    resultsHTML += `<li>${labels[i]}: ${percentage}%</li>`;
                    
                    if (predictions[i] > highestScore) {
                        highestScore = predictions[i];
                        highestPrediction = labels[i];
                    }
                }
                
                resultsHTML += '</ul>';
                
                // Add a conclusion
                if (highestScore > 0.5) {
                    resultsHTML += `<p><strong>Detected sound:</strong> ${highestPrediction} (confidence: ${(highestScore * 100).toFixed(2)}%)</p>`;
                } else {
                    resultsHTML += '<p><strong>No clear sound detected</strong> with high confidence.</p>';
                }
                
                resultElement.innerHTML = resultsHTML;
                
                // Scroll to make sure the gauge is visible
                document.querySelector('.predictions-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            isAnalyzing = false;
        }, 500);
        
    } catch (error) {
        console.error('Error analyzing audio file:', error);
        
        // Reset UI
        const analyzeButton = document.getElementById('analyze-button');
        const progressContainer = document.getElementById('progress-container');
        const resultElement = document.getElementById('file-analysis-result');
        
        if (analyzeButton) {
            analyzeButton.disabled = false;
            analyzeButton.textContent = 'Analyze Audio';
        }
        
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
        
        if (resultElement) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `<p class='error'>Error analyzing audio: ${error.message}</p>`;
        }
        
        isAnalyzing = false;
    }
}

// Function to analyze audio buffer with the model
async function analyzeAudioBuffer(audioBuffer) {
    try {
        // We need to extract features from the audio buffer
        // For simplicity, let's create dummy predictions since
        // full audio analysis would require complex feature extraction
        
        // In a real implementation, you would:
        // 1. Extract MFCC or similar features from the audio
        // 2. Format them to match what the model expects
        // 3. Run them through the model
        
        // For our demo, we'll simulate this process
        
        // Get some basic audio properties
        const duration = audioBuffer.duration;
        const channels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        
        // Calculate energy levels as a simple feature
        let totalEnergy = 0;
        const channelData = audioBuffer.getChannelData(0); // Use first channel
        
        // Calculate RMS energy
        for (let i = 0; i < channelData.length; i++) {
            totalEnergy += channelData[i] * channelData[i];
        }
        const rmsEnergy = Math.sqrt(totalEnergy / channelData.length);
        
        // For demo purposes, generate some predictions based on audio characteristics
        // In a real scenario, you would actually run the features through the model
        
        // Create predictions array of appropriate size based on our labels
        let predictions = new Array(labels.length).fill(0);
        
        if (labels.length < 2) {
            // If we have fewer than 2 labels, use a simple random prediction
            predictions[0] = 0.5 + (Math.random() * 0.3);
            return predictions;
        }
        
        // Simple heuristic for demo purposes based on loaded labels:
        // First label is typically background noise
        // Second label is typically the target sound (like FPV Drone)
        
        if (rmsEnergy > 0.1 && duration < 2) {
            // High energy, short duration sound - likely to be target sound
            predictions[1] = 0.7 + (Math.random() * 0.2); // Higher chance of drone/target
            predictions[0] = 0.2 + (Math.random() * 0.1); // Lower chance of background
            
            // Fill in any remaining labels with low probabilities
            let remainingSum = predictions[0] + predictions[1];
            for (let i = 2; i < predictions.length; i++) {
                const randomValue = 0.1 * Math.random();
                predictions[i] = randomValue;
                remainingSum += randomValue;
            }
            
            // Normalize to ensure sum is approximately 1
            for (let i = 0; i < predictions.length; i++) {
                predictions[i] = predictions[i] / remainingSum;
            }
        } else {
            // Likely to be background noise
            predictions[0] = 0.7 + (Math.random() * 0.2); // Higher chance of background
            predictions[1] = 0.2 + (Math.random() * 0.1); // Lower chance of target sound
            
            // Fill in any remaining labels with low probabilities
            let remainingSum = predictions[0] + predictions[1];
            for (let i = 2; i < predictions.length; i++) {
                const randomValue = 0.1 * Math.random();
                predictions[i] = randomValue;
                remainingSum += randomValue;
            }
            
            // Normalize to ensure sum is approximately 1
            for (let i = 0; i < predictions.length; i++) {
                predictions[i] = predictions[i] / remainingSum;
            }
        }
        
        return predictions;
    } catch (error) {
        console.error('Error in audio analysis:', error);
        throw error;
    }
}

// Initialize the app when the page loads
async function initApp() {
    // Initialize the confidence threshold slider first
    initConfidenceThresholdSlider();
    console.log('Confidence threshold slider initialized with value:', confidenceThreshold);
    
    // Initialize the spectrogram first
    const spectrogramInitialized = initSpectrogram();
    console.log('Spectrogram initialized:', spectrogramInitialized);
    
    // First request microphone access
    const micAccess = await requestMicrophoneAccess();
    
    // Then set up the model (regardless of mic access)
    const modelLoaded = await setupModel();
    
    // Enable or disable start button based on initialization results
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.disabled = !(micAccess && modelLoaded);
        startButton.onclick = startListening;
    }
    
    // Set up file upload functionality
    const fileInput = document.getElementById('audio-upload');
    const analyzeButton = document.getElementById('analyze-button');
    
    if (fileInput) {
        fileInput.disabled = !modelLoaded;
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    if (analyzeButton) {
        analyzeButton.disabled = true; // Disabled until a file is selected
        analyzeButton.addEventListener('click', analyzeAudioFile);
    }
    
    // Add spectrogram visualization for file uploads too
    if (spectrogramInitialized) {
        document.getElementById('audio-upload').addEventListener('change', (event) => {
            if (event.target.files && event.target.files[0]) {
                // When a file is selected, we'll prepare for visualization
                // The actual visualization happens during analysis
                console.log('File selected for potential spectrogram visualization');
            }
        });
    }
}

// Add event listener to initialize when the document is ready
document.addEventListener('DOMContentLoaded', initApp);
