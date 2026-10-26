// WAV PCM 16 bits sem dependências (escrita e leitura do cabeçalho). Compressão para Opus/Ogg é etapa de build (ffmpeg).
export function codificarWav(canais, taxa) {
  const n = canais[0].length, nc = canais.length;
  const buf = Buffer.alloc(44 + n * nc * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * nc * 2, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(nc, 22);
  buf.writeUInt32LE(taxa, 24); buf.writeUInt32LE(taxa * nc * 2, 28); buf.writeUInt16LE(nc * 2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * nc * 2, 40);
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, canais[c][i])) * 32767), 44 + (i * nc + c) * 2);
  return buf;
}

export function lerCabecalhoWav(buf) {
  if (buf.length < 44 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('não é um WAV válido');
  const canais = buf.readUInt16LE(22), taxa = buf.readUInt32LE(24), bits = buf.readUInt16LE(34), bytesDados = buf.readUInt32LE(40);
  return { canais, taxa, bits, amostras: bytesDados / (canais * (bits / 8)) };
}
