/* ==========================================================================
   J.A.R.V.I.S. MAIN APPLICATION ORCHESTRATOR
   Integrates Mystic Arts, Hand Sensors, Voice AI & Real-time Canvas Render
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Core Engines
    const mysticEngine = new MysticArtsEngine('mystic-canvas');
    const jarvis = new JarvisCore();

    window.activeManualSpell = null;

    // 2. Setup Clock & Date Display
    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();

        document.getElementById('clock-display').textContent = timeStr;
        document.getElementById('date-display').textContent = dateStr;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 3. Setup Hand Sensor Callback
    let detectedHands = [];

    const handSensor = new HandSensorEngine('webcam-feed', (hands, fps, latency) => {
        detectedHands = hands;

        // Update UI Diagnostics
        document.getElementById('fps-counter').textContent = fps;
        document.getElementById('latency-val').textContent = `${latency} ms`;

        const leftCard = document.getElementById('left-hand-status');
        const leftGestureTag = document.getElementById('left-gesture');
        const rightCard = document.getElementById('right-hand-status');
        const rightGestureTag = document.getElementById('right-gesture');

        const leftHand = hands.find(h => h.handedness === 'Left');
        const rightHand = hands.find(h => h.handedness === 'Right');

        if (leftHand) {
            leftCard.textContent = 'TRACKED';
            leftCard.classList.add('active');
            leftGestureTag.textContent = leftHand.gesture;
        } else {
            leftCard.textContent = 'NOT DETECTED';
            leftCard.classList.remove('active');
            leftGestureTag.textContent = 'IDLE';
        }

        if (rightHand) {
            rightCard.textContent = 'TRACKED';
            rightCard.classList.add('active');
            rightGestureTag.textContent = rightHand.gesture;
        } else {
            rightCard.textContent = 'NOT DETECTED';
            rightCard.classList.remove('active');
            rightGestureTag.textContent = 'IDLE';
        }
    });

    // 4. Main Render Loop (60 FPS Animation Frame)
    let lastPlayedSound = 0;
    const webcamFeed = document.getElementById('webcam-feed');

    function renderLoop() {
        // Clear canvas
        mysticEngine.clear();

        // Draw real-time face & background webcam feed
        mysticEngine.drawCameraBackground(webcamFeed);

        // Update & draw particle physics
        mysticEngine.updateParticles();
        mysticEngine.drawParticles();

        // If hands are detected, map gestures to Mystic Spells!
        if (detectedHands.length > 0) {
            for (let hand of detectedHands) {
                const { palmCenter, radius, gesture, landmarks } = hand;
                const now = performance.now();

                // Active manual spell overrides or gesture-based spell
                const effectiveSpell = window.activeManualSpell || gesture;

                // Highlight active spell card in HUD sidebar
                updateSpellManifestUI(effectiveSpell);

                if (effectiveSpell === 'PALM_OPEN' || effectiveSpell === 'shield') {
                    // Draw Tao Mandala Shield centered on palm
                    mysticEngine.drawTaoMandalaShield(palmCenter.x, palmCenter.y, Math.max(100, radius * 1.3));

                    if (now - lastPlayedSound > 2000) {
                        jarvis.playSound('shield_cast');
                        lastPlayedSound = now;
                    }
                } 
                else if (effectiveSpell === 'AGAMOTTO_RING' || effectiveSpell === 'time') {
                    // Draw Agamotto Time Stone Rings
                    mysticEngine.drawAgamottoTimeRings(palmCenter.x, palmCenter.y, Math.max(90, radius * 1.1));

                    if (now - lastPlayedSound > 2000) {
                        jarvis.playSound('time_stone');
                        lastPlayedSound = now;
                    }
                }
                else if (effectiveSpell === 'POINTING' || effectiveSpell === 'portal') {
                    // Index finger tip (landmark 8)
                    const indexTip = landmarks[8];
                    mysticEngine.drawMirrorPortal(indexTip.x, indexTip.y, 140);

                    if (now - lastPlayedSound > 2000) {
                        jarvis.playSound('portal');
                        lastPlayedSound = now;
                    }
                }
                else if (effectiveSpell === 'PINCH' || effectiveSpell === 'burst') {
                    // Spark beam from Thumb tip (4) to Index tip (8)
                    const thumbTip = landmarks[4];
                    const indexTip = landmarks[8];
                    mysticEngine.drawEldritchBeam(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y);
                    mysticEngine.emitSparksAroundCircle(indexTip.x, indexTip.y, 30, 8, 'orange');
                }
                else if (effectiveSpell === 'FIST') {
                    // Fire explosion around fist
                    mysticEngine.emitSparksAroundCircle(palmCenter.x, palmCenter.y, radius * 0.8, 10, 'orange');
                }

                // Connect fingers with subtle cyan energy lines (Hand Skeleton Sensor view)
                drawHandSensorSkeleton(mysticEngine.ctx, landmarks);
            }
        } 
        else if (window.activeManualSpell) {
            // Draw center spell if manual button pressed without hands
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            updateSpellManifestUI(window.activeManualSpell);

            if (window.activeManualSpell === 'shield') {
                mysticEngine.drawTaoMandalaShield(cx, cy, 180);
            } else if (window.activeManualSpell === 'time') {
                mysticEngine.drawAgamottoTimeRings(cx, cy, 150);
            } else if (window.activeManualSpell === 'portal') {
                mysticEngine.drawMirrorPortal(cx, cy, 180);
            } else if (window.activeManualSpell === 'burst') {
                mysticEngine.emitSparksAroundCircle(cx, cy, 100, 15, 'orange');
            }
        }

        requestAnimationFrame(renderLoop);
    }

    // Helper: Draw subtle HUD skeleton lines over detected hand points
    function drawHandSensorSkeleton(ctx, landmarks) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.fillStyle = '#00f0ff';

        // Landmark connections (Finger joints)
        const connections = [
            [0,1],[1,2],[2,3],[3,4], // Thumb
            [0,5],[5,6],[6,7],[7,8], // Index
            [0,9],[9,10],[10,11],[11,12], // Middle
            [0,13],[13,14],[14,15],[15,16], // Ring
            [0,17],[17,18],[18,19],[19,20] // Pinky
        ];

        ctx.beginPath();
        for (let [i, j] of connections) {
            ctx.moveTo(landmarks[i].x, landmarks[i].y);
            ctx.lineTo(landmarks[j].x, landmarks[j].y);
        }
        ctx.stroke();

        // Draw small glowing joints
        for (let lm of landmarks) {
            ctx.beginPath();
            ctx.arc(lm.x, lm.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Update active spell highlighting in sidebar manifest
    function updateSpellManifestUI(spellType) {
        document.querySelectorAll('.spell-item').forEach(item => item.classList.remove('active'));

        if (spellType === 'PALM_OPEN' || spellType === 'shield') {
            document.getElementById('spell-mandala')?.classList.add('active');
        } else if (spellType === 'AGAMOTTO_RING' || spellType === 'time') {
            document.getElementById('spell-time')?.classList.add('active');
        } else if (spellType === 'POINTING' || spellType === 'portal') {
            document.getElementById('spell-portal')?.classList.add('active');
        } else if (spellType === 'PINCH' || spellType === 'burst') {
            document.getElementById('spell-sparks')?.classList.add('active');
        }
    }

    // 5. Setup UI Event Listeners
    document.getElementById('btn-initialize').addEventListener('click', async () => {
        document.getElementById('start-overlay').style.display = 'none';
        document.getElementById('status-text').textContent = 'SENSORS & MYSTIC ARTS ONLINE';

        jarvis.logToConsole('[JARVIS] Accessing quantum hand sensors...', 'sys');
        
        const success = await handSensor.initialize();
        if (success) {
            jarvis.logToConsole('[SENSOR] Hand tracking operational. FPS: 60.', 'sys');
            jarvis.speak("Sensors fully operational, sir. Mystic Arts engine online.");
        } else {
            jarvis.logToConsole('[SENSOR WARNING] Webcam unavailable. Manual controls active.', 'err');
            jarvis.speak("Webcam hand tracking unavailable. Interactive manual controls are active.");
        }

        // Start 60 FPS Render Loop
        requestAnimationFrame(renderLoop);
    });

    // Voice button
    document.getElementById('btn-mic').addEventListener('click', () => {
        const active = jarvis.toggleListening();
        const btn = document.getElementById('btn-mic');
        if (active) {
            btn.classList.add('glow-btn');
            btn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i> PAUSE VOICE';
        } else {
            btn.classList.remove('glow-btn');
            btn.innerHTML = '<i class="fa-solid fa-microphone"></i> TOGGLE VOICE LISTENING';
        }
    });

    // Audio FX Toggle Button
    document.getElementById('btn-sound').addEventListener('click', () => {
        jarvis.soundEnabled = !jarvis.soundEnabled;
        const btn = document.getElementById('btn-sound');
        btn.innerHTML = jarvis.soundEnabled 
            ? '<i class="fa-solid fa-volume-high"></i> AUDIO FX: ON' 
            : '<i class="fa-solid fa-volume-xmark"></i> AUDIO FX: OFF';
    });

    // Camera View Toggle Button
    document.getElementById('btn-toggle-cam').addEventListener('click', () => {
        mysticEngine.showCameraBackground = !mysticEngine.showCameraBackground;
        const btn = document.getElementById('btn-toggle-cam');
        btn.innerHTML = mysticEngine.showCameraBackground 
            ? '<i class="fa-solid fa-video"></i> CAM VIEW: ON'
            : '<i class="fa-solid fa-video-slash"></i> CAM VIEW: OFF';
        jarvis.logToConsole(`[CAMERA] Background video feed ${mysticEngine.showCameraBackground ? 'ENABLED' : 'DISABLED'}`, 'sys');
    });

    // Quick Manual Spell Buttons
    document.querySelectorAll('.spell-btn[data-spell]').forEach(btn => {
        btn.addEventListener('click', () => {
            const spell = btn.getAttribute('data-spell');
            window.activeManualSpell = spell;
            jarvis.logToConsole(`[SPELL CAST] Manual spell active: ${spell.toUpperCase()}`, 'magic');
            jarvis.playSound(spell === 'shield' ? 'shield_cast' : (spell === 'time' ? 'time_stone' : 'portal'));
        });
    });

    // Dispel Button
    document.getElementById('btn-clear-spells').addEventListener('click', () => {
        window.activeManualSpell = null;
        jarvis.logToConsole('[MYSTIC] All active spells dispelled.', 'magic');
        jarvis.playSound('jarvis_beep');
    });
});
