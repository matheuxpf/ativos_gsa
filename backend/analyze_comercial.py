from sqlalchemy.orm import Session
from database import SessionLocal
from models import Team, Employee, Role
import json

db = SessionLocal()
try:
    generic_teams = db.query(Team).filter(Team.name.ilike("Comercial"), Team.channel == "COMERCIAL").all()
    print("Generic Teams Found:")
    for t in generic_teams:
        print(f"ID: {t.id} - {t.name} - {t.region}")
        
    print("\nEmployees in generic teams:")
    generic_team_ids = [t.id for t in generic_teams]
    employees_in_generic = db.query(Employee).filter(Employee.team_id.in_(generic_team_ids)).all()
    
    for emp in employees_in_generic:
        # Check if this employee exists elsewhere
        duplicates = db.query(Employee).filter(Employee.name == emp.name, Employee.id != emp.id).all()
        if duplicates:
            print(f"[DUPLICATE FOUND] {emp.name} (Generic Team {emp.team_id}) -> Duplicates in Teams: {[d.team_id for d in duplicates]}")
        else:
            print(f"[NO DUPLICATE] {emp.name} (Generic Team {emp.team_id}) - Wait, what to do with this one?")
            
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
