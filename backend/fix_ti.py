from database import SessionLocal
from models import Employee, Role

db = SessionLocal()

caina = db.query(Employee).filter(Employee.name.ilike('%cain%')).first()
if caina:
    # Assign him to TI (Role ID 1)
    role_ti = db.query(Role).filter(Role.description == 'TI').first()
    if role_ti:
        caina.role_id = role_ti.id
        caina.role = role_ti.description
        caina.team_id = role_ti.team_id
        caina.region = role_ti.region
        db.commit()
        print(f"Caina atualizado para {role_ti.description}!")

mp = db.query(Employee).filter(Employee.name.ilike('%matheus pereira%')).first()
if mp:
    role_ti = db.query(Role).filter(Role.description == 'TI').first()
    if role_ti:
        mp.role_id = role_ti.id
        mp.role = role_ti.description
        mp.team_id = role_ti.team_id
        mp.region = role_ti.region
        db.commit()
        print(f"Matheus Pereira atualizado para {role_ti.description}!")

db.close()
