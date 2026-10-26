// PNG sem dependências: escrita RGBA 8 bits e leitura (RGBA/RGB 8 bits, sem entrelaçamento, todos os filtros).
// Usado pelos geradores de assets (04/07) e pelo validador de assets. Imagem = { w, h, px: Uint8Array RGBA }.
import { deflateSync, inflateSync } from 'node:zlib';

const ASSINATURA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const TAB_CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TAB_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function bloco(tipo, dados) {
  const t = Buffer.from(tipo, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, dados])));
  return Buffer.concat([len, t, dados, crc]);
}

export const novaImagem = (w, h) => ({ w, h, px: new Uint8Array(w * h * 4) });

export function pintar(img, x, y, [r, g, b, a = 255]) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (y * img.w + x) * 4;
  img.px[i] = r; img.px[i + 1] = g; img.px[i + 2] = b; img.px[i + 3] = a;
}

export function codificarPng({ w, h, px }) {
  const cru = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    cru[y * (w * 4 + 1)] = 0;
    cru.set(px.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([ASSINATURA, bloco('IHDR', ihdr), bloco('IDAT', deflateSync(cru, { level: 9 })), bloco('IEND', Buffer.alloc(0))]);
}

// Lê o PNG e devolve { w, h, px } (sempre RGBA). Lança Error com mensagem em português se o formato não for aceito.
export function decodificarPng(buf) {
  if (buf.length < 33 || !buf.subarray(0, 8).equals(ASSINATURA)) throw new Error('não é um PNG válido (assinatura)');
  let pos = 8, w = 0, h = 0, profundidade = 0, tipoCor = 0, entrelacado = 0;
  const idat = [];
  while (pos + 12 <= buf.length) {
    const len = buf.readUInt32BE(pos), tipo = buf.toString('ascii', pos + 4, pos + 8), dados = buf.subarray(pos + 8, pos + 8 + len);
    if (tipo === 'IHDR') { w = dados.readUInt32BE(0); h = dados.readUInt32BE(4); profundidade = dados[8]; tipoCor = dados[9]; entrelacado = dados[12]; }
    else if (tipo === 'IDAT') idat.push(dados);
    else if (tipo === 'IEND') break;
    pos += 12 + len;
  }
  if (profundidade !== 8 || (tipoCor !== 6 && tipoCor !== 2)) throw new Error(`formato não suportado (profundidade ${profundidade}, tipo de cor ${tipoCor}); use RGBA ou RGB de 8 bits`);
  if (entrelacado) throw new Error('PNG entrelaçado não é suportado');
  const canais = tipoCor === 6 ? 4 : 3, linha = w * canais;
  const cru = inflateSync(Buffer.concat(idat));
  if (cru.length < (linha + 1) * h) throw new Error('dados de imagem truncados');
  const px = new Uint8Array(w * h * 4), ant = new Uint8Array(linha), atual = new Uint8Array(linha);
  for (let y = 0; y < h; y++) {
    const filtro = cru[y * (linha + 1)];
    for (let i = 0; i < linha; i++) {
      const x = cru[y * (linha + 1) + 1 + i], a = i >= canais ? atual[i - canais] : 0, b = ant[i], c = i >= canais ? ant[i - canais] : 0;
      let v;
      switch (filtro) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); break; }
        default: throw new Error(`filtro PNG desconhecido (${filtro})`);
      }
      atual[i] = v & 0xff;
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      px[o] = atual[x * canais]; px[o + 1] = atual[x * canais + 1]; px[o + 2] = atual[x * canais + 2]; px[o + 3] = canais === 4 ? atual[x * canais + 3] : 255;
    }
    ant.set(atual);
  }
  return { w, h, px };
}

// Cabeçalho apenas (largura/altura) sem decodificar.
export function lerCabecalhoPng(buf) {
  if (buf.length < 24 || !buf.subarray(0, 8).equals(ASSINATURA)) throw new Error('não é um PNG válido (assinatura)');
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

// Ruído determinístico para os placeholders (sem Math.random: saída reproduzível).
export function rng(semente) {
  let s = semente >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
