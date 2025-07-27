# main.py
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

# --- Modelos de Datos (Pydantic) ---
# Definen la estructura de los JSON que esperamos recibir y enviar.

class Message(BaseModel):
    role: str
    content: str
    source: Optional[str] = None

class OrchestrateRequest(BaseModel):
    prompt: str
    history: List[Message]

class OrchestrateResponse(BaseModel):
    reply: str
    source: str

# --- Inicialización de la App FastAPI ---
app = FastAPI()

# --- Endpoint Principal del Orquestador ---
@app.post("/api/orchestrate", response_model=OrchestrateResponse)
async def orchestrate(request: OrchestrateRequest):
    """
    Este es el único endpoint. Recibe un prompt y decide a qué
    agente o modelo llamar.
    """
    print(f"Prompt recibido: {request.prompt}")

    # --- Lógica del Orquestador (Fase 1 - Simulación) ---
    # Por ahora, simplemente devolveremos una respuesta simulada
    # para confirmar que la conexión con el frontend funciona.
    # En el siguiente paso, aquí irá la lógica del app_agent.

    try:
        # Simulación: Devolver el prompt en mayúsculas como si un 'agente' lo hubiera procesado.
        simulated_reply = f"El orquestador ha procesado tu prompt: '{request.prompt.upper()}'"
        source_agent = "app_agent (Simulado)"

        return OrchestrateResponse(reply=simulated_reply, source=source_agent)

    except Exception as e:
        print(f"Error en el orquestador: {e}")
        raise HTTPException(status_code=500, detail="Error interno en el orquestador.")

# --- Endpoint de Verificación (Opcional pero útil) ---
@app.get("/")
def read_root():
    return {"status": "El backend del orquestador Centralblack está funcionando."}

