from sqlalchemy.orm import Session
from database import SessionLocal
from models import Employee, Asset
import json

db = SessionLocal()
try:
    cleidimars = db.query(Employee).filter(Employee.name.ilike("%cleidimar%")).all()
    
    for c in cleidimars:
        assets = db.query(Asset).filter(Asset.current_owner_id == str(c.id), Asset.current_owner_type == "EMPLOYEE").all()
        asset_list = [a.asset_tag for a in assets]
        print(f"ID: {c.id} - Nome: {c.name} - Role: {c.role} - Assets: {asset_list}")

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
