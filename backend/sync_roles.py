from database import SessionLocal
from models import Employee, Role

db = SessionLocal()

# Obter todas as roles para criar um dicionario rapido
roles = db.query(Role).all()
role_dict = {r.id: r.description for r in roles}

# Obter todos os funcionarios
employees = db.query(Employee).all()
count = 0

for e in employees:
    if e.role_id and e.role_id in role_dict:
        # Se a role atual for diferente da description da Role vinculada
        if e.role != role_dict[e.role_id]:
            old = e.role
            e.role = role_dict[e.role_id]
            print(f"[{e.id}] {e.name}: '{old}' -> '{e.role}'")
            count += 1

db.commit()
db.close()
print(f"Total de funcionarios atualizados: {count}")
