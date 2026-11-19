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
  ctx.fillStyle = '#050506';
  ctx.fillRect(0, 0, w, h);
  const dial = (
    cx: number,
    r: number,
    max: number,
    step: number,
    needle: number,
    label: string,
  ) => {
    const cy = h / 2;
    // fundo do mostrador com o brilho da luz de fundo
    const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#1d1a1c');
    g.addColorStop(1, '#0b0a0b');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a8f96';
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let k = 0; k <= max; k += step / 2) {
      const a = Math.PI * 0.75 + (k / max) * Math.PI * 1.5;
      const big = k % step === 0;
      ctx.strokeStyle = k > max * 0.78 ? '#ff3b2a' : '#f2efe8';
      ctx.lineWidth = big ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.moveTo(
        cx + Math.cos(a) * r * (big ? 0.74 : 0.82),
        cy + Math.sin(a) * r * (big ? 0.74 : 0.82),
      );
      ctx.lineTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9);
      ctx.stroke();
      if (big) {
        ctx.fillStyle = '#f2efe8';
        ctx.font = `${r * 0.2}px "Manrope Variable", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(k), cx + Math.cos(a) * r * 0.56, cy + Math.sin(a) * r * 0.56);
      }
    }
    ctx.fillStyle = '#c9c4ba';
    ctx.font = `${r * 0.14}px "Manrope Variable", sans-serif`;
    ctx.fillText(label, cx, cy + r * 0.42);
    // ponteiro vermelho
    const na = Math.PI * 0.75 + needle * Math.PI * 1.5;
    ctx.strokeStyle = '#ff2a1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(na) * r * 0.8, cy + Math.sin(na) * r * 0.8);
    ctx.stroke();
    ctx.fillStyle = '#2b2b2f';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  };
  dial(w * 0.26, h * 0.45, 260, 40, 0.0, 'km/h');
  dial(w * 0.74, h * 0.45, 9, 1, 0.09, 'x1000 rpm');
  // visor do meio: marcha e combustível
  ctx.fillStyle = '#120404';
  ctx.fillRect(w * 0.44, h * 0.3, w * 0.12, h * 0.4);
  ctx.fillStyle = '#ff3b2a';
  ctx.font = `${h * 0.3}px "VT323", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', w * 0.5, h * 0.5);
}

/** Saída de ar do painel: moldura escura com as aletas horizontais. */
export function paintVent(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#08080a';
  ctx.fillRect(0, 0, w, h);
  for (let y = h * 0.14; y < h * 0.9; y += h * 0.16) {
    const g = ctx.createLinearGradient(0, y, 0, y + h * 0.08);
    g.addColorStop(0, '#3a3b40');
    g.addColorStop(1, '#121215');
    ctx.fillStyle = g;
    ctx.fillRect(w * 0.08, y, w * 0.84, h * 0.08);
  }
  ctx.strokeStyle = '#5c5f66';
  ctx.lineWidth = Math.max(2, h * 0.06);
  ctx.strokeRect(1, 1, w - 2, h - 2);
}

/** Botões do console (ar-condicionado, desembaçador e o pisca-alerta vermelho). */
export function paintConsoleButtons(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#0c0c0e';
  ctx.fillRect(0, 0, w, h);
  const n = 5;
  for (let k = 0; k < n; k++) {
    const x = (k + 0.5) * (w / n);
    const red = k === 2;
    ctx.fillStyle = red ? '#7a0c0c' : '#1d1d21';
    ctx.fillRect(x - w * 0.07, h * 0.2, w * 0.14, h * 0.6);
    ctx.strokeStyle = '#3a3a40';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w * 0.07, h * 0.2, w * 0.14, h * 0.6);
    if (red) {
      ctx.strokeStyle = '#ffd0c8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.32);
      ctx.lineTo(x + w * 0.04, h * 0.66);
      ctx.lineTo(x - w * 0.04, h * 0.66);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.fillStyle = k % 2 ? '#ffb35c' : '#9fd4ff';
      ctx.fillRect(x - w * 0.02, h * 0.3, w * 0.04, h * 0.08);
    }
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

/**
 * Frestas e detalhes pintados na lataria (multiplicam a cor da tinta).
 * u corre ao longo do carro (frente → trás, 4,45 m) e v pelos 13 pontos do
 * perfil (0 = embaixo no meio, 1 = no meio do teto); veja car/carBody.ts.
 */
export function paintBodyDetail(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const L = 4.45;
  const u = (x: number) => ((x + 2.25) / L) * w;
  const v = (j: number) => (1 - j / 12) * h;
  const gap = (x: number, j0: number, j1: number) => {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(u(x) - 1.5, v(j1), 3, v(j0) - v(j1));
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(u(x) + 1.5, v(j1), 1.5, v(j0) - v(j1));
  };
  const seam = (x0: number, x1: number, j: number) => {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(u(x0), v(j) - 1.5, u(x1) - u(x0), 3);
  };
  // portas (a da frente do motorista também tem a fresta de verdade)
  gap(-0.56, 2, 8);
  gap(0.385, 2, 8);
  gap(0.92, 3, 8);
  // para-choques
  gap(-1.86, 2.5, 6.6);
  gap(1.86, 2.2, 6.2);
  // tampa do porta-malas
  gap(1.66, 9.7, 12);
  seam(1.66, 2.16, 7.4);
  // tampinha do tanque
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(u(1.47), v(6.6), u(1.6) - u(1.47), v(5.4) - v(6.6));
  // vinco da saia lateral
  seam(-0.95, 0.9, 2.4);
}

/** Tecido dos bancos esportivos: preto com o miolo em trama vermelha escura. */
export function paintSeatFabric(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#121113';
  ctx.fillRect(0, 0, w, h);
  const r = mulberry32(55);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.25)';
    ctx.fillRect(r() * w, r() * h, 2, 2);
  }
  // miolo
  ctx.fillStyle = '#3a0c12';
  ctx.fillRect(w * 0.28, h * 0.08, w * 0.44, h * 0.84);
  for (let y = h * 0.08; y < h * 0.92; y += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(w * 0.28, y, w * 0.44, 1.5);
  }
  // costuras
  ctx.strokeStyle = 'rgba(190,40,40,0.7)';
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(w * 0.28 + 2, h * 0.08 + 2, w * 0.44 - 4, h * 0.84 - 4);
  ctx.setLineDash([]);
}

/** Saída de ar do capô: venezianas escuras em diagonal. */
export function paintLouvers(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#060607';
  ctx.fillRect(0, 0, w, h);
  for (let x = 4; x < w; x += 10) {
    const g = ctx.createLinearGradient(x, 0, x + 7, 0);
    g.addColorStop(0, '#202125');
    g.addColorStop(1, '#060607');
    ctx.fillStyle = g;
    ctx.fillRect(x, 2, 6, h - 4);
  }
  ctx.strokeStyle = '#1c1c20';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
}

/** Intercooler visto pela boca do para-choque: aletas prateadas horizontais. */
export function paintIntercooler(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#25272b';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = y % 6 ? '#8b9098' : '#5c6168';
    ctx.fillRect(0, y, w, 1.5);
  }
  ctx.fillStyle = '#121316';
  ctx.fillRect(0, 0, w, h * 0.08);
  ctx.fillRect(0, h * 0.92, w, h * 0.08);
}

/** Plástico do painel: cinza-chumbo com granulado fino. */
export function paintDashPlastic(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#16161a';
  ctx.fillRect(0, 0, w, h);
  const r = mulberry32(91);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.3)';
    ctx.fillRect(r() * w, r() * h, 1.5, 1.5);
  }
}

/** Painel de porta: plástico escuro com o miolo de tecido e o puxador. */
export function paintDoorCard(ctx: Ctx, w: number, h: number) {
  paintDashPlastic(ctx, w, h);
  ctx.fillStyle = '#26090d';
  ctx.fillRect(w * 0.12, h * 0.38, w * 0.62, h * 0.3);
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(w * 0.08, h * 0.3, w * 0.8, h * 0.05);
  ctx.fillStyle = '#8a8e96';
  ctx.fillRect(w * 0.72, h * 0.24, w * 0.12, h * 0.04);
}

/** Farol do sedã: refletor cromado, projetor redondo e o pisca âmbar por fora. */
export function paintEvoHeadlight(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  // forma do farol: trapézio com a quina de fora puxada para trás
  ctx.beginPath();
  ctx.moveTo(w * 0.02, h * 0.2);
  ctx.lineTo(w * 0.98, h * 0.04);
  ctx.lineTo(w * 0.96, h * 0.96);
  ctx.lineTo(w * 0.05, h * 0.84);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  // fundo da carcaça: escuro, com reflexo da lente por cima
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#2a3038');
  g.addColorStop(0.5, '#151a20');
  g.addColorStop(1, '#0c0f13');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (const [x, r] of [
    [w * 0.24, h * 0.3],
    [w * 0.52, h * 0.27],
  ]) {
    // anel cromado, refletor e o projetor no meio
    const ring = ctx.createRadialGradient(x, h / 2, r * 0.6, x, h / 2, r);
    ring.addColorStop(0, '#5d6670');
    ring.addColorStop(0.6, '#e8edf2');
    ring.addColorStop(1, '#6f7882');
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(x, h / 2, r, 0, Math.PI * 2);
    ctx.fill();
    const lens = ctx.createRadialGradient(x - r * 0.2, h / 2 - r * 0.2, 0, x, h / 2, r * 0.62);
    lens.addColorStop(0, '#ffffff');
    lens.addColorStop(0.4, '#cfd9e4');
    lens.addColorStop(1, '#3d4752');
    ctx.fillStyle = lens;
    ctx.beginPath();
    ctx.arc(x, h / 2, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // pisca âmbar por fora e o reflexo do vidro
  ctx.fillStyle = '#d98a2a';
  ctx.fillRect(w * 0.76, h * 0.22, w * 0.18, h * 0.56);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, h * 0.08, w, h * 0.12);
  ctx.restore();
  ctx.strokeStyle = '#08090b';
  ctx.lineWidth = 5;
  ctx.stroke();
}

/** Grade do meio (escudo trapezoidal) e boca de baixo: colmeia preta com moldura. */
export function paintShieldGrille(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  ctx.moveTo(w * 0.04, 0);
  ctx.lineTo(w * 0.96, 0);
  ctx.lineTo(w * 0.8, h);
  ctx.lineTo(w * 0.2, h);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  paintGrille(ctx, w, h);
  ctx.restore();
  ctx.strokeStyle = '#2b2c30';
  ctx.lineWidth = 5;
  ctx.stroke();
}
