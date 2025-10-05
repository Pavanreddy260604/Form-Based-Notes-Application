#!/bin/bash

echo "🚀 Starting Ollama FastAPI Server on Render..."

# Ensure model path exists and is writable
mkdir -p /root/.ollama/models

# Start Ollama in background
ollama serve &

# Wait until Ollama is ready
echo "⏳ Waiting for Ollama to start..."
until curl -s http://localhost:11434/api/tags > /dev/null; do
    sleep 2
done
echo "✅ Ollama is running!"

# Pull model if not already present
MODEL_NAME="gemma2:2b"
if ! ollama list | grep -q "$MODEL_NAME"; then
    echo "📥 Pulling $MODEL_NAME model..."
    ollama pull "$MODEL_NAME"
    echo "✅ Model pulled successfully!"
else
    echo "✅ Model $MODEL_NAME already exists!"
fi

# Start FastAPI server
echo "🌐 Starting FastAPI on port $PORT..."
python3 -m uvicorn gpt:app --host 0.0.0.0 --port $PORT
