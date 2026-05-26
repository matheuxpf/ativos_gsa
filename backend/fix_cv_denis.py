from database import SessionLocal
from models import Team, Employee, Role

db = SessionLocal()

# 1. Find duplicate teams
teams_go = db.query(Team).filter(Team.region == 'GO').all()
print("=== EQUIPES GO ===")
for t in teams_go:
    print(f"  ID={t.id}  Nome={t.name}  Canal={t.channel}")

cv_team = None
cv_go_team = None
for t in teams_go:
    if t.name == 'CV' and t.region == 'GO':
        cv_team = t
    if t.name == 'CV GO':
        cv_go_team = t

print(f"\nCV (duplicada): ID={cv_team.id if cv_team else 'NAO ENCONTRADA'}")
print(f"CV GO (correta): ID={cv_go_team.id if cv_go_team else 'NAO ENCONTRADA'}")

# 2. Transfer employees from CV to CV GO
if cv_team and cv_go_team:
    emps_cv = db.query(Employee).filter(Employee.team_id == cv_team.id).all()
    print(f"\nFuncionarios na CV duplicada ({len(emps_cv)}):")
    for e in emps_cv:
        print(f"  ID={e.id}  Nome={e.name}  Role={e.role}")
        e.team_id = cv_go_team.id
        e.role = "Supervisor"
        print(f"    -> Transferido para CV GO (ID={cv_go_team.id}) com cargo Supervisor")
    
    # Delete the duplicate CV team
    db.delete(cv_team)
    print(f"\nEquipe CV (ID={cv_team.id}) excluida.")

# 3. Fix Denis Silva role
denis = db.query(Employee).filter(Employee.name.ilike('%denis silva%')).first()
if denis:
    print(f"\n=== DENIS SILVA ===")
    print(f"  ID={denis.id}  Role atual={denis.role}  Team={denis.team_id}")
    
    # Find supervisor role for Vetor
    sup_vetor = db.query(Role).filter(Role.description.ilike('%supervisor%'), Role.description.ilike('%vetor%')).first()
    if sup_vetor:
        denis.role = sup_vetor.description
        denis.role_id = sup_vetor.id
        print(f"  -> Role atualizada para: {sup_vetor.description} (role_id={sup_vetor.id})")
    else:
        # Check what supervisor roles exist
        print("  Nenhuma vaga 'Supervisor Vetor' encontrada. Vagas com 'vetor':")
        vetor_roles = db.query(Role).filter(Role.description.ilike('%vetor%')).all()
        for r in vetor_roles:
            print(f"    ID={r.id} Desc={r.description} Region={r.region}")
        # Just update the role text
        denis.role = "Supervisor Vetor"
        print(f"  -> Role atualizada para: Supervisor Vetor (sem vaga vinculada)")
else:
    print("\nDenis Silva nao encontrado!")

db.commit()
db.close()
print("\nConcluido com sucesso!")
