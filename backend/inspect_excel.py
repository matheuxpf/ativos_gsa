import pandas as pd

FILE_PATH = 'c:/AtivosGSA-main/Maquinas_Oficial.xlsx'

try:
    df = pd.read_excel(FILE_PATH)
    colabs = df['COLABORADOR'].dropna().unique()
    print("Unique COLABORADOR values:")
    for c in colabs:
        print(repr(c))
except Exception as e:
    print(f"Error: {e}")
