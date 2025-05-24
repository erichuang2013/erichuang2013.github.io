// main.js - Three.js scene setup for Virus Attack Simulation

// Ensure THREE is loaded (it should be globally available from the CDN)
if (typeof THREE === 'undefined') {
    console.error('THREE.js has not been loaded. Check the script tag in index.html.');
    // Potentially stop execution or alert the user
}

// 1. Three.js components (assuming THREE is global)
const WebGLRenderer = THREE.WebGLRenderer;
const Scene = THREE.Scene;
const PerspectiveCamera = THREE.PerspectiveCamera;
const AmbientLight = THREE.AmbientLight;
const DirectionalLight = THREE.DirectionalLight;

// 2. OrbitControls (assuming THREE.OrbitControls is available)
const OrbitControls = THREE.OrbitControls;

// Variables
let renderer, scene, camera, controls;
let raycaster, mouse;
let infectionOrigin = null; // To store the THREE.Vector3 of the infection point
const infectionMarkers = []; // To store visual markers of infection
let bodyMesh; // Ensure bodyMesh is accessible
let infectionEnabled = false; // State variable for infection mode
let currentSpreadSpeed = 1.0; // Default, will be updated from slider
let isCuring = false; // State variable for curing process

// DOM Elements - will be assigned in init
let infectButton, spreadRateSlider, severitySlider, cureButton, resetButton, statusDisplay;


function resetInfectionState() {
    if (bodyMesh && bodyMesh.material && bodyMesh.material.uniforms) {
        if (bodyMesh.material.uniforms.infectionOrigin) {
            bodyMesh.material.uniforms.infectionOrigin.value.set(Infinity, Infinity, Infinity);
        }
        if (bodyMesh.material.uniforms.spreadRadius) {
            bodyMesh.material.uniforms.spreadRadius.value = 0.0;
        }
        // Optionally reset severity to slider's current value if desired, or to a default
        // if (bodyMesh.material.uniforms.infectionSeverity && severitySlider) {
        //     bodyMesh.material.uniforms.infectionSeverity.value = parseFloat(severitySlider.value);
        // }
    }
    infectionOrigin = null; // The JS variable
    isCuring = false; // Reset curing state

    infectionMarkers.forEach(marker => scene.remove(marker));
    infectionMarkers.length = 0;

    if (statusDisplay) statusDisplay.textContent = 'Status: Healthy';
    infectionEnabled = false;
    if (infectButton) {
        infectButton.textContent = 'Infect!';
        infectButton.disabled = false;
    }
    if (cureButton) {
        cureButton.disabled = false;
    }
}


function init() {
    // Get Control Elements
    infectButton = document.getElementById('infect-button');
    spreadRateSlider = document.getElementById('spread-rate-slider');
    severitySlider = document.getElementById('severity-slider');
    cureButton = document.getElementById('cure-button');
    resetButton = document.getElementById('reset-button');
    statusDisplay = document.getElementById('status-display');

    // 3. Initialize renderer
    const canvas = document.getElementById('scene-canvas');
    if (!canvas) {
        console.error('Canvas element #scene-canvas not found!');
        return;
    }
    renderer = new WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // No need to appendChild if canvas is already in HTML, just pass it to renderer.

    // 4. Initialize scene
    scene = new Scene();
    scene.background = new THREE.Color(0x111111); // Match body background

    // 5. Initialize camera
    camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30; // Adjusted for better initial view of potential sphere array

    // 6. Add Lighting
    const ambientLight = new AmbientLight(0xffffff, 0.6); // Soft white light
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true; // Enable shadow casting
    scene.add(directionalLight);

    // Configure shadow properties for the directional light if needed
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;

    // 7. Initialize controls
    if (OrbitControls) {
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 100;
        // controls.maxPolarAngle = Math.PI / 2; // Prevent looking below the ground
    } else {
        console.warn('THREE.OrbitControls not found. Camera controls will be disabled.');
    }

    // Create the "body" mesh with custom shaders
    const vertexShader = `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        
        uniform vec3 infectionOrigin;
        uniform float spreadRadius;
        uniform float displacementScale; // New
        uniform float time; // New

        // Simple periodic function for deformation
        float getDeformationFactor(vec3 worldPos) {
            float distanceToOrigin = distance(worldPos, infectionOrigin);
            if (distanceToOrigin < spreadRadius) {
                float infectionAmount = 1.0 - (distanceToOrigin / spreadRadius); // 0 to 1
                // Example: Sinusoidal bumps that animate slightly with time
                float deformation = sin(worldPos.x * 5.0 + time * 2.0) * cos(worldPos.y * 5.0 + time * 2.0) * 0.5 + 0.5;
                return infectionAmount * deformation * displacementScale;
            }
            return 0.0;
        }

        void main() {
            vNormal = normal;
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

            float displacement = getDeformationFactor(vWorldPosition);
            vec3 displacedPosition = position + normal * displacement;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
        }
    `;

    const fragmentShader = `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        uniform vec3 healthyColor;
        uniform vec3 infectedColor;
        uniform vec3 infectionOrigin;
        uniform float spreadRadius;
        uniform float infectionSeverity; // New
        uniform float time; // New

        // Simple pseudo-random function for patterns
        float pseudoRandomFrag(vec2 co){
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
            float distanceToOrigin = distance(vWorldPosition, infectionOrigin);
            float infectionAmount = 0.0; // How "infected" this point is (0 to 1)

            if (distanceToOrigin < spreadRadius && spreadRadius > 0.001) { // check spreadRadius > 0 to avoid division by zero
                infectionAmount = 1.0 - (distanceToOrigin / spreadRadius); // Stronger closer to origin, fades to edge of spreadRadius
                infectionAmount = pow(infectionAmount, 2.0); // Make falloff sharper

                // 1. Color Change
                vec3 baseColor = mix(healthyColor, infectedColor, infectionAmount);

                // 2. Texture/Pattern Overlay
                float pattern = pseudoRandomFrag(vWorldPosition.xy * 0.5 + time * 0.1);
                pattern = step(0.6, pattern);
                vec3 patternedColor = mix(baseColor, infectedColor * 0.7, pattern * infectionAmount * infectionSeverity);

                // 3. Glow/Emission
                vec3 finalColor = patternedColor;
                float glowIntensity = infectionAmount * infectionSeverity * 0.5;
                finalColor += infectedColor * glowIntensity;

                gl_FragColor = vec4(finalColor, 1.0);

            } else {
                gl_FragColor = vec4(healthyColor, 1.0);
            }
        }
    `;

    // Uniforms are defined here, make sure 'uniforms' variable is accessible later for updates
    const uniforms = {
        healthyColor: { value: new THREE.Color(0.0, 1.0, 0.0) }, // Green
        infectedColor: { value: new THREE.Color(1.0, 0.0, 0.0) }, // Red
        infectionOrigin: { value: new THREE.Vector3(Infinity, Infinity, Infinity) }, // Initialize far away
        spreadRadius: { value: 0.0 }, // Initial spread radius
        infectionSeverity: { value: 0.5 }, // Will be used for intensity
        time: { value: 0.0 }, // For dynamic effects
        displacementScale: { value: 1.0 } // Controls how much the mesh deforms
    };

    const bodyGeometry = new THREE.SphereGeometry(10, 32, 32);
    const bodyMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        // wireframe: true // Optional for debugging
    });

    bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial); // Assign to global bodyMesh
    bodyMesh.name = 'body'; // For raycasting identification
    bodyMesh.castShadow = true; // Allow body to cast shadows
    bodyMesh.receiveShadow = true; // Allow body to receive shadows
    scene.add(bodyMesh);

    // Initialize Raycasting components
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Initialize controls with default values from sliders
    if (spreadRateSlider) {
        currentSpreadSpeed = parseFloat(spreadRateSlider.value);
    }
    if (severitySlider && bodyMesh && bodyMesh.material && bodyMesh.material.uniforms.infectionSeverity) {
        bodyMesh.material.uniforms.infectionSeverity.value = parseFloat(severitySlider.value);
    }


    // Add Event Listeners for Controls
    if (infectButton) {
        infectButton.addEventListener('click', () => {
            infectionEnabled = true; // Enable infection mode
            if (statusDisplay) statusDisplay.textContent = 'Status: Infection mode ON - Click body to infect.';
            if (infectButton) {
                infectButton.textContent = 'Infecting... (Click Body)';
                infectButton.disabled = true; // Disable infect button while in "infecting" mode
            }
            if (cureButton) cureButton.disabled = true; // Disable cure button when trying to infect
        });
    }

    if (spreadRateSlider) {
        spreadRateSlider.addEventListener('input', () => {
            currentSpreadSpeed = parseFloat(spreadRateSlider.value);
            if (statusDisplay) statusDisplay.textContent = `Status: Spread rate set to ${currentSpreadSpeed.toFixed(2)}`;
        });
    }

    if (severitySlider) {
        severitySlider.addEventListener('input', () => {
            if (bodyMesh && bodyMesh.material && bodyMesh.material.uniforms.infectionSeverity) {
                bodyMesh.material.uniforms.infectionSeverity.value = parseFloat(severitySlider.value);
                if (statusDisplay) statusDisplay.textContent = `Status: Severity set to ${parseFloat(severitySlider.value).toFixed(2)}`;
            }
        });
    }

    if (cureButton) {
        cureButton.addEventListener('click', () => {
            // Check if there's something to cure
            if (infectionOrigin !== null || (bodyMesh && bodyMesh.material.uniforms.spreadRadius.value > 0.01)) {
                isCuring = true;
                if (statusDisplay) statusDisplay.textContent = 'Status: Curing in progress...';
                if (infectButton) infectButton.disabled = true; // Disable infect button during cure
                if (cureButton) cureButton.disabled = true; // Disable cure button temporarily
            } else {
                if (statusDisplay) statusDisplay.textContent = 'Status: Nothing to cure.';
            }
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            resetInfectionState(); // This now handles isCuring and button states
            if (controls) controls.reset(); // Reset camera

            if (spreadRateSlider) {
                spreadRateSlider.value = 1; // Default value from HTML
                currentSpreadSpeed = parseFloat(spreadRateSlider.value);
            }
            if (severitySlider && bodyMesh && bodyMesh.material && bodyMesh.material.uniforms.infectionSeverity) {
                 severitySlider.value = 0.5; // Default value from HTML
                 bodyMesh.material.uniforms.infectionSeverity.value = parseFloat(severitySlider.value);
            }
            // resetInfectionState already sets statusDisplay.textContent = 'Status: Healthy';
            // and enables buttons. We can override status if needed.
            if (statusDisplay) statusDisplay.textContent = 'Status: Scene Reset. Body is Healthy.';
            // Ensure buttons are explicitly enabled by resetInfectionState
        });
    }

    // Add Mouse Event Listener for infection initiation (raycasting)
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);


    // 9. Handle window resizing
    window.addEventListener('resize', onWindowResize, false);

    // 10. Start animation
    animate();
}

// 8. Create animate function
function animate() {
    requestAnimationFrame(animate);

    if (controls) {
        controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    }

    // Virus propagation logic
    if (bodyMesh && bodyMesh.material && bodyMesh.material.uniforms.infectionOrigin) {
        // Spreading logic
        if (!isCuring && infectionOrigin !== null && infectionEnabled === false && bodyMesh.material.uniforms.infectionOrigin.value.x !== Infinity) {
            if (bodyMesh.material.uniforms.spreadRadius.value < 20.0) { // Max spread
                bodyMesh.material.uniforms.spreadRadius.value += currentSpreadSpeed * 0.01;
            }
        }
        // Curing logic
        else if (isCuring) {
            if (bodyMesh.material.uniforms.spreadRadius.value > 0) {
                bodyMesh.material.uniforms.spreadRadius.value -= currentSpreadSpeed * 0.01;
            } else {
                bodyMesh.material.uniforms.spreadRadius.value = 0; // Ensure it's exactly 0
                isCuring = false;
                resetInfectionState(); // Resets uniforms, markers, and button states
                // cureButton is re-enabled by resetInfectionState
                if (statusDisplay) statusDisplay.textContent = 'Status: Successfully Cured. Body is healthy.';
            }
        }

        // Update time uniform for shaders (independent of infection/curing state for now)
        if (bodyMesh.material.uniforms.time) {
            bodyMesh.material.uniforms.time.value += 0.01;
        }
    }

    renderer.render(scene, camera);
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize the scene when the script loads
init();

// Mouse down event handler for raycasting
function onMouseDown(event) {
    event.preventDefault();

    if (!infectionEnabled || isCuring) return; // Only proceed if infection mode is ON and not currently curing

    // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Retrieve bodyMesh if not already available (e.g. if scene was cleared and rebuilt)
    // However, for this app's structure, bodyMesh assigned in init() should persist.
    if (!bodyMesh) {
        bodyMesh = scene.getObjectByName('body');
        if (!bodyMesh) {
            console.error("Body mesh not found for raycasting.");
            return;
        }
    }
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObject(bodyMesh);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        infectionOrigin = point.clone(); // Store the new infection origin

        // Update the shader uniform
        if (bodyMesh.material.uniforms.infectionOrigin) {
            bodyMesh.material.uniforms.infectionOrigin.value.copy(infectionOrigin);
            // Reset spreadRadius for the new infection point
            if (bodyMesh.material.uniforms.spreadRadius) {
                bodyMesh.material.uniforms.spreadRadius.value = 0.0;
            }
        } else {
            console.warn("infectionOrigin uniform not found on bodyMesh material.");
        }

        // Visual marker for the infection point
        infectionMarkers.forEach(marker => scene.remove(marker));
        infectionMarkers.length = 0; 

        const markerGeo = new THREE.SphereGeometry(0.3, 16, 16); 
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff0000 }); 
        const markerMesh = new THREE.Mesh(markerGeo, markerMat);
        markerMesh.position.copy(point);
        scene.add(markerMesh);
        infectionMarkers.push(markerMesh);

        console.log("Infection initiated at:", infectionOrigin);
        if (statusDisplay) statusDisplay.textContent = `Status: Infected at (${point.x.toFixed(1)}, ${point.y.toFixed(1)}, ${point.z.toFixed(1)})`;
        
        // Reset infection mode after successful infection
        infectionEnabled = false;
        if (infectButton) {
            infectButton.textContent = 'Infect!';
            infectButton.disabled = false; // Re-enable infect button
        }
        if (cureButton) cureButton.disabled = false; // Re-enable cure button as infection has started
    } else {
        // If click was on body but no intersection (should be rare for sphere) or missed body
        if (statusDisplay) statusDisplay.textContent = 'Status: Missed! Click the body to infect.';
        // infectionEnabled remains true for another attempt, so keep buttons in their current state
        // (infectButton disabled, cureButton disabled)
    }
}


// Placeholder for future simulation logic (cells array is already defined globally)
// const cells = []; // This was a duplicate from original template, removing

// Remove old placeholder event listeners as new ones are implemented in init()
console.log('main.js loaded and scene initialized. UI controls connected.');
