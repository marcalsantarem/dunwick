#!/bin/sh
# Roda toda a matriz de medições, em sequência (uma por vez, para não competir por GPU). Servidor deve estar ativo.
cd "$(dirname "$0")/.."
for o in three babylon; do
  for g in diorama multidao base pos luzes res carregamento audio nitidezoz nitidez; do
    echo "### $o $g"; node ferramentas/lote.mjs $o $g
  done
done
echo FIM
