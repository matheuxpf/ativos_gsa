from database import SessionLocal
from models import Asset, Employee, Team, Role, Movement, AuditLog

db = SessionLocal()

print(f"Assets: {db.query(Asset).count()}")
print(f"Employees: {db.query(Employee).count()}")
print(f"Teams: {db.query(Team).count()}")
print(f"Roles: {db.query(Role).count()}")
print(f"Movements: {db.query(Movement).count()}")
print(f"AuditLogs: {db.query(AuditLog).count()}")

db.close()
