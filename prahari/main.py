from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prahari.modules.kavach.router import router as kavach_router
from prahari.modules.currency.router import router as currency_router

app = FastAPI(title="Prahari API")

# Add CORS so the Vite frontend (port 3000) can talk to this FastAPI backend (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kavach_router)
app.include_router(currency_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("prahari.main:app", host="0.0.0.0", port=8000, reload=True)

