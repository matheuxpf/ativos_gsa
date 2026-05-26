import requests

data = {
  "asset_id": 1,
  "from_owner_id": "ESTOQUE",
  "from_owner_type": "ESTOQUE",
  "from_owner_name": "Estoque",
  "to_owner_id": 2, # Note: integer
  "to_owner_type": "FUNCIONARIO",
  "to_owner_name": "Cainã Emanuel",
  "reason": "Movimentação Rápida",
  "observations": "",
  "registered_by": "Administrador"
}

try:
    r = requests.post("http://127.0.0.1:8000/movements/", json=data)
    print(r.status_code)
    print(r.json())
except Exception as e:
    print(e)
