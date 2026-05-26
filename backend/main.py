from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models, schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AtivosGSA API", description="API de controle de infraestrutura")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
def read_teams(skip: int = 0, limit: int = 10000, db: Session = Depends(get_db)):
    return db.query(models.Team).offset(skip).limit(limit).all()

@app.put("/teams/{team_id}", response_model=schemas.Team)
def update_team(team_id: int, team: schemas.TeamCreate, db: Session = Depends(get_db)):
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not db_team: raise HTTPException(status_code=404, detail="Team not found")
    for key, value in team.model_dump().items():
        setattr(db_team, key, value)
    db.commit()
    db.refresh(db_team)
    return db_team

@app.delete("/teams/{team_id}")
def delete_team(team_id: int, db: Session = Depends(get_db)):
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not db_team: raise HTTPException(status_code=404, detail="Team not found")
    db.delete(db_team)
    db.commit()
    return {"ok": True}

# --- ENDPOINTS ROLES ---
@app.post("/roles/", response_model=schemas.Role)
def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db)):
    db_role = models.Role(**role.model_dump())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

@app.get("/roles/", response_model=list[schemas.Role])
def read_roles(skip: int = 0, limit: int = 10000, db: Session = Depends(get_db)):
    return db.query(models.Role).offset(skip).limit(limit).all()

@app.put("/roles/{role_id}", response_model=schemas.Role)
def update_role(role_id: int, role: schemas.RoleCreate, db: Session = Depends(get_db)):
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role: raise HTTPException(status_code=404, detail="Role not found")
    for key, value in role.model_dump().items():
        setattr(db_role, key, value)
    db.commit()
    db.refresh(db_role)
    return db_role

@app.delete("/roles/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role: raise HTTPException(status_code=404, detail="Role not found")
    db.delete(db_role)
    db.commit()
    return {"ok": True}

# --- ENDPOINTS EMPLOYEES ---
@app.post("/employees/", response_model=schemas.Employee)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    db_emp = models.Employee(**employee.model_dump())
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp

@app.get("/employees/", response_model=list[schemas.Employee])
def read_employees(skip: int = 0, limit: int = 10000, db: Session = Depends(get_db)):
    return db.query(models.Employee).offset(skip).limit(limit).all()

@app.put("/employees/{emp_id}", response_model=schemas.Employee)
def update_employee(emp_id: int, employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    db_emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not db_emp: raise HTTPException(status_code=404, detail="Employee not found")
    for key, value in employee.model_dump().items():
        setattr(db_emp, key, value)
    db.commit()
    db.refresh(db_emp)
    return db_emp

@app.delete("/employees/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db)):
    db_emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not db_emp: raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(db_emp)
    db.commit()
    return {"ok": True}

# --- ENDPOINTS ASSETS ---
@app.post("/assets/", response_model=schemas.Asset)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db)):
    db_asset = models.Asset(**asset.model_dump())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@app.get("/assets/", response_model=list[schemas.Asset])
def read_assets(skip: int = 0, limit: int = 10000, db: Session = Depends(get_db)):
    return db.query(models.Asset).offset(skip).limit(limit).all()

@app.put("/assets/{asset_id}", response_model=schemas.Asset)
def update_asset(asset_id: int, asset: schemas.AssetCreate, db: Session = Depends(get_db)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset: raise HTTPException(status_code=404, detail="Asset not found")
    for key, value in asset.model_dump().items():
        setattr(db_asset, key, value)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@app.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset: raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(db_asset)
    db.commit()
    return {"ok": True}

# --- ENDPOINTS MOVEMENTS ---
@app.post("/movements/", response_model=schemas.Movement)
def create_movement(movement: schemas.MovementCreate, db: Session = Depends(get_db)):
    db_mov = models.Movement(**movement.model_dump())
    db.add(db_mov)
    db.commit()
    db.refresh(db_mov)
    return db_mov

@app.get("/movements/", response_model=list[schemas.Movement])
def read_movements(skip: int = 0, limit: int = 10000, db: Session = Depends(get_db)):
    return db.query(models.Movement).offset(skip).limit(limit).all()

# --- ENDPOINTS AUDIT LOGS ---
@app.post("/audit/", response_model=schemas.AuditLog)
def create_audit(audit: schemas.AuditLogCreate, db: Session = Depends(get_db)):
    db_audit = models.AuditLog(**audit.model_dump())
    db.add(db_audit)
    db.commit()
    db.refresh(db_audit)
    return db_audit

@app.get("/audit/", response_model=list[schemas.AuditLog])
def read_audit(skip: int = 0, limit: int = 10000, db: Session = Depends(get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()
