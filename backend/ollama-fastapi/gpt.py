from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import ollama
import json
from typing import Optional

app = FastAPI(title="Ollama AI Server", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str
    model: Optional[str] = "gemma2:2b"

class AIChatRequest(BaseModel):
    message: str
    userId: str
    model: Optional[str] = "gemma2:2b"

@app.get("/")
async def root():
    return {"message": "Ollama API Server is running"}

@app.post("/generate")
async def generate_text(request: PromptRequest):
    try:
        response = ollama.chat(
            model=request.model,
            messages=[{"role": "user", "content": request.prompt}]
        )
        return {"response": response['message']['content']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/api/ai/chat")
async def ai_chat_stream(request: AIChatRequest):
    try:
        async def generate():
            stream = ollama.chat(
                model=request.model,
                messages=[{"role": "user", "content": request.message}],
                stream=True
            )
            for chunk in stream:
                if 'message' in chunk and 'content' in chunk['message']:
                    content = chunk['message']['content']
                    data = {"content": content, "finish_reason": None}
                    yield f"data: {json.dumps(data)}\n\n"
            yield f"data: {json.dumps({'content': '', 'finish_reason': 'stop'})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/plain",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Streaming failed: {str(e)}")

@app.get("/health")
async def health_check():
    try:
        models = ollama.list()
        gemma_available = any('gemma2:2b' in model['name'] for model in models['models'])
        return {
            "status": "healthy",
            "ollama_running": True,
            "gemma2_2b_available": gemma_available,
            "available_models": [model['name'] for model in models['models']]
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama not available: {str(e)}")

@app.post("/pull-model")
async def pull_model(model: str = "gemma2:2b"):
    try:
        result = ollama.pull(model)
        return {"status": "success", "message": f"Model {model} pulled successfully", "details": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to pull model: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
