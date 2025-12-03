from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from train import train_model

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/train")
def train_endpoint():
    result = train_model()
    return result
