from sqlalchemy.orm import Session
from database import SessionLocal
from models import Team, Employee, Role

db = SessionLocal()
try:
    generic_teams = db.query(Team).filter(Team.name.ilike("Comercial"), Team.channel == "COMERCIAL").all()
    
    for team in generic_teams:
        print(f"Processing Team: {team.name} - {team.region}")
        
        # 1. Delete Employees in this team
        employees = db.query(Employee).filter(Employee.team_id == team.id).all()
        for emp in employees:
            print(f"  Deleting Employee: {emp.name}")
            db.delete(emp)
            
        # 2. Delete Roles in this team
        roles = db.query(Role).filter(Role.team_id == team.id).all()
        for role in roles:
            print(f"  Deleting Role: {role.code} - {role.description}")
            db.delete(role)
            
        # 3. Delete the Team
        print(f"  Deleting Team: {team.name}")
        db.delete(team)
        
    db.commit()
    print("Cleanup successful.")
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()
