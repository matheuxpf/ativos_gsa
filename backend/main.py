from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models, schemas

# Cria as tabelas se nao existirem
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AtivosGSA API", description="API de controle de infraestrutura")

@app.get("/")
def read_root():
    return {"status": "online", "message": "Motor FastAPI rodando liso!"}

# ROTA POST: Cria uma nova equipe
@app.post("/teams/", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    db_team = models.Team(**team.model_dump())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

# ROTA GET: Lista todas as equipes
@app.get("/teams/", response_model=list[schemas.Team])
def read_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Team).offset(skip).limit(limit).all()
