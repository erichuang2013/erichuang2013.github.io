let inputA, inputB, inputC;
let spanA, spanB, spanC; // Added for value display
let canvas;

const canvasWidth = 600;
const canvasHeight = 450;

// Define graph ranges
const xMin = -10;
const xMax = 10;
const yMin = -30;
const yMax = 30;

function setup() {
    canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvasContainer');

    // Get input elements (sliders)
    inputA = select('#a');
    inputB = select('#b');
    inputC = select('#c');

    // Get span elements for displaying values
    spanA = select('#aValue');
    spanB = select('#bValue');
    spanC = select('#cValue');

    // Set initial span values from sliders
    spanA.html(inputA.value());
    spanB.html(inputB.value());
    spanC.html(inputC.value());

    // Redraw when inputs change and update span values
    inputA.input(() => {
        spanA.html(inputA.value());
        drawGraph();
    });
    inputB.input(() => {
        spanB.html(inputB.value());
        drawGraph();
    });
    inputC.input(() => {
        spanC.html(inputC.value());
        drawGraph();
    });

    // Initial draw
    drawGraph();
}

function drawGraph() {
    background(255); // White background

    let a = parseFloat(inputA.value());
    let b = parseFloat(inputB.value());
    let c = parseFloat(inputC.value());

    if (abs(a) < 0.00001) { // Check if a is effectively zero
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
