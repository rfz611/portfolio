import { mulberry32 } from './random';

type Ctx = CanvasRenderingContext2D;

/** Roda de liga leve de cinco raios, prata, com o cubo e as porcas. Fundo transparente. */
export function paintRim(ctx: Ctx, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const R = w * 0.48;
  ctx.clearRect(0, 0, w, h);
  // aro externo
  const ring = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R);
  ring.addColorStop(0, '#5b5f66');
  ring.addColorStop(0.5, '#d9dde3');
  ring.addColorStop(1, '#6d7178');
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  // fundo da roda (escuro, com o disco de freio)
  ctx.fillStyle = '#121316';
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.84, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a3c40';
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.62, 0, Math.PI * 2);
  ctx.fill();
  // cinco raios
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, -R * 0.09, 0, R * 0.09);
    g.addColorStop(0, '#9da2aa');
    g.addColorStop(0.5, '#eef0f3');
    g.addColorStop(1, '#8a8f97');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(R * 0.18, -R * 0.07);
    ctx.lineTo(R * 0.86, -R * 0.13);
    ctx.lineTo(R * 0.86, R * 0.13);
    ctx.lineTo(R * 0.18, R * 0.07);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // cubo e porcas
  ctx.fillStyle = '#c9cdd3';
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2c30';
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2 + Math.PI / 5;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * R * 0.12, cy + Math.sin(a) * R * 0.12, R * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#16171a';
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.06, 0, Math.PI * 2);
  ctx.fill();
}

/** Lateral do pneu: borracha com o ombro mais claro (sem letras nem marca). */
export function paintTireSide(ctx: Ctx, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  ctx.fillStyle = '#0c0c0d';
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(cx, cy, w * 0.3, cx, cy, w * 0.5);
  g.addColorStop(0, '#141416');
  g.addColorStop(0.7, '#1d1d20');
  g.addColorStop(1, '#0a0a0b');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

/** Tela de grade em colmeia, preta (entrada de ar do para-choque). */
export function paintGrille(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#050506';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#2c2d31';
  ctx.lineWidth = 2;
  const s = h / 5;
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < Math.ceil(w / s) + 1; col++) {
      const x = col * s + (row % 2 ? s / 2 : 0);
      const y = row * s * 0.86;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const px = x + Math.cos(a) * s * 0.42;
        const py = y + Math.sin(a) * s * 0.42;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
}

/** Farol: refletor cromado com duas lentes redondas e o pisca âmbar no canto. */
export function paintHeadlight(ctx: Ctx, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#5e6670');
  g.addColorStop(0.5, '#c7ced6');
  g.addColorStop(1, '#4a525c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (const [x, r] of [
    [w * 0.3, h * 0.36],
    [w * 0.58, h * 0.3],
  ]) {
    const lens = ctx.createRadialGradient(x, h / 2, 0, x, h / 2, r);
    lens.addColorStop(0, '#ffffff');
    lens.addColorStop(0.5, '#e4ecf4');
    lens.addColorStop(1, '#8794a2');
    ctx.fillStyle = lens;
    ctx.beginPath();
    ctx.arc(x, h / 2, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e6962e';
  ctx.fillRect(w * 0.8, h * 0.28, w * 0.16, h * 0.44);
  ctx.strokeStyle = '#2a2f36';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
}

/** Lanterna traseira: vermelho com dois anéis e a luz de ré branca. */
export function paintTaillight(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#5a0a0c';
  ctx.fillRect(0, 0, w, h);
  for (const x of [w * 0.28, w * 0.62]) {
    const g = ctx.createRadialGradient(x, h / 2, 0, x, h / 2, h * 0.45);
    g.addColorStop(0, '#ff6a5a');
    g.addColorStop(0.6, '#d31a16');
    g.addColorStop(1, '#6a0a0c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, h / 2, h * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e8e6e2';
  ctx.fillRect(w * 0.84, h * 0.25, w * 0.12, h * 0.5);
  ctx.strokeStyle = '#1a0606';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
}

/** Aletas do radiador (linhas finas verticais sobre o alumínio escuro). */
export function paintRadiator(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#2b2e33';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#4d525a';
  for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 1.5, h);
  ctx.fillStyle = '#1a1c20';
  for (let y = 0; y < h; y += h / 8) ctx.fillRect(0, y, w, 2);
}

/** Tampa do motor em vermelho enrugado (pintura de alta temperatura), sem marca. */
export function paintValveCover(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#8c1416';
  ctx.fillRect(0, 0, w, h);
  const r = mulberry32(31);
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,120,110,0.12)' : 'rgba(30,0,0,0.25)';
    ctx.fillRect(r() * w, r() * h, 2, 2);
  }
  ctx.fillStyle = '#c9cdd3';
  for (let k = 0; k < 4; k++) ctx.fillRect(w * (0.14 + k * 0.22), h * 0.42, w * 0.08, h * 0.16);
}

/** Painel: dois mostradores redondos (velocímetro e conta-giros), luz vermelha baixa. */
export function paintGauges(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#060607';
  ctx.fillRect(0, 0, w, h);
  for (const [cx, label] of [
    [w * 0.27, 260],
    [w * 0.73, 9],
  ] as const) {
    const r = h * 0.42;
    ctx.strokeStyle = '#3a3c40';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, h / 2, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ff3b2a';
    ctx.lineWidth = 2;
    for (let k = 0; k <= 10; k++) {
      const a = Math.PI * 0.75 + (k / 10) * Math.PI * 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 0.78, h / 2 + Math.sin(a) * r * 0.78);
      ctx.lineTo(cx + Math.cos(a) * r * 0.92, h / 2 + Math.sin(a) * r * 0.92);
      ctx.stroke();
    }
    ctx.fillStyle = '#ff5a40';
    ctx.font = `${h * 0.1}px "VT323", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(String(label), cx, h / 2 + r * 0.55);
    ctx.strokeStyle = '#ff8a5a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, h / 2);
    ctx.lineTo(
      cx + Math.cos(Math.PI * 0.85) * r * 0.75,
      h / 2 + Math.sin(Math.PI * 0.85) * r * 0.75,
    );
    ctx.stroke();
  }
}

/** Brilho vermelho embaixo do carro (neon por baixo, como nos jogos de corrida). */
export function paintUnderglow(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,40,30,0.9)');
  g.addColorStop(0.5, 'rgba(255,20,20,0.35)');
  g.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
