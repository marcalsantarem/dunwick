// Kit de INTERIORES (v0.1.2, D-041): a MOBÍLIA do cômodo, gerada por código. As paredes e o corte de câmera são do 08 (src/motor/interior.js: campo `sala`
// no nível do mapa, paredes de trás inteiras e rodapé na frente). Aqui: móveis e objetos, cada um com pegada em cfg_kit (colisão = visual) e, quando
// têm fogo, luz de ambiente por tipo (vela, lareira, forja) via `saida.luzes`, lida pela cena. Unidades: tiles.
import * as THREE from 'three';
import { rng } from './kit.js';
import { ajudantes } from './kit_vila.js';

// ---------------------------------------------------------------- móveis
function mesa(col, o, kit, saida) {
  const a = ajudantes(col, o), w = o.w ?? 1.6, d = o.d ?? 0.9, r = rng(o.seed ?? 1);
  a.b('madeira', 0, 0.82, 0, w, 0.07, d);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.b('madeira', sx * (w / 2 - 0.1), 0.39, sz * (d / 2 - 0.1), 0.09, 0.78, 0.09);
  a.b('madeira', 0, 0.55, 0, w - 0.2, 0.05, 0.06);
  if (o.itens === 'taverna') for (let i = 0; i < 3; i++) { const lx = -w / 2 + 0.3 + i * ((w - 0.6) / 2), lz = (r() - 0.5) * 0.3; a.g('ceramica', new THREE.CylinderGeometry(0.07, 0.06, 0.13, 8), lx, 0.92, lz); a.g('cera', new THREE.CylinderGeometry(0.07, 0.07, 0.02, 8), lx, 0.985, lz); }
  if (o.itens === 'papeis') { for (let i = 0; i < 3; i++) a.b('papel', -0.3 + i * 0.3, 0.86 + i * 0.012, (r() - 0.5) * 0.2, 0.36, 0.01, 0.28, (r() - 0.5) * 0.3); a.g('papel', new THREE.CylinderGeometry(0.04, 0.04, 0.42, 8), 0.5, 0.9, -0.1, 0, 0, Math.PI / 2); a.g('lacre', new THREE.CylinderGeometry(0.05, 0.05, 0.015, 8), 0.2, 0.9, 0.12); }
  if (o.itens === 'vela') vela(col, { x: o.x, z: o.z, alt: 0.855, id: `${o.id}_vela`, rot: o.rot }, kit, saida);
}

function cadeira(col, o) {
  const a = ajudantes(col, o);
  a.b('madeira', 0, 0.5, 0, 0.5, 0.06, 0.5); for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.b('madeira', sx * 0.21, 0.24, sz * 0.21, 0.07, 0.48, 0.07);
  for (const sx of [-1, 1]) a.b('madeira', sx * 0.21, 0.85, -0.22, 0.06, 0.7, 0.06); for (const y of [0.78, 0.96]) a.b('tabuas', 0, y, -0.22, 0.46, 0.1, 0.04);
}

function banco(col, o) { const a = ajudantes(col, o); a.b('madeira', 0, 0.46, 0, 1.4, 0.06, 0.38); for (const sx of [-1, 1]) a.b('madeira', sx * 0.6, 0.22, 0, 0.07, 0.44, 0.34); }

function cama(col, o) {
  const a = ajudantes(col, o);
  a.b('madeira', 0, 0.2, 0, 1.0, 0.24, 2.0); a.b('linho', 0, 0.38, 0, 0.9, 0.14, 1.9); a.b('linho', 0, 0.48, -0.74, 0.62, 0.1, 0.36); a.b('tecido_vinho', 0, 0.47, 0.3, 0.94, 0.05, 1.2);
  a.b('madeira', 0, 0.65, -0.98, 1.0, 0.75, 0.07); a.b('madeira', 0, 0.38, 0.98, 1.0, 0.4, 0.06);
}

const LIVROS = ['livro_a', 'livro_b', 'livro_c', 'livro_d'];
function estante(col, o) {
  const a = ajudantes(col, o), r = rng(o.seed ?? 1), w = 1.4, pr = 0.45;
  a.b('madeira', 0, 1.1, -pr / 2 + 0.03, w, 2.2, 0.05); for (const sx of [-1, 1]) a.b('madeira', sx * (w / 2 - 0.025), 1.1, 0, 0.05, 2.2, pr);
  for (const y of [0.05, 0.5, 0.95, 1.4, 1.85, 2.2]) a.b('madeira', 0, y, 0, w, 0.04, pr);
  for (const y0 of [0.07, 0.52, 0.97, 1.42]) { let lx = -w / 2 + 0.07; while (lx < w / 2 - 0.12) { const bw = 0.05 + r() * 0.07, bh = 0.26 + r() * 0.12; if (r() < 0.12) { lx += 0.13; continue; } a.b(LIVROS[Math.floor(r() * 4)], lx + bw / 2, y0 + bh / 2, 0.02, bw, bh, 0.3, (r() - 0.5) * 0.04); lx += bw + 0.008; } }
}

function balcao(col, o) {
  const a = ajudantes(col, o), w = o.w ?? 2.4, d = o.d ?? 0.7;
  a.b('tabuas', 0, 0.48, 0, w - 0.1, 0.95, d - 0.1); a.b('madeira', 0, 1.0, 0, w, 0.07, d);
  for (let i = 0; i < Math.round(w / 0.8); i++) a.b('madeira', -w / 2 + 0.4 + i * 0.8, 0.5, d / 2 - 0.04, 0.05, 0.85, 0.02);
  a.g('ceramica', new THREE.CylinderGeometry(0.08, 0.06, 0.14, 8), -w / 2 + 0.3, 1.1, 0); a.g('ceramica', new THREE.CylinderGeometry(0.08, 0.06, 0.14, 8), -w / 2 + 0.55, 1.1, 0.1);
}

function lareira(col, o, kit, saida) {
  const a = ajudantes(col, o);
  a.b('pedra', 0, 0.6, 0, 1.6, 1.2, 0.8); a.b('lareira_vao', 0, 0.5, 0.41, 0.85, 0.75, 0.03); a.b('pedra', 0, 1.9, -0.1, 1.2, 1.4, 0.55); a.b('madeira', 0, 1.26, 0.05, 1.8, 0.08, 0.85);
  for (const dz of [-0.04, 0.06]) a.g('casca', new THREE.CylinderGeometry(0.07, 0.07, 0.6, 7), 0, 0.14 + dz * 0.5, 0.2 + dz, 0, 0, Math.PI / 2);
  a.b('brasa', 0, 0.12, 0.22, 0.6, 0.06, 0.25); for (const dx of [-0.15, 0.05, 0.2]) a.g('chama', new THREE.ConeGeometry(0.1, 0.4 - Math.abs(dx) * 0.4, 6), dx, 0.38, 0.22);
  const [wx, wz] = a.L(0, 0.35); saida.luzes.push({ x: wx, y: 0.6, z: wz, tipo: 'lareira', id: o.id });
}

function bancada(col, o) {
  const a = ajudantes(col, o);
  a.b('madeira', 0, 0.9, 0, 1.8, 0.07, 0.7); for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.b('madeira', sx * 0.82, 0.44, sz * 0.28, 0.1, 0.88, 0.1); a.b('tabuas', 0, 0.3, 0, 1.7, 0.05, 0.6);
  a.b('metal', -0.5, 0.97, 0.05, 0.24, 0.07, 0.1); a.b('madeira', -0.5, 0.97, 0.05, 0.05, 0.05, 0.3); // martelo
  for (let i = 0; i < 3; i++) a.b('metal', 0.1 + i * 0.22, 0.96, -0.1, 0.18, 0.05, 0.08); // barras de ferro
  a.b('metal', 0.65, 1.0, 0.1, 0.16, 0.14, 0.16); // torno
}

function fornalha(col, o, kit, saida) {
  const a = ajudantes(col, o);
  a.b('pedra', 0, 0.45, 0, 1.4, 0.9, 1.0); a.b('pedra', 0, 0.93, 0, 1.5, 0.08, 1.1); a.b('pedra', 0, 1.55, -0.28, 1.1, 1.2, 0.45); a.b('pedra', 0, 2.55, -0.28, 0.55, 1.6, 0.55);
  a.b('lareira_vao', 0, 0.55, 0.51, 0.75, 0.42, 0.03); a.p('brasa', 0, 0.55, 0.53, 0.66, 0.32); a.b('brasa', 0, 0.99, 0.12, 0.75, 0.05, 0.5);
  a.b('madeira', 0.85, 0.42, 0.1, 0.4, 0.28, 0.7); a.b('tecido_ocre', 0.85, 0.58, 0.1, 0.34, 0.2, 0.62); // fole
  const [wx, wz] = a.L(0, 0.2); saida.luzes.push({ x: wx, y: 1.0, z: wz, tipo: 'forja', id: o.id });
}

function arquivo(col, o) {
  const a = ajudantes(col, o), r = rng(o.seed ?? 1);
  a.b('madeira', 0, 0.8, 0, 1.2, 1.6, 0.6);
  for (let j = 0; j < 3; j++) for (const sx of [-1, 1]) { const y = 0.3 + j * 0.5; a.b('tabuas', sx * 0.29, y, 0.31, 0.52, 0.42, 0.03); a.b('latao', sx * 0.29, y + 0.08, 0.34, 0.14, 0.03, 0.03); }
  for (let i = 0; i < 4; i++) a.g('papel', new THREE.CylinderGeometry(0.06, 0.06, 0.45 + r() * 0.1, 8), -0.4 + i * 0.25, 1.69 + (i % 2) * 0.05, (r() - 0.5) * 0.2, 0, 0, Math.PI / 2);
  a.b('papel', 0.2, 1.62, 0, 0.5, 0.06, 0.38);
}

function tapete(col, o) {
  const a = ajudantes(col, o), w = o.w ?? 2, d = o.d ?? 1.4, m = { vinho: 'tapete_vinho', ocre: 'tapete_ocre', verde: 'tapete_verde' }[o.cor ?? 'vinho'];
  a.b(m, 0, 0.018, 0, w, 0.012, d); a.b('tecido_ocre', 0, 0.026, 0, w - 0.3, 0.008, d - 0.3); a.b(m, 0, 0.032, 0, w - 0.55, 0.008, d - 0.55);
}

function vela(col, o, kit, saida) { // castiçal com vela acesa: luz de ambiente (tipo `vela`)
  const a = ajudantes(col, o), y = o.alt ?? 0.0;
  a.g('latao', new THREE.CylinderGeometry(0.07, 0.09, 0.04, 8), 0, y + 0.02, 0); a.g('latao', new THREE.CylinderGeometry(0.02, 0.02, 0.18, 6), 0, y + 0.12, 0);
  a.g('cera', new THREE.CylinderGeometry(0.035, 0.035, 0.14, 7), 0, y + 0.28, 0); a.g('chama', new THREE.SphereGeometry(0.03, 6, 5), 0, y + 0.37, 0);
  saida.luzes.push({ x: o.x, y: y + 0.45, z: o.z, tipo: 'vela', id: o.id }); void kit;
}

/** Porta de SAÍDA do cômodo (v0.1.2): batente alto, verga e folha de madeira ABERTA para dentro (assim não tapa o herói), maçaneta, soleira, capacho com seta
 *  e a mancha de luz de fora no chão; `porta` é a fonte de luz. Fica no ponto do portal `saida`, na borda sul do mapa (parede da frente, cortada ao rodapé). */
function portaSaida(col, o, kit, saida) {
  const a = ajudantes(col, { x: o.x, z: o.z, rot: o.rot ?? 0 }), hw = (o.w ?? 1.4) / 2 + 0.08, ang = (72 * Math.PI) / 180, c = Math.cos(ang), sn = Math.sin(ang), comp = hw * 2 - 0.2, hx = -hw + 0.09;
  for (const s of [-1, 1]) a.b('madeira', s * hw, 1.17, 0.06, 0.18, 2.34, 0.26);
  a.b('madeira', 0, 2.38, 0.06, hw * 2 + 0.18, 0.2, 0.26); a.b('madeira_clara', 0, 2.52, 0.06, hw * 2 + 0.34, 0.07, 0.34); a.b('pedra', 0, 0.04, 0.06, hw * 2, 0.08, 0.5);
  a.b('tabuas', hx + (c * comp) / 2, 1.07, (-sn * comp) / 2, comp, 2.1, 0.07, ang); // folha aberta, articulada no batente esquerdo
  for (const k of [0.25, 0.5, 0.75]) a.b('madeira', hx + c * comp * k, 1.07, -sn * comp * k, 0.035, 2.1, 0.1, ang);
  for (const y of [0.4, 1.7]) a.b('metal', hx + (c * comp) / 2, y, (-sn * comp) / 2, comp * 0.9, 0.09, 0.1, ang);
  for (const lado of [-1, 1]) a.g('latao', new THREE.SphereGeometry(0.055, 7, 6), hx + c * comp * 0.88 + lado * 0.07 * sn, 1.05, -sn * comp * 0.88 + lado * 0.07 * c);
  a.b('tapete_ocre', 0, 0.02, -0.75, 1.3, 0.012, 0.9); a.b('tecido_ocre', 0, 0.028, -0.75, 1.1, 0.008, 0.7); // capacho
  for (const s of [-1, 1]) a.b('latao', s * 0.17, 0.036, -0.78, 0.4, 0.01, 0.07, s * (Math.PI / 4)); // seta (V apontando para a porta)
  a.g('brilho_saida', new THREE.PlaneGeometry(1.9, 2.8).rotateX(-Math.PI / 2), 0, 0.05, -1.45, 0, 0, 0, { uv: false }); // luz de fora entrando
  const [wx, wz] = a.L(0, -0.6), [lx, lz] = a.L(0, 0.06); saida.luzes.push({ x: wx, y: 1.3, z: wz, tipo: 'porta', id: o.id ?? 'saida' }); saida.saidas.push({ x: lx, y: 3.35, z: lz }); void kit;
}

/** Aplique de parede com vela (no lugar da lanterna de poste, que não combina com cômodo fechado): `x`, `z` na face de dentro da parede, `rot` 0 (parede norte) ou 90 (oeste). */
function aplique(col, o, kit, saida) {
  const a = ajudantes(col, o), y = o.alt ?? 1.8;
  a.b('metal', 0, y, 0.025, 0.16, 0.34, 0.05); a.v('latao', [0, y - 0.1, 0.05], [0, y - 0.1, 0.24], 0.05);
  a.g('latao', new THREE.CylinderGeometry(0.085, 0.05, 0.07, 8), 0, y - 0.1, 0.26); a.g('cera', new THREE.CylinderGeometry(0.035, 0.035, 0.16, 7), 0, y, 0.26); a.g('chama', new THREE.SphereGeometry(0.032, 6, 5), 0, y + 0.1, 0.26);
  const [wx, wz] = a.L(0, 0.4); saida.luzes.push({ x: wx, y: y + 0.15, z: wz, tipo: 'vela', id: o.id }); void kit;
}

export const PECAS_INTERIOR = { porta_saida: portaSaida, aplique, mesa, cadeira, banco, cama, estante, balcao, lareira, bancada, fornalha, arquivo, tapete, castical: vela };
