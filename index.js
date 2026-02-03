const canvas = document.getElementById("hairCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mouse = { x: null, y: null };

window.addEventListener("mousemove", e => {
    mouse.x = e.x;
    mouse.y = e.y;
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

class Hair {
    constructor(x, y, length) {
        this.x = x;
        this.y = y;
        this.length = length;
        this.angle = Math.random() * Math.PI;
    }

    draw() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let sway = 0;
        if (dist < 120) {
            sway = (120 - dist) * 0.05;
        }

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x + Math.cos(this.angle) * this.length + sway,
            this.y + Math.sin(this.angle) * this.length
        );
        ctx.strokeStyle = "rgba(200,200,255,0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

const hairs = [];
for (let i = 0; i < 1200; i++) {
    hairs.push(
        new Hair(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 15 + 10
        )
    );
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hairs.forEach(hair => hair.draw());
    requestAnimationFrame(animate);
}

animate();
