import pandas as pd
import json

FILE_PATH = 'C:/Users/mpandrade/Downloads/ORGANOGRAMA 2026.xlsx'

try:
    # Ler todas as abas
    xls = pd.ExcelFile(FILE_PATH)
    print("Abas encontradas:", xls.sheet_names)
    
    # Vamos ler cada aba e tentar imprimir os dados pra entender
    for sheet in xls.sheet_names:
        print(f"\n--- Aba: {sheet} ---")
        df = pd.read_excel(xls, sheet_name=sheet)
        print(df.head(20).to_string())
except Exception as e:
    print("Erro ao ler:", e)
