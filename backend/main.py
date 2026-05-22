from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models, schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AtivosGSA API", description="API de controle de infraestrutura")

# Liberando o CORS para o React conseguir conversar com a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Na homologacao/producao, colocamos o IP exato aqui
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Motor FastAPI rodando liso com CORS ativado!"}

# --- ENDPOINTS TEAMS ---
@app.post("/teams/", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    db_team = models.Team(**team.model_dump())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

@app.get("/teams/", response_model=list[schemas.Team])
def read_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Team).offset(skip).limit(limit).all()

# --- ENDPOINTS ROLES ---
@app.post("/roles/", response_model=schemas.Role)
def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db)):
    db_team = db.query(models.Team).filter(models.Team.id == role.team_id).first()
    if not db_team:
        raise HTTPException(status_code=404, detail="Operação negada: Equipe não encontrada no sistema.")
    
    db_role = models.Role(**role.model_dump())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

@app.get("/roles/", response_model=list[schemas.Role])
def read_roles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Role).offset(skip).limit(limit).all()
