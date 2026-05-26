from database import SessionLocal
from models import Role

db = SessionLocal()

roles = db.query(Role).all()
count = 0
for r in roles:
    if r.description and r.description.startswith("Membro - "):
        old = r.description
        r.description = r.description.replace("Membro - ", "", 1)
        print(f"  {old}  ->  {r.description}")
        count += 1

db.commit()
db.close()
print(f"\n✅ {count} vagas atualizadas.")
