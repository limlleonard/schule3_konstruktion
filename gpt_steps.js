let a = 0; // Initial value of a
let intervalId = null; // Variable to store the interval ID
const step = Math.PI / 12; // Step size
const maxValue = 2 * Math.PI; // Maximum value of a

// Get DOM elements
const valueDisplay = document.getElementById("value");
const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
const leftButton = document.getElementById("left");
const rightButton = document.getElementById("right");

// Update the displayed value of a
function updateDisplay() {
    valueDisplay.textContent = a.toFixed(2); // Display with 2 decimal places
}

// Start or restart the loop
startButton.addEventListener("click", () => {
    if (intervalId !== null) return; // Prevent multiple intervals
    intervalId = setInterval(() => {
        a += step;
        if (a >= maxValue) a -= maxValue; // Wrap around to 0 when exceeding maxValue
        updateDisplay();
    }, 1000);
});

// Pause the loop
pauseButton.addEventListener("click", () => {
    clearInterval(intervalId);
    intervalId = null; // Clear the interval ID
});

// Decrease a by step size
leftButton.addEventListener("click", () => {
    a -= step;
    if (a < 0) a += maxValue; // Wrap around to maxValue when below 0
    updateDisplay();
});

// Increase a by step size
rightButton.addEventListener("click", () => {
    a += step;
    if (a >= maxValue) a -= maxValue; // Wrap around to 0 when exceeding maxValue
    updateDisplay();
});

// Initialize the display
updateDisplay();
