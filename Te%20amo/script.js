const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const flash = document.getElementById("flash");
const startBtn = document.getElementById("startBtn");
const music = document.getElementById("bgMusic");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ================= ESTADO =================
let petals = [];
let mode = "float"; // float | text | heart
let targets = [];
let phraseIndex = 0;

// ================= MOUSE =================
const mouse = { x: 0, y: 0, radius: 120 };

window.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  spawnHeart(e.clientX, e.clientY);
});

// ================= PETALA =================
class Petal {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = 0;
    this.vy = 0;
    this.size = Math.random() * 2 + 1;
    this.seed = Math.random() * 1000;
    this.tx = null;
    this.ty = null;
  }

  update() {

    // ======== modo formação ========
    if ((mode === "text" || mode === "heart") && this.tx !== null) {
      this.x += (this.tx - this.x) * 0.06;
      this.y += (this.ty - this.y) * 0.06;
      return;
    }

    // ======== flutuação ========
    const angle = Date.now() * 0.0002 + this.seed;
    this.x += Math.cos(angle) * 0.15;
    this.y += Math.sin(angle) * 0.15;

    // repelir mouse
    const dx = this.x - mouse.x;
    const dy = this.y - mouse.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < mouse.radius) {
      const force = (mouse.radius - dist) / mouse.radius;
      this.vx += dx * force * 0.02;
      this.vy += dy * force * 0.02;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.92;
    this.vy *= 0.92;
  }

  draw() {
    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ================= GERAR PARTICULAS =================
for (let i = 0; i < 1400; i++) petals.push(new Petal());

// ================= CORACOES MOUSE =================
let hearts = [];

function spawnHeart(x, y) {
  hearts.push({ x, y, size: 6, alpha: 1 });
}

function drawHearts() {
  hearts.forEach(h => {
    ctx.globalAlpha = h.alpha;
    ctx.fillStyle = "#ff4d6d";
    ctx.font = `${h.size}px Arial`;
    ctx.fillText("❤", h.x, h.y);
    h.y -= 0.3;
    h.alpha -= 0.02;
  });
  hearts = hearts.filter(h => h.alpha > 0);
  ctx.globalAlpha = 1;
}

// ================= TEXTO =================
function textPoints(text) {
  const ratio = window.devicePixelRatio || 1;

  const temp = document.createElement("canvas");
  const tctx = temp.getContext("2d");

  const logicalWidth = canvas.width * 0.8;
  const logicalHeight = canvas.height * 0.35;

  // canvas em alta resolução
  temp.width = logicalWidth * ratio;
  temp.height = logicalHeight * ratio;

  // normaliza sistema de coordenadas
  tctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  tctx.clearRect(0, 0, logicalWidth, logicalHeight);

  let fontSize = logicalHeight * 0.8;

  tctx.textAlign = "center";
  tctx.textBaseline = "middle";
  tctx.fillStyle = "white";

  do {
    tctx.font = `bold ${fontSize}px Arial`;
    if (tctx.measureText(text).width <= logicalWidth * 0.9) break;
    fontSize -= 2;
  } while (fontSize > 10);

  tctx.fillText(text, logicalWidth / 2, logicalHeight / 2);

  const data = tctx.getImageData(0, 0, temp.width, temp.height).data;
  const pts = [];

  const step = 4 * ratio;

  for (let y = 0; y < temp.height; y += step) {
    for (let x = 0; x < temp.width; x += step) {
      if (data[(y * temp.width + x) * 4 + 3] > 140) {
        pts.push({
          x: (x / ratio) + canvas.width * 0.1,
          y: (y / ratio) + canvas.height * 0.33
        });
      }
    }
  }

  return pts;
}
function formText(text) {
  const pts = textPoints(text);

  if (!pts.length) return;

  mode = "text";

  // embaralha pontos para distribuição natural
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }

  const used = Math.min(petals.length, pts.length);

  for (let i = 0; i < petals.length; i++) {
    const p = petals[i];

    if (i < used) {
      const t = pts[i];
      p.tx = t.x;
      p.ty = t.y;
    } else {
      // partículas excedentes continuam flutuando
      p.tx = null;
      p.ty = null;
    }
  }
}

// ================= CORAÇÃO FINAL =================
function heartPoints(scale = 12) {
  const pts = [];
  const cx = canvas.width/2;
  const cy = canvas.height/2;

  for (let t = 0; t < Math.PI*2; t += 0.02) {
    const x = 16*Math.pow(Math.sin(t),3);
    const y = 13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);
    pts.push({ x: cx + x*scale, y: cy - y*scale });
  }
  return pts;
}

function formHeart() {
  const pts = heartPoints(Math.min(canvas.width, canvas.height)/45);
  mode = "heart";

  petals.forEach((p,i) => {
    const t = pts[i % pts.length];
    p.tx = t.x;
    p.ty = t.y;
  });
}

// ================= FLASH =================
function flashScreen() {
  flash.classList.add("flash-active");
  setTimeout(() => flash.classList.remove("flash-active"), 500);
}

// ================= SEQUENCIA =================
const frases = [
  "TE AMO",
  "MI NIÑA",
  "PRECIOSA",
  "GRACIAS",
  "POR EXISTIR"
];

function runSequence() {
  flashScreen();

  setTimeout(() => {
    if (phraseIndex < frases.length) {
      formText(frases[phraseIndex]);
      phraseIndex++;
      setTimeout(runSequence, 3500);
    } else {
      formHeart();
    }
  }, 400);
}

// ================= BOTAO =================
startBtn.addEventListener("click", () => {
  startBtn.style.display = "none";
  music.currentTime = 0;
  music.play().catch(()=>{});
  runSequence();
});

// ================= LOOP =================
function animate() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  petals.forEach(p => {
    p.update();
    p.draw();
  });

  drawHearts();

  requestAnimationFrame(animate);
}

animate();
