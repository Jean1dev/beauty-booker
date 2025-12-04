#!/bin/bash

echo "🚀 Iniciando desenvolvimento local com ngrok..."
echo ""

if ! command -v ngrok &> /dev/null; then
  echo "❌ ngrok não encontrado!"
  echo "Instale com: brew install ngrok"
  echo "Ou use: npx ngrok http 5001"
  exit 1
fi

echo "1️⃣ Iniciando Firebase Emulator..."
cd functions
npm run build
cd ..
firebase emulators:start --only functions &
EMULATOR_PID=$!

echo "⏳ Aguardando emulador iniciar..."
sleep 5

echo "2️⃣ Iniciando ngrok..."
ngrok http 5001 &
NGROK_PID=$!

echo "⏳ Aguardando ngrok iniciar..."
sleep 3

NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
  echo "❌ Não foi possível obter URL do ngrok"
  kill $EMULATOR_PID $NGROK_PID 2>/dev/null
  exit 1
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 URLs:"
echo "   Emulator: http://localhost:5001"
echo "   Ngrok:    $NGROK_URL"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Adicione esta URL no Google Cloud Console:"
echo "      $NGROK_URL/googleCalendarCallback"
echo ""
echo "   2. Atualize .env.local com:"
echo "      GOOGLE_REDIRECT_URI=$NGROK_URL/googleCalendarCallback"
echo ""
echo "Pressione Ctrl+C para parar"

trap "kill $EMULATOR_PID $NGROK_PID 2>/dev/null; exit" INT TERM

wait

