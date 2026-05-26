from sqlalchemy.orm import Session
from database import SessionLocal
from models import Team, Role, Employee
import sys

# LOTE 1 Data
lote1 = [
    ("Denis Arantes", "COMERCIAL", "GO", "CV GO"),
    ("Glauber Vinicius", "COMERCIAL", "GO", "CV GO"),
    ("Joao Neto", "COMERCIAL", "GO", "CV GO"),
    ("Marcelo Oliveira", "COMERCIAL", "GO", "CV GO"),
    ("Alex Pires da Silva", "COMERCIAL", "GO", "Redes"),
    ("Alcier Augusto", "COMERCIAL", "GO", "Vetor"),
    ("Elucilvo Barbosa", "COMERCIAL", "GO", "Vetor"),
    ("Luis Claudio", "COMERCIAL", "GO", "Vetor"),
    ("Ruy Pires de Andrade", "COMERCIAL", "GO", "Vetor"),
    ("Silas Alves da Silva", "COMERCIAL", "MT", "CV MT"),
    ("Diogo", "COMERCIAL", "MT", "CV MT"),
    ("Ederson Fabiano", "COMERCIAL", "MT", "CV MT"),
    ("Ellier Faria", "COMERCIAL", "MT", "CV MT"),
    ("Jose Pedro", "COMERCIAL", "TO", "CV TO"),
    ("Edmilson Alexandre", "COMERCIAL", "TO", "CV TO"),
    ("Fernando Monteiro", "COMERCIAL", "TO", "CV TO"),
    ("Gleugilvan Linhares", "COMERCIAL", "TO", "CV TO"),
    ("Cleidimar", "ADMINISTRATIVO", "GO", "Televendas"),
    ("Camila de Paula Santos", "COMERCIAL", "MT", "CV MT"),
    ("Gabriel Gomes da Neiva", "COMERCIAL", "GO", "Redes"),
    ("Leandro Camargos de Sousa", "COMERCIAL", "GO", "CV GO"),
    ("Maykel Sulivan S. Santos", "COMERCIAL", "GO", "Vetor")
]

db = SessionLocal()
try:
    for name, channel, region, team_name in lote1:
        # 1. Lookup or create Team
        team = db.query(Team).filter(Team.name == team_name, Team.region == region).first()
        if not team:
            # Let's check if there's a team with just "CV" and we rename it?
            # Actually, it's safer to just create a new one to be precise.
            team = Team(name=team_name, region=region, channel=channel)
            db.add(team)
            db.commit()
            db.refresh(team)
            
        # 2. Lookup or create Role
        role_desc = f"Supervisor(a) - {team_name}"
        role = db.query(Role).filter(Role.description == role_desc, Role.region == region, Role.team_id == team.id).first()
        if not role:
            # Generate code
            max_code_role = db.query(Role).order_by(Role.id.desc()).first()
            new_num = 1
            if max_code_role and max_code_role.code and max_code_role.code.startswith("VG-"):
                try:
                    new_num = int(max_code_role.code.split("-")[1]) + 1
                except: pass
            code = f"VG-{new_num:04d}"
            
            role = Role(code=code, description=role_desc, region=region, team_id=team.id, status="ATIVA")
            db.add(role)
            db.commit()
            db.refresh(role)
            
        # 3. Lookup or create Employee
        emp = db.query(Employee).filter(Employee.name == name).first()
        if not emp:
            emp = Employee(name=name, role=role.description, region=region, team_id=team.id, role_id=role.id, status="Ativo")
            db.add(emp)
            db.commit()
        else:
            # Update existing if needed
            emp.role = role.description
            emp.region = region
            emp.team_id = team.id
            emp.role_id = role.id
            db.commit()
            
    print("Ingestao LOTE 1 concluida com sucesso!")
except Exception as e:
    print(f"Erro na ingestao: {e}")
finally:
    db.close()
