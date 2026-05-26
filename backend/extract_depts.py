import pandas as pd
import json

FILE_PATH = 'C:/AtivosGSA-main/Maquinas_Oficial.xlsx'

df = pd.read_excel(FILE_PATH)
depts = df['DEPARTAMENTO'].dropna().unique()

print("LISTA DE DEPARTAMENTOS NO EXCEL:")
for d in sorted(depts):
    print(d)
