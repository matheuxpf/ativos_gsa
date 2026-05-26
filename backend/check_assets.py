from sqlalchemy.orm import Session
from database import SessionLocal
from models import Team, Employee, Asset
import json

db = SessionLocal()
try:
    generic_teams = db.query(Team).filter(Team.name.ilike("Comercial"), Team.channel == "COMERCIAL").all()
    generic_team_ids = [t.id for t in generic_teams]
    employees = db.query(Employee).filter(Employee.team_id.in_(generic_team_ids)).all()
    
    for emp in employees:
        assets = db.query(Asset).filter(Asset.current_owner_id == str(emp.id), Asset.current_owner_type == "EMPLOYEE").all()
        if assets:
            print(f"[ASSETS FOUND] {emp.name} has {len(assets)} assets: {[a.asset_tag for a in assets]}")
        else:
            print(f"[NO ASSETS] {emp.name}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
