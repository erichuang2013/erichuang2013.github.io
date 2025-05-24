let magnets = [];
let particles = [];
let draggedMagnet = null; // Which magnet is currently being dragged
let activeMagnetIndex = 0; // Index of magnet controlled by keyboard (rotation, flipping)

// Removed const NUM_PARTICLES, will be controlled by slider
const MAGNET_WIDTH = 120;
const MAGNET_HEIGHT = 40;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const ROTATION_SPEED = 0.05; // Radians per key press

// Colors for field strength visualization
let coolColor;
let warmColor;
let minObservedStrength = 0; // Dynamically updated
let maxObservedStrength = 1; // Dynamically updated, start with a non-zero range

// Slider control variables
let particleSlider;
let particleCountDisplay;
let targetParticleCount; 

function setup() {
    canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent('canvas-container');
    background(230); // This will be HSB gray if called after colorMode(HSB)
    
    // Switch to HSB color mode for smoother/wider spectrum color transitions
    // Hue: 0-360, Saturation: 0-100, Brightness: 0-100, Alpha: 0-100
    colorMode(HSB, 360, 100, 100, 100);
    
    // Re-set background after changing colorMode to ensure correct gray
    background(0, 0, 90); // HSB light gray (Hue 0, Sat 0, Bri 90)


    // Create two magnets
    magnets.push(new Magnet(width / 2 - 150, height / 2, MAGNET_WIDTH, MAGNET_HEIGHT, "Magnet 1"));
    magnets.push(new Magnet(width / 2 + 150, height / 2, MAGNET_WIDTH, MAGNET_HEIGHT, "Magnet 2"));

    particles = []; // Initialize empty particle array
    
    // Setup slider and particle count display
    particleSlider = select('#particleSlider');
    particleCountDisplay = select('#particleCountDisplay');
    
    targetParticleCount = particleSlider.value(); // Get initial value from slider
    particleCountDisplay.html(targetParticleCount); // Update display
    particleSlider.input(onParticleSliderChange); // Attach event listener

    adjustParticles(); // Create initial particles based on slider

    // Initial update for pole locations
    magnets.forEach(m => m.updatePoleAbsLocations());

    // Initialize colors using HSB
    // Cool color: Vibrant Blue (Hue 240)
    coolColor = color(240, 80, 90); 
    // Warm color: Vibrant Red (Hue 0)
    warmColor = color(0, 90, 100); 
}

// Function to adjust particle count based on slider
function adjustParticles() {
    let currentCount = particles.length;
    if (targetParticleCount > currentCount) {
        // Add particles
        for (let i = 0; i < targetParticleCount - currentCount; i++) {
            particles.push(new Particle(random(width), random(height)));
        }
    } else if (targetParticleCount < currentCount) {
        // Remove particles
        particles.splice(targetParticleCount, currentCount - targetParticleCount);
    }
}

// Event handler for particle slider change
function onParticleSliderChange() {
    targetParticleCount = particleSlider.value();
    if (particleCountDisplay) {
        particleCountDisplay.html(targetParticleCount);
    }
    adjustParticles();
}


function draw() {
    background(0, 0, 90); // HSB light gray, Hue 0, Sat 0, Bri 90

    magnets.forEach(magnet => {
        magnet.update();
        magnet.display();
    });

    // First, update all particles' field strengths
    for (let particle of particles) {
        particle.update(magnets);
    }

    // Dynamically determine min/max strength for current frame's particles
    if (particles.length > 0) {
        let currentFrameMinStrength = Infinity;
        let currentFrameMaxStrength = 0; // Start at 0, as strength can't be negative
        for (let particle of particles) {
            currentFrameMinStrength = min(currentFrameMinStrength, particle.fieldStrength);
            currentFrameMaxStrength = max(currentFrameMaxStrength, particle.fieldStrength);
        }
        minObservedStrength = currentFrameMinStrength;
        maxObservedStrength = currentFrameMaxStrength;

        // Handle case where all strengths are identical or zero to prevent map() issues
        if (maxObservedStrength === minObservedStrength) {
            maxObservedStrength = minObservedStrength + 0.1; // Add a small epsilon
        }
         if (maxObservedStrength === 0) { // If all are zero
            maxObservedStrength = 0.1; // Prevent division by zero if all strengths are truly 0
        }
    }


    // Then, display all particles using the updated strength range
    for (let particle of particles) {
        particle.display();
    }

    // Highlight the active magnet
    if (magnets[activeMagnetIndex]) {
        magnets[activeMagnetIndex].highlight();
    }
    
    // Display controls legend
    // Set fill color in current mode (HSB) - e.g., a dark gray
    fill(0, 0, 20); // Hue 0, Sat 0, Brightness 20 (Dark Gray)
    noStroke();
    textSize(12);
    textAlign(LEFT, TOP);
    text(`Active Magnet: ${magnets[activeMagnetIndex].label}\nControls:\n- Click & Drag: Move magnets\n- LEFT/RIGHT Arrows: Rotate active magnet\n- TAB: Switch active magnet\n- 'F': Flip active magnet's poles`, 10, 10);
}

function mousePressed() {
    draggedMagnet = null; // Reset dragged magnet
    // Check magnets in reverse order so top ones are picked first
    for (let i = magnets.length - 1; i >= 0; i--) {
        if (magnets[i].isMouseOver()) {
            draggedMagnet = magnets[i];
            draggedMagnet.mousePressed();
            activeMagnetIndex = i; // Clicking a magnet also makes it active
            break;
        }
    }
}

function mouseDragged() {
    if (draggedMagnet) {
        draggedMagnet.mouseDragged();
    }
}

function mouseReleased() {
    if (draggedMagnet) {
        draggedMagnet.mouseReleased();
    }
    draggedMagnet = null;
}

function keyPressed() {
    if (keyCode === LEFT_ARROW) {
        magnets[activeMagnetIndex].rotate(-ROTATION_SPEED);
    } else if (keyCode === RIGHT_ARROW) {
        magnets[activeMagnetIndex].rotate(ROTATION_SPEED);
    } else if (keyCode === TAB) {
        activeMagnetIndex = (activeMagnetIndex + 1) % magnets.length;
    } else if (key === 'f' || key === 'F') {
        magnets[activeMagnetIndex].flipPoles();
    }
}

class Magnet {
    constructor(x, y, w, h, label) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.angle = 0;
        this.label = label;
        this.dragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.polarityMultiplier = 1; // 1 for normal, -1 for flipped

        // Relative positions of poles from the center of the magnet.
        // These define the "physical" ends.
        this.physicalEnd1 = { x: -this.width / 2, y: 0 }; // Left end
        this.physicalEnd2 = { x: this.width / 2, y: 0 };  // Right end

        this.absPoleNorth = { x: 0, y: 0 };
        this.absPoleSouth = { x: 0, y: 0 };
        this.updatePoleAbsLocations();
    }

    updatePoleAbsLocations() {
        // Determine which physical end is North and which is South based on polarityMultiplier
        let relNorth = (this.polarityMultiplier === 1) ? this.physicalEnd2 : this.physicalEnd1;
        let relSouth = (this.polarityMultiplier === 1) ? this.physicalEnd1 : this.physicalEnd2;

        // North Pole
        this.absPoleNorth.x = this.x + relNorth.x * cos(this.angle) - relNorth.y * sin(this.angle);
        this.absPoleNorth.y = this.y + relNorth.x * sin(this.angle) + relNorth.y * cos(this.angle);

        // South Pole
        this.absPoleSouth.x = this.x + relSouth.x * cos(this.angle) - relSouth.y * sin(this.angle);
        this.absPoleSouth.y = this.y + relSouth.x * sin(this.angle) + relSouth.y * cos(this.angle);
    }

    flipPoles() {
        this.polarityMultiplier *= -1;
        this.updatePoleAbsLocations(); // Poles' absolute positions need to be recalculated
    }
    
    rotate(deltaAngle) {
        this.angle += deltaAngle;
        this.updatePoleAbsLocations();
    }

    update() {
        // Called in draw loop, mainly to update pole locations if dragging
        if (this.dragging) {
             this.updatePoleAbsLocations();
        }
    }
    
    highlight() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        noFill();
        stroke(255, 204, 0, 150); // Yellow highlight
        strokeWeight(4);
        rectMode(CENTER);
        rect(0, 0, this.width + 8, this.height + 8, 5); // Slightly larger rectangle with rounded corners
        pop();
    }

    display() {
        this.updatePoleAbsLocations(); // Ensure poles are correct before drawing (e.g. after flip)
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        rectMode(CENTER);
        stroke(0);
        strokeWeight(1);

        let northLabel = "N";
        let southLabel = "S";
        // Define magnet pole colors in current mode (HSB)
        // Note: color() calls inside display() will now use HSB unless p5.js internally handles it,
        // or we switch mode. Best to define them in HSB if colorMode is HSB.
        // However, for fixed iconic colors like magnet poles, it's often simpler to keep them RGB
        // and define them once, or switch colorMode briefly.
        // For simplicity, let's define them directly in HSB here.
        // Red for North: Hue 0, Sat 100, Bri 100
        // Blue for South: Hue 240, Sat 100, Bri 100
        let northColorHSB = color(0, 100, 100); 
        let southColorHSB = color(240, 100, 100);

        let leftPoleColor = (this.polarityMultiplier === 1) ? southColorHSB : northColorHSB;
        let rightPoleColor = (this.polarityMultiplier === 1) ? northColorHSB : southColorHSB;
        let leftPoleLabel = (this.polarityMultiplier === 1) ? southLabel : northLabel;
        let rightPoleLabel = (this.polarityMultiplier === 1) ? northLabel : southLabel;

        // Left half
        fill(leftPoleColor);
        rect(-this.width / 4, 0, this.width / 2, this.height);
        fill(0, 0, 100); // HSB White for text
        textSize(this.height * 0.5);
        textAlign(CENTER, CENTER);
        text(leftPoleLabel, -this.width / 4, 0);

        // Right half
        fill(rightPoleColor);
        rect(this.width / 4, 0, this.width / 2, this.height);
        fill(0, 0, 100); // HSB White for text
        text(rightPoleLabel, this.width / 4, 0);
        
        // Outline the whole magnet
        noFill();
        stroke(0);
        rect(0, 0, this.width, this.height);

        // Display Magnet Label
        // Text color should also be HSB-aware if we want it consistent, or set explicitly.
        // fill(0,0,0) would be black in HSB.
        pop(); // Pop matrix before drawing label text relative to magnet's original frame

        push(); // New drawing state for label
        translate(this.x, this.y - this.height/2 - 10); // Position above the magnet
        fill(0, 0, 20); // Dark Gray for label text (HSB)
        noStroke();
        textSize(12);
        textAlign(CENTER, BOTTOM);
        text(this.label, 0, 0);
        pop();
    }

    isMouseOver() {
        let mX = mouseX - this.x;
        let mY = mouseY - this.y;
        let rotatedMX = mX * cos(-this.angle) - mY * sin(-this.angle);
        let rotatedMY = mX * sin(-this.angle) + mY * cos(-this.angle);
        return (rotatedMX > -this.width / 2 && rotatedMX < this.width / 2 &&
                rotatedMY > -this.height / 2 && rotatedMY < this.height / 2);
    }

    mousePressed() {
        if (this.isMouseOver()) { // Should be guaranteed by caller now
            this.dragging = true;
            this.offsetX = this.x - mouseX;
            this.offsetY = this.y - mouseY;
        }
    }

    mouseDragged() {
        if (this.dragging) {
            this.x = mouseX + this.offsetX;
            this.y = mouseY + this.offsetY;
            this.updatePoleAbsLocations();
        }
    }

    mouseReleased() {
        this.dragging = false;
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.len = 8; 
        this.angle = 0;
        this.fieldStrength = 0; // Initialize field strength
    }

    update(magnets) { // Expects an array of magnet objects
        let netBx = 0;
        let netBy = 0;
        const poleStrength = 20000; // Adjusted strength
        const minDistanceSq = 60*60; // Min distance to avoid extreme forces, squared

        for (const magnet of magnets) {
            // Field from North pole of current magnet
            let dirN_x = this.x - magnet.absPoleNorth.x;
            let dirN_y = this.y - magnet.absPoleNorth.y;
            let dSqN = dirN_x * dirN_x + dirN_y * dirN_y;
            dSqN = max(dSqN, minDistanceSq);
            let B_N_mag = poleStrength / dSqN; 
            // Field lines go AWAY from North
            netBx += (dirN_x / sqrt(dSqN)) * B_N_mag;
            netBy += (dirN_y / sqrt(dSqN)) * B_N_mag;

            // Field from South pole of current magnet
            let dirS_x = this.x - magnet.absPoleSouth.x;
            let dirS_y = this.y - magnet.absPoleSouth.y;
            let dSqS = dirS_x * dirS_x + dirS_y * dirS_y;
            dSqS = max(dSqS, minDistanceSq);
            let B_S_mag = poleStrength / dSqS;
            // Field lines go TOWARDS South
            netBx -= (dirS_x / sqrt(dSqS)) * B_S_mag;
            netBy -= (dirS_y / sqrt(dSqS)) * B_S_mag;
        }

        // Calculate field strength (magnitude of the net field vector)
        this.fieldStrength = sqrt(netBx * netBx + netBy * netBy);

        if (netBx !== 0 || netBy !== 0) {
            this.angle = atan2(netBy, netBx);
        } else {
            // If no field, maintain previous angle or set to 0
            // this.angle = 0; // or keep current this.angle
            // Field strength is already 0 if netBx and netBy are 0
        }
    }

    display() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);

        let normalizedStrength = 0;
        if (maxObservedStrength > minObservedStrength) { // Avoid division by zero if range is zero
             normalizedStrength = map(this.fieldStrength, minObservedStrength, maxObservedStrength, 0, 1);
        } else if (maxObservedStrength > 0) { // If all strengths are the same but non-zero
            normalizedStrength = 1; // Make them all warm color
        }
        // If all strengths are zero, normalizedStrength remains 0 (coolColor)

        normalizedStrength = constrain(normalizedStrength, 0, 1);
        let particleColor = lerpColor(coolColor, warmColor, normalizedStrength);
        
        // Optional: vary stroke weight based on strength
        let sw = map(normalizedStrength, 0, 1, 1, 2.5);
        sw = constrain(sw, 1, 2.5);

        stroke(particleColor);
        strokeWeight(sw);
        line(-this.len / 2, 0, this.len / 2, 0);
        pop();
    }
}
