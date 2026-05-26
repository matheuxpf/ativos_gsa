from database import SessionLocal
from models import Employee, Role

db = SessionLocal()

emp = db.query(Employee).filter(Employee.name.ilike('%cain%')).first()
if emp:
    print(f"Encontrado: {emp.name} | Role_ID={emp.role_id} | Role_Text={emp.role}")
    if emp.role_id:
        role = db.query(Role).filter(Role.id == emp.role_id).first()
        if role:
            emp.role = role.description
            print(f"  -> Atualizando role text para: {role.description}")
            db.commit()

matheus = db.query(Employee).filter(Employee.name.ilike('%matheus%')).first()
if matheus:
    print(f"Encontrado: {matheus.name} | Role_ID={matheus.role_id} | Role_Text={matheus.role}")
    if matheus.role_id:
        role = db.query(Role).filter(Role.id == matheus.role_id).first()
        if role:
            matheus.role = role.description
            print(f"  -> Atualizando role text para: {role.description}")
            db.commit()

db.close()
print("Feito")
