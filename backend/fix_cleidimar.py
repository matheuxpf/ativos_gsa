from sqlalchemy.orm import Session
from database import SessionLocal
from models import Employee, Asset
import json

db = SessionLocal()
try:
    membro = db.query(Employee).filter(Employee.id == 105).first()
    supervisor = db.query(Employee).filter(Employee.id == 193).first()
    
    if membro and supervisor:
        # Transfer assets just in case, even though we verified there are none
        assets = db.query(Asset).filter(Asset.current_owner_id == str(membro.id), Asset.current_owner_type == "EMPLOYEE").all()
        for a in assets:
            a.current_owner_id = str(supervisor.id)
            a.current_owner_name = supervisor.name
            
        # Update supervisor name to be the full name
        supervisor.name = "Cleidimar Nunes"
        
        # Delete membro
        db.delete(membro)
        db.commit()
        print("Successfully merged and deleted Cleidimar!")
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()
