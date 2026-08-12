/* ==========================================================================
   J.A.R.V.I.S. VOICE ASSISTANT & AUDIO SYNTHESIZER CORE
   Handles Speech Synthesis, Speech Recognition, Web Audio FX & AI Commands
   ========================================================================== */

class JarvisCore {
    constructor() {
        this.speechSynth = window.speechSynthesis;
        this.speechRecog = null;
        this.isListening = false;
        this.soundEnabled = true;

        // Web Audio API Synthesizer Context
        this.audioCtx = null;

        this.initAudioContext();
        this.initSpeechRecognition();
    }

    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        } catch (e) {
            console.warn('[JARVIS] Web Audio API not supported.');
        }
    }

    /* ----------------------------------------------------------------------
       PROCEDURAL WEB AUDIO SYNTHESIZER SOUND EFFECTS
       ---------------------------------------------------------------------- */
    playSound(type) {
        if (!this.soundEnabled || !this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        if (type === 'shield_cast') {
            // Eldritch Shield Summon Chiming Arcane Sound
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
        } 
        else if (type === 'time_stone') {
            // Agamotto Time Stone Reverberating Bell
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.8); // C6

            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.9);
        }
        else if (type === 'portal') {
            // Mirror Dimension Woosh Sound
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.linearRampToValueAtTime(350, now + 0.3);
            osc.frequency.linearRampToValueAtTime(80, now + 0.7);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.7);
        }
        else if (type === 'jarvis_beep') {
            // JARVIS Futuristic Interface Beep
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.setValueAtTime(1800, now + 0.05);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        }
    }

    /* ----------------------------------------------------------------------
       JARVIS VOICE SYNTHESIS (SPEECH OUTPUT)
       ---------------------------------------------------------------------- */
    speak(text, onEndCallback = null) {
        if (!this.speechSynth) return;

        this.speechSynth.cancel(); // Stop ongoing speech

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 0.95; // Slightly deeper robotic Jarvis tone

        // Select suitable English voice
        const voices = this.speechSynth.getVoices();
        const preferredVoice = voices.find(v => 
            v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Google') || v.name.includes('Male'))
        ) || voices.find(v => v.lang.startsWith('en'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        if (onEndCallback) {
            utterance.onend = onEndCallback;
        }

        this.speechSynth.speak(utterance);
        this.updateSpeechBubble(text);
        this.playSound('jarvis_beep');
    }

    updateSpeechBubble(text) {
        const bubble = document.getElementById('jarvis-speech-bubble');
        if (bubble) {
            bubble.textContent = `"${text}"`;
        }
    }

    /* ----------------------------------------------------------------------
       SPEECH RECOGNITION & VOICE COMMAND PROCESSING
       ---------------------------------------------------------------------- */
    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('[JARVIS] Web Speech Recognition not supported in this browser.');
            return;
        }

        this.speechRecog = new SpeechRecognition();
        this.speechRecog.continuous = true;
        this.speechRecog.interimResults = false;
        this.speechRecog.lang = 'en-US';

        this.speechRecog.onresult = (event) => {
            const lastIndex = event.results.length - 1;
            const transcript = event.results[lastIndex][0].transcript.trim().toLowerCase();
            console.log('[JARVIS VOICE INPUT]:', transcript);
            this.logToConsole(`[USER VOICE] "${transcript}"`, 'sys');
            this.processVoiceCommand(transcript);
        };

        this.speechRecog.onerror = (err) => {
            console.error('[JARVIS VOICE RECOG ERROR]', err);
        };

        this.speechRecog.onend = () => {
            if (this.isListening) {
                this.speechRecog.start(); // Auto restart if active
            }
        };
    }

    toggleListening() {
        if (!this.speechRecog) {
            this.speak("Speech recognition is not supported in this browser, sir.");
            return false;
        }

        if (this.isListening) {
            this.isListening = false;
            this.speechRecog.stop();
            this.speak("Voice command recognition paused.");
            return false;
        } else {
            this.isListening = true;
            this.speechRecog.start();
            this.speak("Listening for your voice commands, sir.");
            return true;
        }
    }

    processVoiceCommand(command) {
        if (command.includes('shield') || command.includes('activate shield') || command.includes('tao mandala')) {
            window.activeManualSpell = 'shield';
            this.speak("Activating Tao Mandala Eldritch Shield, sir.");
            this.playSound('shield_cast');
        }
        else if (command.includes('time') || command.includes('agamotto') || command.includes('time stone')) {
            window.activeManualSpell = 'time';
            this.speak("Summoning Agamotto Time Stone Arcana.");
            this.playSound('time_stone');
        }
        else if (command.includes('portal') || command.includes('mirror dimension') || command.includes('open portal')) {
            window.activeManualSpell = 'portal';
            this.speak("Opening Mirror Dimension portal gateway.");
            this.playSound('portal');
        }
        else if (command.includes('sparks') || command.includes('fire') || command.includes('flame') || command.includes('whip')) {
            window.activeManualSpell = 'burst';
            this.speak("Eldritch spark particles armed.");
        }
        else if (command.includes('dispel') || command.includes('clear') || command.includes('stop')) {
            window.activeManualSpell = null;
            this.speak("Dispelling all active magic spells, sir.");
        }
        else if (command.includes('status') || command.includes('system status') || command.includes('diagnostics')) {
            this.speak("All quantum hand sensors and mystic particle engines are operating at peak efficiency.");
        }
        else if (command.includes('who are you') || command.includes('jarvis')) {
            this.speak("I am J.A.R.V.I.S. your personal AI assistant, enhanced with Doctor Strange Mystic Arts and real-time hand sensor tracking.");
        }
        else {
            this.speak(`I heard "${command}". All mystic sensors remain online.`);
        }
    }

    logToConsole(message, type = 'sys') {
        const logBox = document.getElementById('console-logs');
        if (!logBox) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        logBox.appendChild(entry);
        logBox.scrollTop = logBox.scrollHeight;
    }
}
