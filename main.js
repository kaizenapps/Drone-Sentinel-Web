// Global variables
let microphoneEnabled = false;
let model = null;
let streaming = false;
let alarmAudio = null;
let isAlarmActive = false;
let isOffline = !navigator.onLine;
let customSounds = {};
let selectedAlarmSound = 'classic';
let dataArray = null;
let bufferLength = 0;

// Confidence threshold for detection (0.0 to 1.0)
let confidenceThreshold = 0.60; // Default confidence threshold

// Labels for the model (Background noise, FPV Drone)
const labels = ['Background', 'FPV Drone'];

// Initialize alarm audio system
function initAlarmAudio() {
    // Set up the audio element for the alarm
    alarmAudio = new Audio();
    alarmAudio.preload = 'auto';
    
    // Try to get the saved alarm sound preference from cookie
    const savedAlarmSound = getCookie('alarmSound');
    
    // Set the default sound source based on saved preference or default to classic
    selectedAlarmSound = savedAlarmSound || 'classic';
    
    // Load any saved custom sounds from localStorage
    loadCustomSounds();
    
    // Update the alarm source based on selection
    updateAlarmSource();
    
    // If there's a sound selector in the DOM, set its value
    const soundSelector = document.getElementById('alarm-sound-select');
    if (soundSelector && selectedAlarmSound) {
        soundSelector.value = selectedAlarmSound;
    }
    
    // Set up custom sound upload
    setupCustomSoundUpload();
    
    // Set up test sound button
    const testButton = document.getElementById('test-alarm-button');
    if (testButton) {
        testButton.addEventListener('click', testAlarmSound);
    }
    
    console.log('Alarm audio initialized with sound:', selectedAlarmSound);
}

// Update the alarm sound source
function updateAlarmSource() {
    if (!alarmAudio) return;
    
    let soundFile = '';
    
    // Check if it's a custom sound
    if (selectedAlarmSound.startsWith('custom_') && customSounds[selectedAlarmSound]) {
        // Use stored Blob URL for custom sounds
        soundFile = customSounds[selectedAlarmSound].url;
    } else {
        // Map standard sound selection to file name
        switch (selectedAlarmSound) {
            case 'classic':
                soundFile = 'sounds/classic_alarm.mp3';
                break;
            case 'siren':
                soundFile = 'sounds/siren.mp3';
                break;
            case 'buzzer':
                soundFile = 'sounds/buzzer.mp3';
                break;
            default:
                soundFile = 'sounds/classic_alarm.mp3';
        }
    }
    
    // Set the audio source
    alarmAudio.src = soundFile;
    
    // Load the audio
    alarmAudio.load();
}

// Function to set up the alarm sound selector
function setupAlarmSoundSelector() {
    const soundSelector = document.getElementById('alarm-sound-select');
    const testButton = document.getElementById('test-alarm-sound');
    
    if (!soundSelector || !testButton) {
        console.error('Alarm sound selector elements not found');
        return false;
    }
    
    // Set the initial selection
    for (let i = 0; i < soundSelector.options.length; i++) {
        if (soundSelector.options[i].value === selectedAlarmSound) {
            soundSelector.selectedIndex = i;
            break;
        }
    }
    
    // Add change event listener to the selector
    soundSelector.addEventListener('change', function() {
        selectedAlarmSound = this.value;
        updateAlarmSource();
        // Save selection to cookie
        setCookie('alarmSound', selectedAlarmSound, 30);
        console.log('Alarm sound changed to:', selectedAlarmSound);
    });
    
    // Add click event listener to the test button
    testButton.addEventListener('click', function() {
        testAlarmSound();
    });
    
    return true;
}

// Function to test the selected alarm sound
function testAlarmSound() {
    // Make sure we're not in the middle of a real alarm
    if (alarmActive) return;
    
    // Create a temporary audio element for testing
    const testAudio = new Audio(`sounds/${selectedAlarmSound}`);
    testAudio.volume = alarmVolume;
    
    // Play for just 2 seconds
    testAudio.play();
    setTimeout(() => {
        testAudio.pause();
        testAudio.currentTime = 0;
    }, 2000);
}

// Function to trigger the alarm when a drone is detected
function triggerAlarm(confidence) {
    // Don't trigger if already active
    if (alarmActive) return;
    
    alarmActive = true;
    
    // Update the alarm popup with the confidence level
    const confidenceElement = document.getElementById('alarm-confidence');
    if (confidenceElement) {
        confidenceElement.textContent = Math.round(confidence * 100);
    }
    
    // Show the alarm popup
    const alarmPopup = document.getElementById('alarm-popup');
    if (alarmPopup) {
        alarmPopup.style.display = 'block';
        // Add a short animation to make it more noticeable
        alarmPopup.classList.add('pulse');
        setTimeout(() => alarmPopup.classList.remove('pulse'), 1000);
    }
    
    // Play the alarm sound with robust error handling
    playAlarmSound();
    
    // Add alarm active class to body for additional visual cues
    document.body.classList.add('alarm-active');
    
    console.log('ALARM TRIGGERED with confidence:', confidence);
}

// Function to play alarm sound with robust error handling
function playAlarmSound() {
    if (!alarmSound) {
        alarmSound = document.getElementById('alarm-sound');
        if (!alarmSound) {
            console.error('Alarm sound element not found');
            return;
        }
    }
    
    // Reset the sound in case it was playing
    try {
        alarmSound.pause();
        alarmSound.currentTime = 0;
        alarmSound.volume = alarmVolume;
    } catch (e) {
        console.warn('Error resetting alarm sound:', e);
    }
    
    // Try to play the sound with promise-based error handling
    const playPromise = alarmSound.play();
    
    // Modern browsers return a promise from play()
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                console.log('Alarm sound playing...');
            })
            .catch(error => {
                console.error('Could not play alarm sound:', error);
                // Try alternative playback method if standard method fails
                setTimeout(() => {
                    try {
                        alarmSound.play();
                    } catch (e) {
                        console.error('Alternative playback also failed:', e);
                    }
                }, 100);
            });
    }
}

// Function to dismiss the alarm
function dismissAlarm() {
    if (!alarmActive) return;
    
    alarmActive = false;
    
    // Hide the alarm popup
    const alarmPopup = document.getElementById('alarm-popup');
    if (alarmPopup) {
        alarmPopup.style.display = 'none';
    }
    
    // Stop the alarm sound with error handling
    stopAlarmSound();
    
    // Remove alarm active class
    document.body.classList.remove('alarm-active');
    
    console.log('Alarm dismissed');
}

// Function to stop alarm sound
function stopAlarmSound() {
    if (!alarmSound) {
        alarmSound = document.getElementById('alarm-sound');
    }
    
    if (alarmSound) {
        try {
            alarmSound.pause();
            alarmSound.currentTime = 0;
        } catch (e) {
            console.warn('Error stopping alarm sound:', e);
        }
    }
}

// Snooze functionality has been removed

// Initialize the app when the page loads
async function initApp() {
    // Set up offline detection
    setupOfflineDetection();
    
    // Initialize the confidence threshold slider first
    initConfidenceThresholdSlider();
    console.log('Confidence threshold slider initialized with value:', confidenceThreshold);
    
    // Initialize alarm audio system
    initAlarmAudio();
    console.log('Alarm audio system initialized');
    
    // Add global functions for the alarm system
    window.dismissAlarm = dismissAlarm;
    
    // Add function to open test page
    window.openTestPage = function() {
        window.open('test.html', 'DroneTestWindow', 'width=800,height=800,resizable=yes,scrollbars=yes');
    };
    
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
    
    // Set up language translations support
    if (typeof window.i18n !== 'undefined') {
        console.log('i18n system detected');
        
        // Register callback to update dynamic UI elements when language changes
        document.addEventListener('languageChanged', function(event) {
            // Update UI elements with new language
            updateLanguageSpecificElements();
            console.log(`Language changed to ${event.detail.language}, updating dynamic UI elements`);
        });
    }
}

// Set up offline detection and handling
function setupOfflineDetection() {
    const offlineIndicator = document.getElementById('offline-indicator');
    
    // Update the offline indicator based on current status
    if (offlineIndicator) {
        if (isOffline) {
            offlineIndicator.classList.add('visible');
        } else {
            offlineIndicator.classList.remove('visible');
        }
    }
    
    // Listen for online/offline events
    window.addEventListener('online', function() {
        isOffline = false;
        if (offlineIndicator) {
            offlineIndicator.classList.remove('visible');
            
            // Show a notification that we're back online
            const message = window.i18n ? window.i18n.t('reconnected') : 'Back online';
            showNotification(message, 3000);
        }
        console.log('Back online');
    });
    
    window.addEventListener('offline', function() {
        isOffline = true;
        if (offlineIndicator) {
            offlineIndicator.classList.add('visible');
        }
        console.log('Offline mode');
    });
    
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'CACHE_UPDATED') {
                // Show notification that the app is cached for offline use
                const message = window.i18n ? window.i18n.t('appCached') : 'App cached for offline use';
                showNotification(message, 3000);
            }
        });
    }
}

// Show a temporary notification to the user
function showNotification(message, duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.bottom = '60px';
    notification.style.right = '10px';
    notification.style.backgroundColor = '#333';
    notification.style.color = '#e0e0e0';
    notification.style.padding = '10px 15px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.zIndex = '1001';
    notification.style.transition = 'opacity 0.5s';
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after duration
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, duration);
}
    
    // Add spectrogram visualization for file uploads too
    if (spectrogramInitialized) {
        const audioUpload = document.getElementById('audio-upload');
        if (audioUpload) {
            audioUpload.addEventListener('change', (event) => {
                if (event.target.files && event.target.files[0]) {
                    // When a file is selected, we'll prepare for visualization
                    // The actual visualization happens during analysis
                    console.log('File selected for potential spectrogram visualization');
                }
            });
        }
    }
    
    // Alarm sound selection integration
    const alarmSoundSelect = document.getElementById('alarm-sound-select');
    if (alarmSoundSelect) {
        alarmSoundSelect.addEventListener('change', (event) => {
            selectedAlarmSound = event.target.value;
            // Update alarm source with new sound
            updateAlarmSource();
            // Save preference
            setCookie('alarmSound', selectedAlarmSound, 30);
        });
    }
}

// Add event listener to initialize when the document is ready
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Updates dynamic UI elements that need translation after language change
 */
function updateLanguageSpecificElements() {
    // Check if i18n system is available
    if (!window.i18n) return;
    
    // Update gauge label based on current state
    const gaugeLabel = document.getElementById('gauge-label');
    const gaugeValue = document.getElementById('gauge-value');
    
    if (gaugeLabel && gaugeValue) {
        const percentageText = gaugeValue.textContent || '0%';
        const percentage = parseFloat(percentageText);
        
        if (percentage > 60) {
            gaugeLabel.textContent = window.i18n.t('droneDetected');
        } else if (percentage > 30) {
            gaugeLabel.textContent = window.i18n.t('possibleDrone');
        } else {
            gaugeLabel.textContent = window.i18n.t('listening');
        }
    }
    
    // Update start/stop button text
    const startButton = document.getElementById('start-button');
    if (startButton) {
        const textSpan = startButton.querySelector('.button-text');
        if (textSpan) {
            const isListening = microphoneEnabled;
            textSpan.textContent = isListening ? 
                window.i18n.t('stopDetection') : 
                window.i18n.t('startDetection');
        }
    }
    
    // Update alarm sound selector label
    const alarmSoundLabel = document.querySelector('label[for="alarm-sound-select"]');
    if (alarmSoundLabel) {
        alarmSoundLabel.textContent = window.i18n.t('alarmSound');
    }
    
    // Update alarm test button
    const testButton = document.getElementById('test-alarm-button');
    if (testButton) {
        testButton.textContent = window.i18n.t('testAlarm');
    }
    
    console.log('Dynamic UI elements updated with new language');
}
