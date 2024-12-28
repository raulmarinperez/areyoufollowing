// Global variables
//

let message = "";
let currentParticipant = "";
let originalParticipants = [];
let outstandingParticipants = [];
let shift = 30; // time a name shows up (30 seconds by default)

let timeRemaining = 0;

let timerTimeout = 0;
let istimerTimeoutRunning = false;

let nameInterval = 0;
let isNameIntervalRunning = false;

// Auxiliary functions
//

function processImprov(json, participantsLabel, headerText) {
  // Grab the relevant keys: participants, message and shift 
  if ('participants' in json) {
    originalParticipants = Array.from(json.participants);
    participantsLabel.textContent = `There are ${originalParticipants.length} participants`;
  }
  if ('message' in json)
    headerText.textContent = message = json.message;
  if ('shift' in json)
    shift = json.shift;
}

function enableSkipButton(skipButton) {
  skipButton.disabled = false; 
}

function disableSkipButton(skipButton) {
  skipButton.disabled = true; 
}

function enableOutstandingButton(outstandingButton) {
  outstandingButton.disabled = false; 
}

// Buttons initialization functions
//

function initialize_startButton(startButton, skipButton, outstandingButton, fileInputButton, durationInput, progressRing, progressText, namesLabel) {
  // duration setup callback function - check conditions to enable/disable the start button
  durationInput.addEventListener('input', function() {
    enableStartButton(startButton, durationInput.value, originalParticipants);
  });

  // start button's click callback function
  startButton.addEventListener("click", function () {
    let duration = parseInt(durationInput.value, 10);

    if (istimerTimeoutRunning) {
      disableSkipButton(skipButton);
      stoptimerTimeout(startButton, fileInputButton);
      stopNameInterval();
      outstandingParticipants.push(currentParticipant) // reintroduce current participant for future plays
    } 
    else {
      starttimerTimeout(startButton, fileInputButton, progressRing, progressText, duration, namesLabel);
      startNameInterval();
      pickUpParticipant(); // pick up the first one now!
      enableSkipButton(skipButton);
      enableOutstandingButton(outstandingButton);
    }
  });

  // skip button's click callback function
  skipButton.addEventListener("click", function () {
    let duration = parseInt(durationInput.value, 10);

    if (istimerTimeoutRunning) {
      stopNameInterval();
      outstandingParticipants.push(currentParticipant) // reintroduce current participant for future plays
      nameInterval = setInterval(pickUpParticipant, shift*1000);
      pickUpParticipant(); // pick up the first one now!
    }
  });
}

function initialize_outstandingButton(outstandingButton) {
  // click callback function
  outstandingButton.addEventListener("click", function () {
    const outstandingExport = {
      "message": message,
      "shift": shift,
      "participants": outstandingParticipants
    }

    // Convert JSON object to string and then a Blob to download
    const jsonString = JSON.stringify(outstandingExport, null, 2); // Pretty-print with 2 spaces
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create a link element which will force the download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "outstanding-elements.json";
    link.click();

    // Clean up by revoking the Blob URL
    URL.revokeObjectURL(link.href);
  });
}

function initialize_fileInputButton(fileInput, startButton, durationInput, participantsLabel, headerText) {
  fileInput.addEventListener('change', () => {

    file = (fileInput.files && fileInput.files[0]) ? fileInput.files[0] : null;
    if (file && file.type === 'application/json') {

      const reader = new FileReader();
        
      reader.onload = function(e) {
        try {
          const json = JSON.parse(e.target.result);
          console.log('JSON data:', json);
          // Process the JSON data
          processImprov(json, participantsLabel, headerText);
          // check conditions to enable/disable the start button
          enableStartButton(startButton, durationInput.value, originalParticipants);
        } catch (error) {
          console.error('Invalid JSON file:', error);
        }
      };
          
      reader.readAsText(file);
    } else {
        alert("Please upload a valid JSON file.");
    }
  });
}

function initialize_progressText(progressText, durationInput) {
  durationInput.addEventListener('input', function() {
    progressText.textContent = `${durationInput.value} s`;
  });
}

// Timer related functions
//

function enableStartButton(startButton, duration, participants) {
  // Timer can be started if: (1) there are participants loaded, (2) a duration is set up
  startButton.disabled =  isNaN(duration) || duration <= 0 || participants.length == 0;
}

function updateCountdown(fileInputButton, progressRing, progressText, duration, namesLabel) {
    // Timer related variables
    timeRemaining = duration;
    let progress =  0;
    let step = 1/duration;
    // Progress ring related variables
    let radius = progressRing.r.baseVal.value;
    let circumference = 2 * Math.PI * radius;

    function countdown() {
        setProgress(progress, progressRing, circumference, progressText, timeRemaining);
        progress += step;

        if (timeRemaining > 0) {
            timerTimeout = setTimeout(countdown, 1000);
        } else {
            // Timer has ended
            istimerTimeoutRunning = false;
            startButton.textContent = "Start Timer";
            startButton.classList.remove("stop");
            fileInputButton.classList.remove('disabled');
            progressRing.style.stroke = "#B22222";
            stopNameInterval();
            namesLabel.textContent = "That was all! Well done!";
        }

        timeRemaining--;
    }

    setProgress(0, progressRing, circumference, progressText, duration); // Reset progress
    countdown();
}

function setProgress(progress, progressRing, circumference, progressText, remainingSeconds) {
  // progress has to be a ratio going from 0 to 1.
  progressRing.style.stroke = "#4caf50";

  progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
  progressRing.style.strokeDashoffset = circumference;

  const offset = circumference - progress * circumference;
  progressRing.style.strokeDashoffset = offset;

  progressText.textContent =  `${remainingSeconds} s`;
}

function stoptimerTimeout(startButton, fileInputButton) {
  clearTimeout(timerTimeout); // Stop the timer
  istimerTimeoutRunning = false;
  startButton.textContent = "Start Timer";
  startButton.classList.remove("stop");
  fileInputButton.classList.remove('disabled');
}

function stopNameInterval() {
  clearInterval(nameInterval); // Stop the timer
  isNameIntervalRunning = false;
}

function starttimerTimeout(startButton, fileInputButton, progressRing, progressText, duration, namesLabel) {
  if (isNaN(duration) || duration <= 0) {
    alert("Please enter a valid number greater than 0.");
    return;
  }
  updateCountdown(fileInputButton, progressRing, progressText, duration, namesLabel);
  istimerTimeoutRunning = true;
  startButton.textContent = "Stop Timer";
  startButton.classList.add("stop");
  fileInputButton.classList.add('disabled');
}

function startNameInterval() {
  outstandingParticipants = Array.from(originalParticipants);
  nameInterval = setInterval(pickUpParticipant, shift*1000); 
}

function pickUpParticipant() {
  const namesLabel = document.getElementById("namesBox");

  if (outstandingParticipants.length > 0) {
    // Short list before pick an element up from the end (pop)
    outstandingParticipants.sort(() => Math.random() - 0.5);
    // Get the element where names show up & replace content with current participant
    namesLabel.textContent = currentParticipant = outstandingParticipants.pop();
  }
  else if (outstandingParticipants.length == 0)
    namesLabel.textContent = "We're done!";
}

// Main section
//

document.addEventListener("DOMContentLoaded", function () {
  // Reference to the GUI elements
  const durationInput = document.getElementById("timerInput");
  const startButton = document.getElementById("startButton");
  const skipButton = document.getElementById("skipButton");
  const outstandingButton = document.getElementById("getParticipantsButton");
  const progressRing = document.querySelector(".progress-ring__circle");
  const progressText = document.querySelector(".progress-ring__text");
  const fileInput = document.getElementById("fileInput");
  const fileInputButton = document.querySelector(".file-upload-button");
  const participantsLabel = document.getElementById("participantsNumber");
  const headerText = document.querySelector(".header-text");
  const namesLabel = document.getElementById("namesBox");
  
  // Buttons initialization
  initialize_startButton(startButton, skipButton, outstandingButton, fileInputButton, durationInput, progressRing, progressText, namesLabel);
  initialize_outstandingButton(outstandingButton);
  initialize_fileInputButton(fileInput, startButton, durationInput, participantsLabel, headerText);
  initialize_progressText(progressText, durationInput);  
});

