/* ==========================================================================
   ELDRITCH SKETCHPAD — Drawing Panel Module
   Full drawing canvas with pen, eraser, shapes, colors, undo & export
   ========================================================================== */

class DrawPanel {
    constructor() {
        this.panel = document.getElementById('draw-panel');
        this.canvas = document.getElementById('draw-canvas');
        this.ctx = this.canvas.getContext('2d');

        // State
        this.isOpen = false;
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#00f0ff';
        this.brushSize = 3;
        this.history = [];       // Undo stack (ImageData snapshots)
        this.maxHistory = 40;

        // Shape drawing temps
        this.shapeStartX = 0;
        this.shapeStartY = 0;
        this.snapshotBeforeShape = null;

        this._bindEvents();
    }

    /* ------------------------------------------------------------------
       PANEL OPEN / CLOSE
    ------------------------------------------------------------------ */
    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.panel.classList.remove('hidden');
            this.panel.classList.add('visible');
            this._resizeCanvas();
        } else {
            this.panel.classList.remove('visible');
            this.panel.classList.add('hidden');
        }
    }

    close() {
        this.isOpen = false;
        this.panel.classList.remove('visible');
        this.panel.classList.add('hidden');
    }

    /* ------------------------------------------------------------------
       CANVAS SIZING
    ------------------------------------------------------------------ */
    _resizeCanvas() {
        const wrapper = this.canvas.parentElement;
        const rect = wrapper.getBoundingClientRect();
        // Preserve existing drawing when resizing
        const tempData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // Fill dark background
        this.ctx.fillStyle = '#0a0e1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Restore old drawing
        this.ctx.putImageData(tempData, 0, 0);

        // Draw a subtle grid
        this._drawGrid();
    }

    _drawGrid() {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
        ctx.lineWidth = 0.5;
        const step = 30;

        for (let x = 0; x < this.canvas.width; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    /* ------------------------------------------------------------------
       SAVE / UNDO HISTORY
    ------------------------------------------------------------------ */
    _saveState() {
        if (this.history.length >= this.maxHistory) {
            this.history.shift();
        }
        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    }

    undo() {
        if (this.history.length === 0) return;
        const state = this.history.pop();
        this.ctx.putImageData(state, 0, 0);
    }

    clearCanvas() {
        this._saveState();
        this.ctx.fillStyle = '#0a0e1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this._drawGrid();
    }

    download() {
        const link = document.createElement('a');
        link.download = `jarvis_sketch_${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }

    /* ------------------------------------------------------------------
       DRAWING LOGIC
    ------------------------------------------------------------------ */
    _getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    _startDraw(e) {
        e.preventDefault();
        this.isDrawing = true;
        const pos = this._getPos(e);

        if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
            this._saveState();
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
        } else {
            // Shape tools — snapshot before shape
            this._saveState();
            this.shapeStartX = pos.x;
            this.shapeStartY = pos.y;
            this.snapshotBeforeShape = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    _moveDraw(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = this._getPos(e);

        if (this.currentTool === 'pen') {
            this._drawPenStroke(pos);
        } else if (this.currentTool === 'eraser') {
            this._drawEraserStroke(pos);
        } else {
            // Live preview shape
            if (this.snapshotBeforeShape) {
                this.ctx.putImageData(this.snapshotBeforeShape, 0, 0);
            }
            this._drawShape(this.shapeStartX, this.shapeStartY, pos.x, pos.y);
        }
    }

    _endDraw(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
            this.ctx.closePath();
        } else {
            // Finalize shape
            if (this.snapshotBeforeShape) {
                this.ctx.putImageData(this.snapshotBeforeShape, 0, 0);
            }
            const pos = this._getPos(e.changedTouches ? e : e);
            this._drawShape(this.shapeStartX, this.shapeStartY, pos.x, pos.y);
            this.snapshotBeforeShape = null;
        }
    }

    _drawPenStroke(pos) {
        const ctx = this.ctx;
        ctx.strokeStyle = this.currentColor;
        ctx.lineWidth = this.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = this.currentColor;
        ctx.shadowBlur = this.brushSize * 1.5;
        ctx.globalCompositeOperation = 'source-over';

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        // Reset shadow to avoid affecting subsequent draws
        ctx.shadowBlur = 0;
    }

    _drawEraserStroke(pos) {
        const ctx = this.ctx;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#0a0e1a';
        ctx.lineWidth = this.brushSize * 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 0;

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    _drawShape(x1, y1, x2, y2) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = this.currentColor;
        ctx.lineWidth = this.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = this.currentColor;
        ctx.shadowBlur = this.brushSize * 1.5;
        ctx.globalCompositeOperation = 'source-over';

        if (this.currentTool === 'line') {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        } else if (this.currentTool === 'rect') {
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        } else if (this.currentTool === 'circle') {
            const rx = Math.abs(x2 - x1) / 2;
            const ry = Math.abs(y2 - y1) / 2;
            const cx = x1 + (x2 - x1) / 2;
            const cy = y1 + (y2 - y1) / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.currentTool === 'arrow') {
            // Arrow line
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Arrowhead
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const headLen = 14 + this.brushSize * 2;
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(
                x2 - headLen * Math.cos(angle - Math.PI / 6),
                y2 - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(x2, y2);
            ctx.lineTo(
                x2 - headLen * Math.cos(angle + Math.PI / 6),
                y2 - headLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
        }

        ctx.restore();
    }

    /* ------------------------------------------------------------------
       EVENT BINDINGS
    ------------------------------------------------------------------ */
    _bindEvents() {
        // Canvas draw events
        this.canvas.addEventListener('mousedown', (e) => this._startDraw(e));
        this.canvas.addEventListener('mousemove', (e) => this._moveDraw(e));
        this.canvas.addEventListener('mouseup', (e) => this._endDraw(e));
        this.canvas.addEventListener('mouseleave', (e) => this._endDraw(e));

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => this._startDraw(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this._moveDraw(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this._endDraw(e));

        // Tool selection
        document.querySelectorAll('.draw-tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.draw-tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.getAttribute('data-tool');
            });
        });

        // Color swatches
        document.querySelectorAll('.draw-color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                document.querySelectorAll('.draw-color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                this.currentColor = swatch.getAttribute('data-color');
                document.getElementById('draw-custom-color').value = this.currentColor;
            });
        });

        // Custom color picker
        const customColor = document.getElementById('draw-custom-color');
        if (customColor) {
            customColor.addEventListener('input', (e) => {
                this.currentColor = e.target.value;
                document.querySelectorAll('.draw-color-swatch').forEach(s => s.classList.remove('active'));
            });
        }

        // Brush size slider
        const sizeSlider = document.getElementById('draw-brush-size');
        const sizeVal = document.getElementById('draw-size-val');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                this.brushSize = parseInt(e.target.value);
                sizeVal.textContent = this.brushSize;
            });
        }

        // Undo
        document.getElementById('btn-draw-undo')?.addEventListener('click', () => this.undo());

        // Clear
        document.getElementById('btn-draw-clear')?.addEventListener('click', () => this.clearCanvas());

        // Download
        document.getElementById('btn-draw-download')?.addEventListener('click', () => this.download());

        // Close button
        document.getElementById('btn-close-draw')?.addEventListener('click', () => this.close());

        // Toggle button (footer)
        document.getElementById('btn-toggle-draw')?.addEventListener('click', () => this.toggle());

        // Resize handler
        window.addEventListener('resize', () => {
            if (this.isOpen) {
                this._resizeCanvas();
            }
        });
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.drawPanel = new DrawPanel();
});
