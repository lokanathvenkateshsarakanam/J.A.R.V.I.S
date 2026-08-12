/* ==========================================================================
   MYSTIC ARTS GRAPHICS & PARTICLE ENGINE (HTML5 CANVAS 2D / GPU)
   Renders Doctor Strange Eldritch Shields, Portals, Time Stone & Sparks
   ========================================================================== */

class MysticArtsEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.particles = [];
        this.spells = []; // Active permanent or hand-attached spell instances
        this.rotationAngle = 0;
        this.showCameraBackground = true;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /* ----------------------------------------------------------------------
       WEBCAM CAMERA BACKGROUND RENDERER (MIRRORED)
       ---------------------------------------------------------------------- */
    drawCameraBackground(videoElement) {
        if (!this.showCameraBackground || !videoElement || videoElement.readyState < 2) return;
        const ctx = this.ctx;
        ctx.save();
        // Mirror webcam view horizontally so left/right moves naturally
        ctx.translate(this.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, 0, 0, this.width, this.height);
        ctx.restore();

        // Subtle dark sci-fi glass tint so glowing magic shields pop out
        ctx.fillStyle = 'rgba(5, 12, 24, 0.35)';
        ctx.fillRect(0, 0, this.width, this.height);
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    /* ----------------------------------------------------------------------
       PARTICLE SYSTEM ENGINE
       ---------------------------------------------------------------------- */
    addSpark(x, y, vx, vy, color = 'orange', life = 1.0, size = 3) {
        this.particles.push({
            x: x,
            y: y,
            vx: vx + (Math.random() - 0.5) * 2,
            vy: vy + (Math.random() - 0.5) * 2,
            color: color,
            life: life,
            maxLife: life,
            size: size + Math.random() * 2
        });
    }

    emitSparksAroundCircle(cx, cy, radius, count = 5, color = 'orange') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = radius + (Math.random() - 0.5) * 10;
            const px = cx + Math.cos(angle) * dist;
            const py = cy + Math.sin(angle) * dist;
            
            const vx = Math.cos(angle) * (1 + Math.random() * 3);
            const vy = Math.sin(angle) * (1 + Math.random() * 3);

            this.addSpark(px, py, vx, vy, color, 0.6 + Math.random() * 0.4, 2);
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96; // drag
            p.vy *= 0.96;
            p.life -= 0.025;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter'; // Glowing particle blending

        for (let p of this.particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            this.ctx.fillStyle = p.color === 'green' 
                ? `rgba(0, 255, 170, ${alpha})`
                : (p.color === 'white' 
                    ? `rgba(255, 255, 255, ${alpha})`
                    : `rgba(255, ${Math.floor(120 + alpha * 135)}, 0, ${alpha})`);
            
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color === 'green' ? '#00ffaa' : '#ffaa00';

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    /* ----------------------------------------------------------------------
       DOCTOR STRANGE TAO MANDALA SHIELD RENDERER
       ---------------------------------------------------------------------- */
    drawTaoMandalaShield(cx, cy, radius = 120, rotSpeed = 1.0) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(cx, cy);

        const now = performance.now() * 0.001 * rotSpeed;

        // Glowing outer aura
        const auraGrad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.3);
        auraGrad.addColorStop(0, 'rgba(255, 150, 0, 0.4)');
        auraGrad.addColorStop(0.5, 'rgba(255, 80, 0, 0.2)');
        auraGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // 1. Outer Ring with Runic Notches (Clockwise)
        ctx.save();
        ctx.rotate(now);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff5500';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Outer Ring Notches & Runes
        const numNotches = 16;
        for (let i = 0; i < numNotches; i++) {
            const angle = (i / numNotches) * Math.PI * 2;
            const x1 = Math.cos(angle) * (radius - 8);
            const y1 = Math.sin(angle) * (radius - 8);
            const x2 = Math.cos(angle) * (radius + 8);
            const y2 = Math.sin(angle) * (radius + 8);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        ctx.restore();

        // 2. Overlapping Square Stars (8-Point Octagram) (Counter-Clockwise)
        ctx.save();
        ctx.rotate(-now * 0.7);
        ctx.strokeStyle = '#ffdd44';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 12;

        const squareSize = radius * 0.75;

        // Square 1
        ctx.strokeRect(-squareSize / 2, -squareSize / 2, squareSize, squareSize);

        // Square 2 (Rotated 45 degrees)
        ctx.rotate(Math.PI / 4);
        ctx.strokeRect(-squareSize / 2, -squareSize / 2, squareSize, squareSize);
        ctx.restore();

        // 3. Inner Concentric Geometric Circles
        ctx.save();
        ctx.rotate(now * 1.4);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.stroke();

        // Inner Triangle/Runes
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2;
            const px = Math.cos(a) * (radius * 0.45);
            const py = Math.sin(a) * (radius * 0.45);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // 4. Center Radiant Energy Core
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.2);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        coreGrad.addColorStop(0.5, 'rgba(255, 200, 0, 0.7)');
        coreGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Emit live spark particles along perimeter
        this.emitSparksAroundCircle(cx, cy, radius, 3, 'orange');
    }

    /* ----------------------------------------------------------------------
       AGAMOTTO TIME STONE RING RENDERER (GREEN RUNES)
       ---------------------------------------------------------------------- */
    drawAgamottoTimeRings(cx, cy, radius = 100) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(cx, cy);

        const now = performance.now() * 0.001;

        // Emerald Aura
        const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.2);
        auraGrad.addColorStop(0, 'rgba(0, 255, 170, 0.5)');
        auraGrad.addColorStop(0.6, 'rgba(0, 200, 100, 0.2)');
        auraGrad.addColorStop(1, 'rgba(0, 255, 170, 0)');

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Time Concentric Circles & Gear Teeth
        ctx.strokeStyle = '#00ffaa';
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 15;

        // Ring 1 (Spinning Clockwise)
        ctx.save();
        ctx.rotate(now * 1.5);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Teeth on outer ring
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#00ffaa';
            ctx.fill();
        }
        ctx.restore();

        // Ring 2 (Spinning Counter-Clockwise)
        ctx.save();
        ctx.rotate(-now * 2);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        // Eye of Agamotto symbol center
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.4, radius * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

        ctx.restore();

        // Emit green spark particles
        this.emitSparksAroundCircle(cx, cy, radius, 3, 'green');
    }

    /* ----------------------------------------------------------------------
       MIRROR DIMENSION PORTAL RENDERER (SPARK RING PORTAL)
       ---------------------------------------------------------------------- */
    drawMirrorPortal(cx, cy, radius = 150) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Inner Void Portal Black Hole
        const voidGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        voidGrad.addColorStop(0, 'rgba(5, 0, 20, 0.95)');
        voidGrad.addColorStop(0.8, 'rgba(40, 10, 0, 0.8)');
        voidGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');

        ctx.fillStyle = voidGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // High-density rotating fiery spark ring
        this.emitSparksAroundCircle(cx, cy, radius, 12, 'orange');
        this.emitSparksAroundCircle(cx, cy, radius * 0.9, 6, 'white');

        ctx.restore();
    }

    /* ----------------------------------------------------------------------
       ELDRITCH ARCANE LIGHTNING BEAM
       ---------------------------------------------------------------------- */
    drawEldritchBeam(x1, y1, x2, y2) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff5500';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(x1, y1);

        const steps = 8;
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const px = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 15;
            const py = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 15;
            ctx.lineTo(px, py);
        }

        ctx.lineTo(x2, y2);
        ctx.stroke();

        this.addSpark(x2, y2, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, 'white', 0.5, 3);
        ctx.restore();
    }

    /* ----------------------------------------------------------------------
       MAIN RENDER LOOP
       ---------------------------------------------------------------------- */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    render() {
        this.clear();
        this.updateParticles();
        this.drawParticles();
    }
}
