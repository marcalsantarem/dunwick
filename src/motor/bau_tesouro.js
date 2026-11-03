// Baú de TESOURO (v0.1.2b): achado único, não é baú de guardar itens. Corpo de tábuas com cintas de latão (geometria estática, fundida no kit como o resto) e
// TAMPA separada, articulada na borda de trás, que abre com uma animação simples (`definir(0..1)`). O monte de moedas e gemas fica dentro do corpo: some sob a
// tampa fechada e aparece quando ela abre. Estado aberto/fechado: dado do objeto (`aberto`) ou, em jogo, cena.definirBau(id, aberto).
import * as THREE from 'three';
import { ajudantes } from './kit_vila.js';
import { rng } from './kit.js';

export const BAU = { w: 1.0, d: 0.66, h: 0.5, abertura_graus: 112 };
const RAD = Math.PI / 180;

/** Corpo do baú (estático) + tesouro dentro. */
export function corpoBau(col, o) {
  const a = ajudantes(col, o), { w, d, h } = BAU, r = rng(o.seed ?? 1);
  a.b('tabuas', 0, h / 2, 0, w, h, d); a.b('madeira', 0, 0.05, 0, w + 0.04, 0.1, d + 0.04); // corpo e rodapé
  for (const s of [-1, 1]) a.b('latao', s * (w / 2 - 0.12), h / 2, 0, 0.1, h + 0.02, d + 0.03); // cintas verticais
  a.b('latao', 0, h - 0.11, d / 2 + 0.02, 0.18, 0.2, 0.03); a.b('metal', 0, h - 0.13, d / 2 + 0.04, 0.04, 0.08, 0.02); // fechadura
  for (let i = 0; i < 16; i++) a.g('latao', new THREE.CylinderGeometry(0.06, 0.06, 0.02, 8), (r() - 0.5) * (w - 0.3), h + 0.005 + (i % 3) * 0.02, (r() - 0.5) * (d - 0.25), (r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4); // moedas
  for (let i = 0; i < 3; i++) a.g('tecido_azul', new THREE.OctahedronGeometry(0.05), (r() - 0.5) * 0.5, h + 0.07, (r() - 0.5) * 0.2); // gemas
}

/** Tampa articulada: `grupo` fica na borda de trás do corpo; `definir(t)` com t de 0 (fechada) a 1 (aberta). */
export function criarTampaBau(o, materiais) {
  const { w, d, h, abertura_graus } = BAU, ry = (o.rot ?? 0) * RAD, c = Math.cos(ry), s = Math.sin(ry), grupo = new THREE.Group(), pivo = new THREE.Group(), r = d / 2;
  const casca = (rr, larg) => new THREE.CylinderGeometry(rr, rr, larg, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2); // meia-cana com a curva para cima, eixo em x
  const parte = (geo, mat, x = 0) => { const m = new THREE.Mesh(geo, materiais[mat]); m.position.set(x, 0, d / 2); m.castShadow = true; m.receiveShadow = true; pivo.add(m); return m; };
  parte(casca(r, w), 'madeira');
  for (const sx of [-1, 1]) { parte(casca(r + 0.012, 0.1), 'latao', sx * (w / 2 - 0.12)); const tampa = new THREE.Mesh(new THREE.CircleGeometry(r, 14, 0, Math.PI).rotateY(sx * (Math.PI / 2)), materiais.tabuas); tampa.position.set(sx * (w / 2), 0, d / 2); tampa.castShadow = true; pivo.add(tampa); }
  grupo.add(pivo); grupo.position.set(o.x + (-d / 2) * s, h, o.z + (-d / 2) * c); grupo.rotation.y = ry; // borda de trás em coordenadas locais (0, h, −d/2)
  grupo.name = `bau_tampa_${o.id}`;
  return { grupo, definir(t) { pivo.rotation.x = -t * abertura_graus * RAD; } };
}
