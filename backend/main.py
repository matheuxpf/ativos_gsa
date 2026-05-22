from fastapi import FastAPI

app = FastAPI(title="AtivosGSA API", description="API de controle de infraestrutura")

@app.get("/")
def read_root():
    return {"status": "online", "message": "Motor FastAPI rodando perfeitamente!"}
