import pandas as pd
import requests

FILE_PATH = '../../Maquinas_Oficial.xlsx'
API_URL = "http://127.0.0.1:8000"

def map_department(raw_dept):
    d = str(raw_dept).strip()
    team_name = d
    region = "GO"
    channel = "ADMINISTRATIVO"
    
    d_lower = d.lower()
    
    # Tratamento Fundação
    if d_lower in ['fundação', 'fundação ns', 'fundaão', 'fundaão ns', 'fundacao', 'fundacao ns']:
        team_name = 'Fundação'
        
    # Remapeamento de Gerentes
    elif d_lower == 'gerente operacional':
        team_name = 'Processos'
    elif d_lower == 'gerente key account':
        team_name = 'Key Account'
        channel = 'COMERCIAL'
    elif d_lower == 'gerente de p&d':
        team_name = 'P&D'
    elif d_lower == 'gerente de compras':
        team_name = 'Compras'
    elif d_lower == 'diretor indústria':
        team_name = 'Indústria'
    elif d_lower == 'diretor':
        team_name = 'Diretoria'
    elif d_lower == 'gerente de vendas':
        team_name = 'Comercial'
        channel = 'COMERCIAL'
        
    # Comercial e Regiões Especiais
    elif d_lower.startswith('comercial'):
        channel = 'COMERCIAL'
        if 'mt' in d_lower:
            team_name = 'Comercial'
            region = 'MT'
        elif 'ma' in d_lower:
            team_name = 'Comercial'
            region = 'MA'
        elif 'vetor to' in d_lower:
            team_name = 'Vetor'
            region = 'TO'
        elif 'vetor' in d_lower:
            team_name = 'Vetor'
        elif 'dona raiz' in d_lower:
            team_name = 'Dona Raiz'
        elif 'exporta' in d_lower:
            team_name = 'Exportação'
        elif 'indireto' in d_lower:
            team_name = 'Indireto'
        elif 'redes' in d_lower:
            team_name = 'Redes'
        elif 'cv' in d_lower:
            team_name = 'CV'
        else:
            team_name = 'Comercial'
            
    elif d_lower == 'vetor':
        team_name = 'Vetor'
        channel = 'COMERCIAL'
        
    # Logistica / Expedição fora de GO
    elif 'expedi' in d_lower and 'to' in d_lower:
        team_name = 'Expedição'
        region = 'TO'
    elif 'expedi' in d_lower and 'mt' in d_lower:
        team_name = 'Expedição'
        region = 'MT'
        
    return team_name, region, channel

def is_real_person(name):
    if not name: return False
    n = str(name).strip().lower()
    non_persons = [
        'não possui', 'nao possui', 'no possui', 'livre', 'admgsa', 'descarte',
        'furto', 'pesquisarh', 'vivo'
    ]
    if n in non_persons: return False
    return True

def ingest_data():
    print("Iniciando Ingestão de Dados...")
    df = pd.read_excel(FILE_PATH)
    
    df = df[df['TIPO DO DISPOSITIVO'].isin(['Notebook', 'Desktop'])]
    df = df[~df['COLABORADOR'].astype(str).str.contains('Servidor', case=False, na=False)]
    df = df.fillna("")

    for index, row in df.iterrows():
        colab_lower = str(row['COLABORADOR']).strip().lower()
        
        industria_tags = ['macarrão', 'macarrao', 'macarro', 'unilever', 'primeira linha', 'matéria prima', 'materia prima', 'matria prima', 'etiqueta']
        if colab_lower in industria_tags:
            obs = str(df.at[index, 'OBSERVAÇÃO'])
            df.at[index, 'OBSERVAÇÃO'] = f"{obs} | TAG ANTERIOR: {row['COLABORADOR']}"
            df.at[index, 'DEPARTAMENTO'] = 'Indústria'
            df.at[index, 'COLABORADOR'] = 'Equipamentos Indústria'
            
        balanca_tags = ['balança', 'balanca', 'balana']
        if colab_lower in balanca_tags:
            obs = str(df.at[index, 'OBSERVAÇÃO'])
            df.at[index, 'OBSERVAÇÃO'] = f"{obs} | TAG ANTERIOR: {row['COLABORADOR']}"
            df.at[index, 'DEPARTAMENTO'] = 'DCI'
            df.at[index, 'COLABORADOR'] = 'Equipamentos DCI'

    print("1. Processando Departamentos (Teams) e Vagas (Roles)...")
    team_dict = {} 
    role_dict = {} 
    team_map = {}  
    role_map = {}  

    for index, row in df.iterrows():
        raw_dept = str(row['DEPARTAMENTO']).strip()
        if not raw_dept: continue
        
        t_name, t_region, t_channel = map_department(raw_dept)
        key = (t_name, t_region, t_channel)
        
        if key not in team_dict:
            res_team = requests.post(f"{API_URL}/teams/", json={
                "name": t_name,
                "region": t_region,
                "channel": t_channel
            })
            if res_team.status_code == 200:
                t_data = res_team.json()
                team_dict[key] = t_data["id"]
                
                role_desc = f"Membro - {t_name}"
                codigo = f"VG-{t_data['id']:04d}"
                res_role = requests.post(f"{API_URL}/roles/", json={
                    "code": codigo,
                    "description": role_desc,
                    "region": t_region,
                    "team_id": t_data["id"]
                })
                if res_role.status_code == 200:
                    role_dict[key] = res_role.json()["id"]
            else:
                print(f"Erro ao criar Team '{t_name}': {res_team.text}")
                continue
                
        team_map[raw_dept] = team_dict[key]
        role_map[raw_dept] = role_dict[key]

    print("2. Processando Colaboradores (Employees)...")
    employee_map = {}
    for index, row in df.iterrows():
        colab = str(row['COLABORADOR']).strip()
        raw_dept = str(row['DEPARTAMENTO']).strip()
        
        if is_real_person(colab) and colab not in employee_map and raw_dept in team_map:
            t_name, t_region, t_channel = map_department(raw_dept)
            res_emp = requests.post(f"{API_URL}/employees/", json={
                "name": colab,
                "role": f"Membro - {t_name}",
                "region": t_region,
                "team_id": team_map[raw_dept],
                "role_id": role_map[raw_dept]
            })
            if res_emp.status_code == 200:
                e_data = res_emp.json()
                employee_map[colab] = e_data["id"]
            else:
                print(f"Erro ao criar Employee '{colab}': {res_emp.text}")

    print("3. Processando Ativos (Assets)...")
    for index, row in df.iterrows():
        tipo = str(row['TIPO DO DISPOSITIVO']).strip()
        nome_disp = str(row['NOME DO DISPOSITIVO']).strip()
        colab = str(row['COLABORADOR']).strip()
        
        if not tipo or not nome_disp: continue

        owner_type = "FUNCIONÁRIO"
        owner_id = ""
        owner_name = ""
        
        if is_real_person(colab) and colab in employee_map:
            owner_id = str(employee_map[colab])
            owner_name = colab
        else:
            owner_type = "ESTOQUE"
            owner_id = "ESTOQUE"
            owner_name = "Estoque Central"

        obs_extra = ""
        if not is_real_person(colab) and colab:
            obs_extra = f" | TAG ANTERIOR: {colab}"

        detalhes = f"Proc: {row['PROCESSADOR']} | RAM: {row['MEMÓRIA RAM TOTAL']} | Armaz: {row['ARMAZENAMENTO']} | Ano: {row['ANO']} | OBS: {row['OBSERVAÇÃO']}{obs_extra}"

        res_asset = requests.post(f"{API_URL}/assets/", json={
            "type": tipo,
            "brand": "Genérica",
            "asset_tag": nome_disp,
            "primary_id": str(row.get('IP INTERNO', '')),
            "status": "EM USO" if owner_type == "FUNCIONÁRIO" else "EM ESTOQUE",
            "state": "USADO",
            "details": detalhes[:200],
            "current_owner_type": owner_type,
            "current_owner_id": owner_id,
            "current_owner_name": owner_name
        })

    print("Ingestão concluída!")

if __name__ == "__main__":
    ingest_data()