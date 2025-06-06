let inputA, inputB, inputC;
let canvas;

const canvasWidth = 600;
const canvasHeight = 450; // Adjusted to better fit y-range -30 to 30 with x-range -10 to 10

// Define graph ranges
const xMin = -10;
const xMax = 10;
const yMin = -30;
const yMax = 30;

function setup() {
    canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvasContainer');

    // Get input elements
    inputA = select('#a');
    inputB = select('#b');
    inputC = select('#c');

    // Redraw when inputs change
    inputA.input(drawGraph);
    inputB.input(drawGraph);
    inputC.input(drawGraph);

    // Initial draw
    drawGraph();
}

function drawGraph() {
    background(255); // White background

    // Get current coefficient values
    let a = parseFloat(inputA.value());
    let b = parseFloat(inputB.value());
    let c = parseFloat(inputC.value());

    // Validate 'a' to ensure it's not zero for a quadratic equation
    if (a === 0) {
        // Display a message or handle as a linear equation if desired
        // For now, we'll just not draw if a is 0, or draw a straight line
        // For simplicity, let's ensure 'a' is not treated as 0 if the input is "0" but allow small non-zero values
        if (abs(a) < 0.00001) { // Check if a is effectively zero
             // Draw Axes and Grid anyway
            drawAxesAndGrid();
            fill(255, 0, 0);
            textAlign(CENTER, CENTER);
            textSize(16);
            text("Coefficient 'a' cannot be exactly zero for a parabola.", canvasWidth / 2, canvasHeight / 2);
            return;
        }
    }


    // Draw Axes and Grid
    drawAxesAndGrid();

    // Plot Parabola
    stroke(255, 69, 0); // Red color #FF4500
    strokeWeight(2);
    noFill();

    beginShape();
    for (let x = xMin; x <= xMax; x += 0.2) {
        let y = a * x * x + b * x + c;
        // Map graph coordinates to canvas coordinates
        let canvasX = map(x, xMin, xMax, 0, canvasWidth);
        let canvasY = map(y, yMin, yMax, canvasHeight, 0); // y is inverted
        vertex(canvasX, canvasY);
    }
    endShape();

    // Titles and Labels
    drawTitlesAndLabels(a,b,c);
}

function drawAxesAndGrid() {
    push(); // Isolate coordinate transformations

    // Draw grid lines
    stroke(200); // Light grey for grid
    strokeWeight(0.5);

    // Vertical grid lines & X-axis labels
    for (let x = xMin; x <= xMax; x += 2) { // Adjust step for clarity
        let canvasX = map(x, xMin, xMax, 0, canvasWidth);
        line(canvasX, 0, canvasX, canvasHeight);
        if (x !== 0) { // Don't overlap y-axis label for 0
            fill(100);
            noStroke();
            textAlign(CENTER, TOP);
            text(x, canvasX, map(0, yMin, yMax, canvasHeight, 0) + 5);
        }
    }

    // Horizontal grid lines & Y-axis labels
    for (let y = yMin; y <= yMax; y += 10) { // Adjust step for clarity
        let canvasY = map(y, yMin, yMax, canvasHeight, 0);
        line(0, canvasY, canvasWidth, canvasY);
         if (y !== 0) { // Don't overlap x-axis label for 0
            fill(100);
            noStroke();
            textAlign(RIGHT, CENTER);
            text(y, map(0, xMin, xMax, 0, canvasWidth) - 5, canvasY);
        }
    }

    // Draw main axes (thicker and darker)
    stroke(0); // Black for axes
    strokeWeight(1.5);
    // X-axis
    line(0, map(0, yMin, yMax, canvasHeight, 0), canvasWidth, map(0, yMin, yMax, canvasHeight, 0));
    // Y-axis
    line(map(0, xMin, xMax, 0, canvasWidth), 0, map(0, xMin, xMax, 0, canvasWidth), canvasHeight);
    
    // Origin label "0"
    fill(0);
    noStroke();
    textAlign(LEFT, TOP);
    text("0", map(0, xMin, xMax, 0, canvasWidth) + 5, map(0, yMin, yMax, canvasHeight, 0) + 5);


    pop(); // Restore original drawing settings
}

function drawTitlesAndLabels(a,b,c) {
    fill(0); // Black for text
    noStroke();
    textAlign(CENTER, TOP);
    textSize(14);

    // Chart Title (already in HTML, but can be dynamic here if needed)
    // text(`二元二次方程式：y = ${a}x² + ${b}x + ${c}`, canvasWidth / 2, 10);

    // Axis Labels
    textSize(12);
    textAlign(CENTER, BOTTOM);
    text("x", canvasWidth / 2, canvasHeight - 5);

    textAlign(LEFT, CENTER);
    // Need to rotate text for y-axis label or place it differently
    push();
    let yLabelX = 20;
    let yLabelY = canvasHeight / 2;
    translate(yLabelX, yLabelY);
    rotate(-HALF_PI);
    textAlign(CENTER, BOTTOM);
    text("y", 0, 0);
    pop();
}

// Initial call to draw the graph when script loads
// (setup will call drawGraph, so this might be redundant, but ensures it if setup is delayed)
// if (typeof drawGraph === "function") drawGraph();
