import os
from rapidfuzz import process, fuzz
from database import supabase

async def validate_supervisor(external_id):
    """Verifica se o ID do Telegram pertence a um funcionário ativo."""
    res = supabase.table('employees').select('id, name, team_id, role').eq('external_id', str(external_id)).eq('status', 'Ativo').execute()
    return res.data[0] if res.data else None

async def handle_fuzzy_search(name_input, team_id):
    """Busca aproximada com logs de monitoramento (Debug)."""
    print(f"\n--- 🕵️ INÍCIO DO DEBUG: FUZZY SEARCH ---")
    print(f"🎯 Input do Telegram: '{name_input}'")
    print(f"🏢 ID da sua Equipe (Supervisor): '{team_id}'")

    # Passo 1: Busca crua no banco
    employees = supabase.table('employees').select('id, name, status, team_id').eq('team_id', team_id).neq('status', 'Desligado').execute()
    
    print(f"📦 Retorno bruto do Supabase (Qtd): {len(employees.data) if employees.data else 0}")
    
    if not employees.data:
        print("❌ ALERTA: O banco não retornou ninguém! Verifique se a equipe e o status batem.")
        print("----------------------------------------\n")
        return []

    # Passo 2: Mostra quem o banco liberou para a matemática
    print(f"👥 Pessoas encontradas nesta equipe: {[e['name'] for e in employees.data]}")

    choices = {e['name']: e['id'] for e in employees.data}
    
    # Passo 3: Avaliação do RapidFuzz
    results = process.extract(name_input, choices.keys(), scorer=fuzz.token_sort_ratio, limit=3)
    
    print(f"🧮 Notas de Similaridade (A nota de corte é 80):")
    for res in results:
        print(f"   -> Nome: {res[0]} | Pontuação: {res[1]}")

    # Altere APENAS esta linha no final da função
    final_list = [{"name": r[0], "id": choices[r[0]], "score": r[1]} for r in results if r[1] > 80]
    
    print(f"✅ Passaram no filtro final: {len(final_list)}")
    print("--- FIM DO DEBUG ---\n")

    return final_list

async def get_employee_assets(employee_id):
    """Lista modelos de aparelhos vinculados ao funcionário."""
    res = supabase.table('assets').select('id, model').eq('assigned_to', employee_id).execute()
    return res.data