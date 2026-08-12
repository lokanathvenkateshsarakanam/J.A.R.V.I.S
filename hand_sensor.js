
/* ==========================================================================
   HAND SENSORS & GESTURE RECOGNITION ENGINE (MEDIAPIPE HANDS)
   Tracks 21 3D landmarks per hand & translates real-time gestures into spells
   ========================================================================== */

class HandSensorEngine {
    constructor(videoElementId, onResultsCallback) {
        this.videoElement = document.getElementById(videoElementId);
        this.onResultsCallback = onResultsCallback;
        this.camera = null;
        this.hands = null;

        this.isTracking = false;
        this.lastFrameTime = performance.now();
        this.fps = 60;
        this.latency = 0;
    }

    async initialize() {
        if (typeof Hands === 'undefined') {
            console.error('[SENSOR] MediaPipe Hands library is not loaded!');
            return false;
        }

        this.hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.65,
            minTrackingConfidence: 0.65
        });

        this.hands.onResults((results) => this.handleResults(results));

        // Setup Webcam Stream
        try {
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    const startTime = performance.now();
                    await this.hands.send({ image: this.videoElement });
                    this.latency = Math.round(performance.now() - startTime);
                },
                width: 1280,
                height: 720
            });

            await this.camera.start();
            this.isTracking = true;
            console.log('[SENSOR] Webcam Hand Tracking operational.');
            return true;
        } catch (err) {
            console.error('[SENSOR] Failed to access webcam:', err);
            return false;
        }
    }

    handleResults(results) {
        // Calculate FPS
        const now = performance.now();
        this.fps = Math.round(1000 / (now - this.lastFrameTime));
        this.lastFrameTime = now;

        const processedHands = [];

        if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i].label; // 'Left' or 'Right'

                // Flip X for selfie mirror mode
                const width = window.innerWidth;
                const height = window.innerHeight;

                const mappedLandmarks = landmarks.map(lm => ({
                    x: (1 - lm.x) * width,
                    y: lm.y * height,
                    z: lm.z
                }));

                // Calculate Palm Center (Midpoint between Wrist L0 and Middle MCP L9)
                const palmCenter = {
                    x: (mappedLandmarks[0].x + mappedLandmarks[9].x) / 2,
                    y: (mappedLandmarks[0].y + mappedLandmarks[9].y) / 2
                };

                // Determine Hand Span / Size (distance from Wrist 0 to Middle Tip 12)
                const handRadius = Math.hypot(
                    mappedLandmarks[12].x - mappedLandmarks[0].x,
                    mappedLandmarks[12].y - mappedLandmarks[0].y
                ) * 0.7;

                // Recognize Gestures
                const gesture = this.detectGesture(mappedLandmarks);

                processedHands.push({
                    id: i,
                    handedness: handedness,
                    landmarks: mappedLandmarks,
                    palmCenter: palmCenter,
                    radius: handRadius,
                    gesture: gesture
                });
            }
        }

        if (this.onResultsCallback) {
            this.onResultsCallback(processedHands, this.fps, this.latency);
        }
    }

    /* ----------------------------------------------------------------------
       GESTURE RECOGNITION ALGORITHM
       ---------------------------------------------------------------------- */
    detectGesture(landmarks) {
        // Distance helper
        const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        const indexMcp = landmarks[5];
        const middleMcp = landmarks[9];
        const ringMcp = landmarks[13];
        const pinkyMcp = landmarks[17];

        // Is finger extended? (Tip is further from wrist than MCP)
        const isIndexOpen = dist(indexTip, wrist) > dist(indexMcp, wrist) * 1.2;
        const isMiddleOpen = dist(middleTip, wrist) > dist(middleMcp, wrist) * 1.2;
        const isRingOpen = dist(ringTip, wrist) > dist(ringMcp, wrist) * 1.2;
        const isPinkyOpen = dist(pinkyTip, wrist) > dist(pinkyMcp, wrist) * 1.2;

        // Pinch distance
        const thumbIndexDist = dist(thumbTip, indexTip);
        const handScale = dist(wrist, middleMcp);

        // 1. PINCH (Thumb tip touching Index tip)
        if (thumbIndexDist < handScale * 0.35 && !isMiddleOpen && !isRingOpen) {
            return 'PINCH';
        }

        // 2. AGAMOTTO TIME RING (OK Sign: Thumb & Index touch, others extended)
        if (thumbIndexDist < handScale * 0.35 && isMiddleOpen && isRingOpen) {
            return 'AGAMOTTO_RING';
        }

        // 3. PALM OPEN (All fingers extended)
        if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) {
            return 'PALM_OPEN';
        }

        // 4. POINTING (Index extended, others closed)
        if (isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
            return 'POINTING';
        }

        // 5. PEACE / VICTORY (Index & Middle open)
        if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) {
            return 'PEACE';
        }

        // 6. FIST (All fingers closed)
        if (!isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
            return 'FIST';
        }

        return 'IDLE';
    }
}
