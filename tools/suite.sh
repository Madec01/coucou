#!/usr/bin/env bash
# La suite de tests de Touche !, en deux vitesses :
#   tools/suite.sh court    — les tests Node (gestes, partie, poissons) et le test de fumée navigateur
#   tools/suite.sh complet  — pareil, plus les captures des moments clés dans docs/releve/
# Le script lance lui-même le serveur statique du port 8765 s'il manque.
set -euo pipefail
cd "$(dirname "$0")/.."
MODE="${1:-court}"

echo "== Tests Node"
node --test tests/*.test.js

if ! curl -s -o /dev/null http://localhost:8765/; then
  echo "== Serveur statique sur 8765"
  python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1 &
  SERVEUR=$!
  trap 'kill $SERVEUR 2>/dev/null || true' EXIT
  for _ in $(seq 1 30); do curl -s -o /dev/null http://localhost:8765/ && break; sleep 0.2; done
fi

echo "== Fumée navigateur"
node tests/gate.js http://localhost:8765/

if [ "$MODE" = "complet" ]; then
  echo "== Captures"
  mkdir -p docs/releve
  node tools/capture.js docs/releve
fi
echo "== Suite $MODE : tout est passé."
