import pandas as pd
import json

file1 = r"C:\Users\mpandrade\Downloads\Pasta1.xlsx"
file2 = r"C:\Users\mpandrade\Downloads\Pasta2.xlsx"
file3 = r"C:\Users\mpandrade\Downloads\Pasta3.xlsx"

out = []

try:
    df1 = pd.read_excel(file1)
    for sup in df1['SUPERVISOR'].dropna().unique():
        out.append(f"PASTA1: {sup}")
except Exception as e: pass

try:
    df2 = pd.read_excel(file2)
    for gestor in df2['Gestor'].dropna().unique():
        out.append(f"PASTA2: {gestor}")
except Exception as e: pass

try:
    df3 = pd.read_excel(file3)
    df_sup = df3[df3['Desc.Funcao'].str.contains('SUPERVISOR|GERENTE', case=False, na=False)]
    for idx, row in df_sup.iterrows():
        out.append(f"PASTA3: {row['Nome']} - {row['Desc.Funcao']} - {row['Descr.Ccusto']}")
except Exception as e: pass

with open(r"C:\AtivosGSA-main\AtivosGSA-main\backend\raw_leaders.txt", "w", encoding='utf-8') as f:
    f.write("\n".join(out))
