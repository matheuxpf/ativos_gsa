from database import engine
import pandas as pd

df = pd.read_sql("SELECT id, asset_tag, type, brand FROM assets WHERE asset_tag='GSA001'", engine)
print("GSA001:")
print(df)
