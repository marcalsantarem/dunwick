// Para caber no orçamento de chamadas de desenho (≤ 80 por quadro, 1 por material), o exterior reaproveita materiais: cera e flor branca = `papel`,
// lacre = `tecido_vinho`, flor laranja e ervas secas = `tecido_ocre`, chama = `brasa`. Os interiores (mapas separados) usam os materiais próprios.
// Props EXTERIORES da vila de Baixo Orvalho (v0.1.2, D-041), gerados por código como o resto do kit: variantes de casa (nova, enegrecida),
// decoração de cada casa da história (Maren, taverna, forja, escrivão, Torvan), pórtico com o gancho vazio do Sino de Cobre, quadro de avisos,
// marcas do saque, canteiro, rack de armas e forno de brasa. Só as faces +x e +z (as que a câmera vê) recebem detalhe. Unidades: tiles.
// Cada peça solta tem pegada em data/config/cfg_kit.json (mesmo dado do visual). Aleatório sempre por semente.
import * as THREE from 'three';
import { rng, blobIco, folhagemGeo } from './kit.js';

const RAD = Math.PI / 180, M4 = new THREE.Matrix4(), EU = new THREE.Euler(), QU = new THREE.Quaternion(), UM = new THREE.Vector3(1, 1, 1), PV = new THREE.Vector3();

/** Ajudantes em coordenadas LOCAIS da peça (frente = +z; `rot` em graus gira em torno de y como o `caixa` do coletor). */
export function ajudantes(col, o) {
  const ry = (o.rot ?? 0) * RAD, c = Math.cos(ry), s = Math.sin(ry), L = (lx, lz) => [o.x + lx * c + lz * s, o.z - lx * s + lz * c];
  return {
    L, ry,
    /** caixa centrada em (lx, y, lz) com tamanho (w, h, d) */
    b: (mat, lx, y, lz, w, h, d, dr = 0) => { const [x, z] = L(lx, lz); return col.caixa(mat, x, y, z, w, h, d, ry + dr); },
    /** barra de p0 a p1 (locais) */
    v: (mat, p0, p1, esp) => { const [x0, z0] = L(p0[0], p0[2]), [x1, z1] = L(p1[0], p1[2]); return col.viga(mat, [x0, p0[1], z0], [x1, p1[1], z1], esp); },
    /** geometria qualquer em (lx, y, lz) com giros rx, ry extra, rz */
    g: (mat, geo, lx, y, lz, rx = 0, dry = 0, rz = 0, opc) => { const [x, z] = L(lx, lz); EU.set(rx, ry + dry, rz, 'YXZ'); M4.compose(PV.set(x, y, z), QU.setFromEuler(EU), UM); return col.geo(mat, geo, M4.clone(), opc); },
    /** plano (w × h) voltado para +z local, em (lx, y, lz) */
    p: (mat, lx, y, lz, w, h, dry = 0, rz = 0) => { const [x, z] = L(lx, lz); EU.set(0, ry + dry, rz, 'YXZ'); M4.compose(PV.set(x, y, z), QU.setFromEuler(EU), UM); return col.geo(mat, new THREE.PlaneGeometry(w, h), M4.clone(), { uv: false }); },
  };
}

/** Telhadinho de duas águas (cumeeira ao longo de x local): usado no pórtico, no quadro de avisos e em marquises. */
export function telhadinho(col, matTelha, matEmpena, x, y0, z, L, S, rh, ry = 0) {
  const e = S / 2, comp = Math.hypot(e, rh), T = new THREE.Matrix4().makeTranslation(x, y0, z).multiply(new THREE.Matrix4().makeRotationY(ry)), esc = col.escalaUV;
  for (const s of [1, -1]) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-L / 2, 0, s * e, L / 2, 0, s * e, L / 2, rh, 0, -L / 2, rh, 0], 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(Array(4).fill([0, e / comp, (s * rh) / comp]).flat(), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([(-L / 2) * esc, 0, (L / 2) * esc, 0, (L / 2) * esc, comp * esc, (-L / 2) * esc, comp * esc], 2));
    g.setIndex(s > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]); col.geo(matTelha, g, T, { uv: false });
    const t = new THREE.BufferGeometry(); t.setAttribute('position', new THREE.Float32BufferAttribute([(s * L) / 2, 0, -e, (s * L) / 2, 0, e, (s * L) / 2, rh, 0], 3));
    t.setAttribute('normal', new THREE.Float32BufferAttribute(Array(3).fill([s, 0, 0]).flat(), 3)); t.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, S * esc, 0, (S * esc) / 2, rh * esc], 2));
    t.setIndex(s > 0 ? [0, 2, 1] : [0, 1, 2]); col.geo(matEmpena, t, T, { uv: false });
  }
}

// ---------------------------------------------------------------- casas: variantes e decoração
/** Materiais da casa por `estilo`: `nova` = reconstruída (reboco claro, madeira clara); `enegrecida` = sobrevivente do saque (pedra e vigas queimadas, reboco sujo). */
export function materiaisCasa(o) {
  if (o.estilo === 'nova') return { pedra: 'pedra', reboco: 'reboco_novo', madeira: 'madeira_clara', tabuas: 'tabuas' };
  if (o.estilo === 'enegrecida') return { pedra: 'pedra_negra', reboco: 'reboco_sujo', madeira: 'carvao', tabuas: 'tabuas' };
  return { pedra: 'pedra', reboco: 'reboco', madeira: 'madeira', tabuas: 'tabuas' };
}

const ervasPenduradas = (col, a, x0, x1, y, zf, r) => { // feixes de ervas secas e verdes pendurados numa barra sob o beiral
  a.v('madeira', [x0, y, zf + 0.3], [x1, y, zf + 0.3], 0.07);
  for (const x of [x0, x1]) a.v('madeira', [x, y, zf + 0.02], [x, y, zf + 0.3], 0.05);
  const n = Math.max(3, Math.round((x1 - x0) / 0.42));
  for (let i = 0; i < n; i++) {
    const x = x0 + ((i + 0.5) * (x1 - x0)) / n + (r() - 0.5) * 0.1, comp = 0.36 + r() * 0.26, verde = i % 3 !== 1;
    a.v('madeira', [x, y, zf + 0.3], [x, y - 0.1, zf + 0.3], 0.02);
    const g = blobIco(0.11, 1, Math.floor(r() * 1e6), 0.15); g.scale(1, comp / 0.22, 1);
    if (verde) a.g('folhagem', folhagemGeo(g, null, -comp / 2, comp / 2, Math.floor(r() * 1e6), 0.4 + r() * 0.4), x, y - 0.1 - comp / 2, zf + 0.3, 0, 0, 0, { escala: col.escalaUV * 0.5 });
    else a.g('tecido_ocre', g, x, y - 0.1 - comp / 2, zf + 0.3);
  }
};

const editais = (col, a, lx, y, lz, r, n = 5) => { // folhas pregadas numa tábua; uma delas com selo (Coroa)
  a.b('tabuas', lx, y, lz, 1.3, 0.9, 0.05); for (const [dx, dy, w, h] of [[0, 0.45, 1.4, 0.06], [0, -0.45, 1.4, 0.06], [-0.67, 0, 0.06, 0.9], [0.67, 0, 0.06, 0.9]]) a.b('madeira', lx + dx, y + dy, lz + 0.01, w, h, 0.08);
  for (let i = 0; i < n; i++) { const px = lx - 0.45 + (i % 3) * 0.45 + (r() - 0.5) * 0.08, py = y + (i < 3 ? 0.18 : -0.2) + (r() - 0.5) * 0.06; a.p('papel', px, py, lz + 0.04 + i * 0.002, 0.3 + r() * 0.1, 0.36 + r() * 0.08, (r() - 0.5) * 0.12, (r() - 0.5) * 0.2); }
  a.g('tecido_vinho', new THREE.CylinderGeometry(0.07, 0.07, 0.015, 10), lx - 0.45, y + 0.02, lz + 0.075, Math.PI / 2);
};

const coroa = (col, a, lx, y, lz) => { // brasão simples da Coroa: coroa de 3 pontas sobre uma barra, em latão (desenho próprio)
  a.b('latao', lx, y, lz, 0.5, 0.07, 0.03);
  for (const dx of [-0.2, 0, 0.2]) { a.b('latao', lx + dx, y + 0.13, lz, 0.07, 0.2 + (dx === 0 ? 0.08 : 0), 0.03); a.g('latao', new THREE.SphereGeometry(0.04, 6, 5), lx + dx, y + 0.27 + (dx === 0 ? 0.08 : 0), lz); }
};

const lanternaParede = (col, a, saida, lx, y, lz, id) => { // lanterna presa à parede por um braço de ferro (acende ao entardecer, como as de poste)
  a.v('metal', [lx, y + 0.12, lz - 0.02], [lx, y + 0.12, lz + 0.32], 0.06); a.b('metal', lx, y + 0.02, lz + 0.32, 0.3, 0.05, 0.3);
  a.b('lampada', lx, y + 0.17, lz + 0.32, 0.22, 0.3, 0.22); a.b('metal', lx, y + 0.34, lz + 0.32, 0.3, 0.05, 0.3);
  const [wx, wz] = a.L(lx, lz + 0.32); saida.luzes.push({ x: wx, y: y + 0.2, z: wz, tipo: 'lanterna', id });
};

/** Decoração presa à casa (alta ou rente à parede, sem colisão própria): cada casa da história ganha o que a conta. A decoração da PORTA fica na parede
 *  do `lado` visível ('s' ou 'l'); numa porta nas costas ('o', 'n') só entra o que não depende da frente (persianas, fuligem, chaminé da forja). */
export function decorarCasa(col, o, kit, saida, janelas) {
  const giro = (((o.rot ?? 0) % 180) + 180) % 180 === 90, w = giro ? o.d : o.w, d = giro ? o.w : o.d, cx = o.x, cz = o.z, lado = o.lado ?? 's', vis = lado === 's' || lado === 'l';
  const h = kit.visual.casa.parede_altura, rh = kit.visual.casa.telhado_altura, r = rng((o.seed ?? 1) * 7 + 3);
  const W = ajudantes(col, { x: 0, z: 0, rot: 0 }); // coordenadas de mundo (janelas e chaminé já estão assim)
  const F = ajudantes(col, { x: cx, z: cz, rot: lado === 'l' ? 90 : 0 }); // quadro da parede da porta: frente = +z local, porta em lx = 0
  const lw = lado === 'l' ? d : w, zf = (lado === 'l' ? w : d) / 2 + 0.035;
  // persianas fechadas (casas sem interior): tábuas sobre cada janela da frente (+z)
  if (o.fechada) for (const j of janelas) { W.b('madeira', j.x, j.y, j.z - 0.025, 0.68, 0.76, 0.05); for (const dy of [-0.22, 0, 0.22]) W.b('tabuas', j.x, j.y + dy, j.z, 0.62, 0.06, 0.04); }
  // fuligem nas casas enegrecidas: manchas escuras subindo das janelas
  if (o.estilo === 'enegrecida') for (const j of janelas) for (let i = 0; i < 2; i++) W.b('pedra_negra', j.x + (i - 0.5) * 0.35, j.y + 0.55 + i * 0.1, j.z - 0.1, 0.34 + r() * 0.2, 0.6 + r() * 0.5, 0.02);
  // casa nova: jardineira com flores sob a primeira janela
  if (o.estilo === 'nova' && janelas[0]) { const j = janelas[0]; W.b('madeira_clara', j.x, j.y - 0.46, j.z - 0.06, 0.95, 0.2, 0.26); for (let i = 0; i < 5; i++) W.g(['flor_amarela', 'papel', 'tecido_ocre'][i % 3], new THREE.SphereGeometry(0.075, 6, 5), j.x - 0.36 + i * 0.18, j.y - 0.3 + (r() - 0.5) * 0.05, j.z - 0.06); }
  if (o.deco === 'forja') { // chaminé alta de pedra no canto oposto ao da chaminé comum, soltando fumaça
    const qx = cx - w / 2 + 0.85, qz = cz - 0.3, top = h + rh + 2.1;
    W.b('pedra', qx, top / 2 - 0.05, qz, 0.9, top + 0.1, 0.9); W.b('pedra', qx, top + 0.12, qz, 1.1, 0.2, 1.1);
    for (const y of [h * 0.5, h + rh * 0.4]) W.b('pedra_negra', qx, y, qz + 0.46, 0.8, 0.5, 0.02); // fuligem na face da frente
    saida.chamines.push({ x: qx, y: top + 0.3, z: qz });
  }
  if (!vis) return;
  switch (o.deco) {
    case 'maren': { // ervas penduradas sob o beiral + vela acesa numa janela da frente
      ervasPenduradas(col, F, -lw / 2 + 0.55, lw / 2 - 0.55, h - 0.42, zf, r);
      const j = lado === 's' ? janelas[0] : null; if (j) {
        W.p('janela_vela', j.x, j.y, j.z - 0.08, 0.55, 0.62);
        W.b('papel', j.x + 0.1, j.y - 0.25, j.z - 0.07, 0.05, 0.12, 0.05); W.g('brasa', new THREE.SphereGeometry(0.035, 6, 5), j.x + 0.1, j.y - 0.16, j.z - 0.07);
        saida.luzes.push({ x: j.x + 0.1, y: j.y - 0.1, z: j.z + 0.35, tipo: 'vela', id: `${o.id}_vela` });
      }
      break; }
    case 'taverna': { // placa pendurada num braço de ferro + lanterna de parede ao lado da porta
      const x = Math.min(lw / 2 - 0.5, 1.55);
      F.v('metal', [x, h - 0.35, zf], [x, h - 0.35, zf + 1.05], 0.07); F.b('metal', x, h - 0.35, zf + 1.05, 0.08, 0.08, 0.08);
      for (const dz of [0.25, 0.95]) F.v('metal', [x, h - 0.35, zf + dz], [x, h - 0.78, zf + dz], 0.025);
      F.b('tabuas', x, h - 1.05, zf + 0.6, 0.07, 0.55, 0.95); F.b('madeira', x, h - 0.76, zf + 0.6, 0.1, 0.05, 1.0); F.b('madeira', x, h - 1.33, zf + 0.6, 0.1, 0.05, 1.0);
      F.g('tecido_ocre', new THREE.CylinderGeometry(0.15, 0.13, 0.28, 8), x + 0.1, h - 1.05, zf + 0.55); F.g('papel', new THREE.CylinderGeometry(0.15, 0.15, 0.05, 8), x + 0.1, h - 0.9, zf + 0.55); // caneca com espuma
      lanternaParede(col, F, saida, -1.25 < -lw / 2 + 0.4 ? 1.1 : -1.25, 1.75, zf, `${o.id}_lanterna`);
      break; }
    case 'escrivao': { // editais ao lado da porta, placa com brasão e selo acima dela, bandeira azul da Coroa no canto
      editais(col, F, 1.35, 1.55, zf + 0.03, r);
      F.b('tabuas', 0, h - 0.42, zf + 0.04, 1.5, 0.38, 0.06); coroa(col, F, 0, h - 0.5, zf + 0.09);
      F.g('tecido_vinho', new THREE.CylinderGeometry(0.09, 0.09, 0.02, 10), 0.55, h - 0.7, zf + 0.13, Math.PI / 2);
      const mx = lw / 2 + 0.35, mz = zf + 0.55;
      F.v('madeira', [mx, 0, mz], [mx, 3.4, mz], 0.09); F.v('madeira', [mx, 3.25, mz], [mx, 3.25, mz - 0.95], 0.05);
      F.p('tecido_azul', mx, 2.7, mz - 0.5, 0.55, 1.1, Math.PI / 2); coroa(col, F, mx + 0.01, 2.78, mz - 0.5);
      break; }
    case 'torvan': { // escudo de treino com duas espadas de madeira cruzadas ao lado da porta
      const sx = Math.min(1.4, lw / 2 - 0.45), sz = zf + 0.04;
      F.g('madeira', new THREE.CylinderGeometry(0.34, 0.34, 0.06, 14), sx, 1.7, sz + 0.03, Math.PI / 2); F.g('tecido_vinho', new THREE.CylinderGeometry(0.2, 0.2, 0.065, 14), sx, 1.7, sz + 0.035, Math.PI / 2);
      F.g('metal', new THREE.SphereGeometry(0.07, 7, 5), sx, 1.7, sz + 0.09);
      F.v('madeira_clara', [sx - 0.5, 1.2, sz + 0.1], [sx + 0.5, 2.25, sz + 0.1], 0.07); F.v('madeira_clara', [sx + 0.5, 1.2, sz + 0.12], [sx - 0.5, 2.25, sz + 0.12], 0.07);
      break; }
    default:
  }
}

// ---------------------------------------------------------------- peças soltas
function portico(col, o, kit, saida) {
  const a = ajudantes(col, o), w = o.w ?? 4, hp = 3.5, hw = w / 2;
  for (const s of [-1, 1]) {
    a.b('pedra', s * hw, 0.3, 0, 0.75, 0.6, 0.75); a.b('madeira', s * hw, 0.6 + hp / 2, 0, 0.34, hp, 0.34);
    a.v('madeira', [s * hw, 0.6 + hp - 0.9, 0.2], [s * (hw - 0.8), 0.6 + hp - 0.15, 0.2], 0.12); // mão-francesa
    a.p('tecido_vinho', s * hw, 0.6 + hp - 1.3, 0.2, 0.45, 0.95); a.b('madeira', s * hw, 0.6 + hp - 0.8, 0.2, 0.5, 0.05, 0.05); // flâmula
  }
  a.b('madeira', 0, 0.6 + hp - 0.15, 0, w + 0.9, 0.34, 0.34);
  const [tx, tz] = a.L(0, 0); telhadinho(col, 'telha_musgo', 'tabuas', tx, 0.6 + hp + 0.02, tz, w + 1.4, 1.3, 0.55, a.ry);
  // o GANCHO VAZIO onde o Sino de Cobre pendia: argola na viga, corrente curta e um gancho aberto; sem sino
  a.g('metal', new THREE.TorusGeometry(0.12, 0.03, 6, 12), 0, 0.6 + hp - 0.43, 0, 0);
  for (let i = 0; i < 3; i++) a.g('metal', new THREE.TorusGeometry(0.06, 0.016, 5, 8), 0, 0.6 + hp - 0.62 - i * 0.12, 0, i % 2 ? 0 : Math.PI / 2, 0);
  a.g('metal', new THREE.TorusGeometry(0.2, 0.04, 6, 12, Math.PI * 1.25), 0, 0.6 + hp - 1.15, 0, 0, 0, -Math.PI * 0.15 + Math.PI / 2 * 0);
  a.b('madeira_clara', 0, 0.6 + hp - 0.15, 0.18, 0.5, 0.2, 0.03); // marca clara na viga: o lugar do sino
  void kit; void saida;
}

function quadroAvisos(col, o) {
  const a = ajudantes(col, o), r = rng(o.seed ?? 1);
  for (const s of [-1, 1]) a.b('madeira', s * 0.8, 1.15, 0, 0.14, 2.3, 0.14);
  a.b('tabuas', 0, 1.55, 0.02, 1.7, 0.95, 0.08); for (const [dy, hh] of [[0.5, 0.07], [-0.5, 0.07]]) a.b('madeira', 0, 1.55 + dy, 0.04, 1.8, hh, 0.1);
  const [tx, tz] = a.L(0, 0); telhadinho(col, 'telha_laranja', 'tabuas', tx, 2.28, tz, 2.0, 0.8, 0.3, a.ry);
  for (let i = 0; i < 6; i++) a.p('papel', -0.6 + (i % 3) * 0.55 + (r() - 0.5) * 0.08, 1.78 - Math.floor(i / 3) * 0.5 + (r() - 0.5) * 0.06, 0.08 + i * 0.002, 0.36 + r() * 0.12, 0.42 + r() * 0.1, (r() - 0.5) * 0.1, (r() - 0.5) * 0.2);
  a.g('tecido_vinho', new THREE.CylinderGeometry(0.07, 0.07, 0.015, 10), -0.6, 1.62, 0.1, Math.PI / 2);
}

function arvoreQueimada(col, o) {
  const a = ajudantes(col, o), r = rng(o.seed ?? 1), th = 2.5;
  a.g('carvao', new THREE.CylinderGeometry(0.17, 0.3, th, 8), 0, th / 2, 0);
  a.g('carvao', new THREE.CylinderGeometry(0.1, 0.16, 0.9, 7), 0.12, th + 0.35, 0, 0, 0, -0.35); // topo quebrado
  a.v('carvao', [0, 1.5, 0], [0.95, 2.15, 0.2], 0.12); a.v('carvao', [0, 1.9, 0], [-0.8, 2.45, -0.3], 0.1); a.v('carvao', [0.05, 1.1, 0], [-0.55, 1.45, 0.45], 0.08);
  const brotos = (lx, y, lz, rad) => { const g = folhagemGeo(blobIco(rad, 1, Math.floor(r() * 1e6), 0.2), null, 0, 2.7, Math.floor(r() * 1e6), 0.85); a.g('folhagem', g, lx, y, lz, 0, 0, 0, { escala: col.escalaUV * 0.5 }); };
  for (let i = 0; i < 9; i++) { const an = (i / 9) * Math.PI * 2 + r(), dist = 0.3 + r() * 0.3; brotos(Math.cos(an) * dist, 0.12 + r() * 0.4, Math.sin(an) * dist, 0.1 + r() * 0.1); }
  brotos(0.15, 0.95, 0.25, 0.16); brotos(-0.2, 1.4, 0.2, 0.14); brotos(0.95, 2.18, 0.2, 0.15); brotos(-0.8, 2.48, -0.3, 0.13); brotos(0.1, 2.9, 0, 0.14);
}

function muroFuligem(col, o) {
  const dx = o.x1 - o.x0, dz = o.z1 - o.z0, len = Math.hypot(dx, dz), n = Math.max(1, Math.round(len / 1.1)), r = rng(o.seed ?? 1), ry = -Math.atan2(dz, dx);
  let nx = -dz / len, nz = dx / len; if (nx + nz < 0) { nx = -nx; nz = -nz; } // normal voltada para a câmera (+x +z)
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, x = o.x0 + dx * t, z = o.z0 + dz * t, hh = 1.3 + (r() - 0.5) * 0.18;
    col.caixa('pedra', x, hh / 2, z, len / n + 0.02, hh, 0.5, ry); col.caixa(r() < 0.55 ? 'pedra_negra' : 'pedra', x, hh + 0.04, z, len / n + 0.04, 0.09, 0.58, ry);
    for (let k = 0; k < 2; k++) { const w = 0.5 + r() * 0.5, y = 0.45 + r() * 0.75; col.caixa('pedra_negra', x + nx * 0.255 + (r() - 0.5) * 0.3 * dx / len, y, z + nz * 0.255 + (r() - 0.5) * 0.3 * dz / len, w * (len / n > 1 ? 1 : 0.8), 0.4 + r() * 0.7, 0.03, ry); }
  }
}

function pedraEnegrecida(col, o) {
  const a = ajudantes(col, o), r = rng(o.seed ?? 1), w = o.w ?? 2, d = o.d ?? 4, ao = d >= w, L = ao ? d : w, esp = Math.min(ao ? w : d, 0.8), n = Math.max(2, Math.round(L / 0.75));
  for (let i = 0; i < n; i++) { // paredão queimado: blocos de alturas decrescentes, topo quebrado
    const t = (i + 0.5) / n, hh = 1.7 - t * 1.0 + (r() - 0.5) * 0.35, along = -L / 2 + t * L, wl = L / n + 0.02;
    if (ao) a.b('pedra_negra', 0, hh / 2, along, esp, hh, wl); else a.b('pedra_negra', along, hh / 2, 0, wl, hh, esp);
    if (r() < 0.4) { const g = blobIco(0.22, 1, Math.floor(r() * 1e6), 0.3); g.scale(1.2, 0.7, 1); a.g('pedra_negra', g, ao ? (r() - 0.5) * (w + 0.8) : along, 0.17, ao ? along : (r() - 0.5) * (d + 0.8)); } // entulho
  }
  const viga = (p0, p1) => a.v('carvao', p0, p1, 0.12); // vigas queimadas fincadas
  if (ao) { viga([0, 0.4, -L * 0.2], [0.25, 2.1, -L * 0.2 + 0.5]); viga([0, 0.4, L * 0.1], [-0.3, 1.6, L * 0.1 - 0.4]); } else { viga([-L * 0.2, 0.4, 0], [-L * 0.2 + 0.5, 2.1, 0.25]); viga([L * 0.1, 0.4, 0], [L * 0.1 - 0.4, 1.6, -0.3]); }
}

function canteiro(col, o) {
  const a = ajudantes(col, o), r = rng(o.seed ?? 1), w = o.w ?? 2, d = o.d ?? 1, hw = w / 2, hd = d / 2;
  for (const s of [-1, 1]) { a.b('madeira', 0, 0.14, s * hd, w, 0.28, 0.09); a.b('madeira', s * hw, 0.14, 0, 0.09, 0.28, d); }
  a.b('terra_canteiro', 0, 0.14, 0, w - 0.1, 0.2, d - 0.1);
  const fileiras = Math.max(1, Math.round(d / 0.5)), cols = Math.max(2, Math.round(w / 0.42));
  for (let j = 0; j < fileiras; j++) for (let i = 0; i < cols; i++) {
    const lx = -hw + 0.3 + (i * (w - 0.6)) / Math.max(1, cols - 1), lz = fileiras === 1 ? 0 : -hd + 0.25 + (j * (d - 0.5)) / (fileiras - 1), rad = 0.12 + r() * 0.07;
    a.g('folhagem', folhagemGeo(blobIco(rad, 1, Math.floor(r() * 1e6), 0.2), null, 0.1, 0.6, Math.floor(r() * 1e6), 0.5 + r() * 0.4), lx, 0.3 + rad * 0.4, lz, 0, 0, 0, { escala: col.escalaUV * 0.5 });
    if ((i + j) % 3 === 0) a.g(['flor_amarela', 'papel', 'tecido_ocre'][(i + j) % 9 % 3], new THREE.SphereGeometry(0.065, 6, 5), lx, 0.3 + rad * 0.9, lz);
  }
}

function rackArmas(col, o) {
  const a = ajudantes(col, o), r = rng(o.seed ?? 1);
  for (const s of [-1, 1]) a.b('madeira', s * 0.7, 0.65, 0, 0.12, 1.3, 0.12); a.b('madeira', 0, 1.25, 0, 1.5, 0.1, 0.1); a.b('madeira', 0, 0.35, 0.02, 1.5, 0.08, 0.1);
  for (let i = 0; i < 5; i++) { const lx = -0.55 + i * 0.275; a.v('madeira_clara', [lx, 0.25, 0.06], [lx + (r() - 0.5) * 0.1, 1.2 + r() * 0.12, -0.02], 0.06); a.b('madeira', lx, 0.35, 0.06, 0.15, 0.04, 0.04); } // espadas de treino
  a.g('madeira', new THREE.CylinderGeometry(0.28, 0.28, 0.05, 12), 0.95, 0.5, 0.2, Math.PI / 2, 0, 0); a.g('metal', new THREE.SphereGeometry(0.06, 6, 5), 0.95, 0.5, 0.25);
}

function forjaBrasa(col, o, kit, saida) { // forno de pedra aberto na frente, com brasa viva, chaminé e fumaça; emite luz dinâmica (tipo `forja`)
  const a = ajudantes(col, o);
  a.b('pedra', 0, 0.45, 0, 1.4, 0.9, 1.0); a.b('pedra', 0, 0.93, 0, 1.5, 0.08, 1.1);
  a.b('lareira_vao', 0, 0.55, 0.51, 0.7, 0.4, 0.03); a.p('brasa', 0, 0.55, 0.53, 0.62, 0.3); a.b('brasa', 0, 0.99, 0.15, 0.75, 0.05, 0.5); // boca e leito de brasa
  a.b('pedra', 0, 1.55, -0.3, 1.1, 1.2, 0.45); a.b('pedra', 0, 2.5, -0.3, 0.55, 1.4, 0.55); a.b('pedra', 0, 3.25, -0.3, 0.75, 0.12, 0.75);
  a.b('madeira', 0.85, 0.4, 0.1, 0.4, 0.28, 0.7); a.g('tecido_ocre', new THREE.BoxGeometry(0.34, 0.2, 0.62), 0.85, 0.57, 0.1); // fole
  a.b('madeira', -0.8, 0.5, 0.35, 0.5, 0.4, 0.4); a.g('agua', new THREE.CircleGeometry(0.17, 10).rotateX(-Math.PI / 2), -0.8, 0.71, 0.35, 0, 0, 0, { uv: false }); // tina
  const [wx, wz] = a.L(0, 0.2), [cx, cz] = a.L(0, -0.3);
  saida.luzes.push({ x: wx, y: 1.0, z: wz, tipo: 'forja', id: o.id }); saida.chamines.push({ x: cx, y: 3.4, z: cz });
}

function bigorna(col, o) {
  const a = ajudantes(col, o); a.g('madeira', new THREE.CylinderGeometry(0.28, 0.32, 0.5, 9), 0, 0.25, 0);
  a.b('metal', 0, 0.58, 0, 0.5, 0.15, 0.3); a.b('metal', 0, 0.72, 0, 0.26, 0.15, 0.2); a.b('metal', 0, 0.87, 0, 0.8, 0.14, 0.3);
  a.g('metal', new THREE.ConeGeometry(0.14, 0.4, 6), 0.55, 0.87, 0, 0, 0, -Math.PI / 2);
}

export const PECAS_VILA = { portico, quadro_avisos: quadroAvisos, arvore_queimada: arvoreQueimada, muro_fuligem: muroFuligem, pedra_enegrecida: pedraEnegrecida, canteiro, rack_armas: rackArmas, forja_brasa: forjaBrasa, bigorna };
