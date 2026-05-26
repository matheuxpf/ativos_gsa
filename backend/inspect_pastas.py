import pandas as pd
import json

files = [
    r"C:\Users\mpandrade\Downloads\Pasta1.xlsx",
    r"C:\Users\mpandrade\Downloads\Pasta2.xlsx",
    r"C:\Users\mpandrade\Downloads\Pasta3.xlsx"
]

for f in files:
    try:
        df = pd.read_excel(f)
        print(f"--- {f} ---")
        print("Columns:", list(df.columns))
        print("Head:")
        print(df.head(3).to_dict('records'))
    except Exception as e:
        print(f"Error reading {f}: {e}")
