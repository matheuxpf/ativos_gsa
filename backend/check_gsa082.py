from database import SessionLocal
from models import Asset

db = SessionLocal()
a = db.query(Asset).filter(Asset.asset_tag == 'GSA082').first()
if a:
    print(f"ID: {a.id}")
    print(f"Tag: {a.asset_tag}")
    print(f"owner_type: {a.current_owner_type}")
    print(f"owner_id: {a.current_owner_id}")
    print(f"owner_name: {a.current_owner_name}")
else:
    print("Not found")
db.close()
