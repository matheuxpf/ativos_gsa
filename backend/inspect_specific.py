import pandas as pd

FILE_PATH = 'c:/AtivosGSA-main/Maquinas_Oficial.xlsx'

df = pd.read_excel(FILE_PATH)
df = df.fillna("")

names = ['Lojinha', 'Portaria', 'qualidade', 'financeiro', 'Macarrão', 'Unilever', 'primeira linha', 'Matéria Prima', 'Etiqueta', 'Balança']

for name in names:
    matches = df[df['COLABORADOR'].str.lower() == name.lower()]
    for idx, row in matches.iterrows():
        print(f"Colaborador: {row['COLABORADOR']}, Dept: {row['DEPARTAMENTO']}")
