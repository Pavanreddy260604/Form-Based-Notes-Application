from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import ollama
import json
import os
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
    model: Optional[str] = "gemma2:2b"  # Changed to smaller model for Railway

class AIChatRequest(BaseModel):
    message: str
    userId: str
    model: Optional[str] = "gemma2:2b"  # Changed to smaller model for Railway

@app.get("/")
async def root():
    return {
        "message": "Ollama API Server is running on Railway",
        "status": "active",
        "endpoints": {
            "health": "/health",
            "generate": "/generate", 
            "stream_chat": "/api/ai/chat",
            "pull_model": "/pull-model"
        }
    }

@app.post("/generate")
async def generate_text(request: PromptRequest):
    """
    Generate text using specified model (default: gemma2:2b)
    """
    try:
        response = ollama.chat(
            model=request.model,
            messages=[{"role": "user", "content": request.prompt}]
        )
        
        if response and 'message' in response and 'content' in response['message']:
            return {
                "response": response['message']['content'],
                "model": request.model,
                "success": True
            }
        else:
            return {"response": "No content generated", "success": False}
            
    except Exception as e:
        print("Ollama Error:", str(e))
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/api/ai/chat")
async def ai_chat_stream(request: AIChatRequest):
    """
    Streaming chat endpoint for Study Notes app
    """
    try:
        # Create the streaming response
        async def generate():
            stream = ollama.chat(
                model=request.model,
                messages=[{"role": "user", "content": request.message}],
                stream=True
            )
            
            for chunk in stream:
                if 'message' in chunk and 'content' in chunk['message']:
                    content = chunk['message']['content']
                    # Format as Server-Sent Events
                    data = {
                        "content": content,
                        "finish_reason": None
                    }
                    yield f"data: {json.dumps(data)}\n\n"
            
            # Send final completion signal
            yield f"data: {json.dumps({'content': '', 'finish_reason': 'stop'})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except Exception as e:
        print("Ollama Streaming Error:", str(e))
        raise HTTPException(status_code=500, detail=f"Streaming failed: {str(e)}")

# Test if Ollama is working
@app.get("/health")
async def health_check():
    try:
        models = ollama.list()
        model_available = any('gemma2:2b' in model['name'] for model in models['models'])
        
        return {
            "status": "healthy",
            "ollama_running": True,
            "model_available": model_available,
            "available_models": [model['name'] for model in models['models']],
            "environment": "railway"
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "ollama_running": False,
            "error": str(e),
            "environment": "railway"
        }

# Pull model if not available
@app.post("/pull-model")
async def pull_model(model: str = "gemma2:2b"):
    """
    Pull a model if it's not available
    """
    try:
        result = ollama.pull(model)
        return {
            "status": "success", 
            "message": f"Model {model} pulled successfully",
            "details": "Check Railway logs for download progress"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to pull model: {str(e)}")

@app.get("/docs")
async def get_docs():
    """Redirect to API documentation"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)