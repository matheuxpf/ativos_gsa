import os
import httpx
from fastapi import FastAPI, Request
from dotenv import load_dotenv
from bot_logic import validate_supervisor, handle_fuzzy_search, get_employee_assets, supabase
from rapidfuzz import fuzz

load_dotenv()
app = FastAPI()

@app.get("/")
async def health_check():
    """
    Rota simples para verificar se a API está rodando.
    Pode ser acessada pelo navegador.
    """
    return {
        "status": "Online 🚀", 
        "servico": "Bot de Ativos GSA",
        "ambiente": "Produção/Ngrok"
    }

TOKEN = os.getenv("TELEGRAM_TOKEN")
BASE_URL = f"https://api.telegram.org/bot{TOKEN}"

async def send_message(chat_id: int, text: str):
    async with httpx.AsyncClient(timeout=10.0) as client:
        await client.post(f"{BASE_URL}/sendMessage", json={"chat_id": chat_id, "text": text, "parse_mode": "Markdown"})

@app.post("/webhook")
async def telegram_webhook(request: Request):
    data = await request.json()
    if "message" not in data or "text" not in data["message"]: return {"ok": True}

    msg = data["message"]
    chat_id = str(msg["from"]["id"])
    text = msg.get("text", "").strip()

    # 1. Autenticação e Trava de Equipe
    supervisor = await validate_supervisor(chat_id)
    if not supervisor:
        await send_message(chat_id, "🚫 *Acesso Negado.* Seu ID não está vinculado a um supervisor ativo na GSA.")
        return {"ok": True}

    # === BOTÃO DE RESET GLOBAL ===
    palavras_reset = ["oi", "olá", "ola", "cancelar", "sair", "menu", "reset"]
    if text.lower() in palavras_reset:
        supabase.table('bot_sessions').delete().eq('external_id', chat_id).execute()
        await send_message(
            chat_id, 
            f"👋 Olá, {supervisor['name']}! Sessão reiniciada.\n\n"
            "Eu sou o assistente de ativos. Para iniciar um processo, digite:\n"
            "👉 *Desligar [Nome do Funcionário]*"
        )
        return {"ok": True}

    # 2. Gerenciamento de Sessão
    session_res = supabase.table('bot_sessions').select('*').eq('external_id', chat_id).execute()
    session = session_res.data[0] if session_res.data else None

    # --- FLUXO INICIAL: Comando Desligar ---
    if "desligar" in text.lower():
        name_part = text.lower().replace("desligar", "").strip()
        candidates = await handle_fuzzy_search(name_part, supervisor['team_id'])

        if not candidates:
            await send_message(chat_id, "❌ Nenhum funcionário encontrado na sua equipe com este nome.")
        elif len(candidates) == 1:
            supabase.table('bot_sessions').upsert({
                "external_id": chat_id,
                "current_state": "WAITING_FULL_NAME",
                "payload": {"target_id": candidates[0]['id'], "full_name": candidates[0]['name']}
            }).execute()
            await send_message(chat_id, f"🔍 Identifiquei: *{candidates[0]['name']}*.\n\nPara confirmar o desligamento, envie o *NOME COMPLETO* dele.")
        else:
            options = "\n".join([f"• {c['name']}" for c in candidates])
            await send_message(chat_id, f"🤔 Encontrei mais de um:\n{options}\n\nPor favor, digite o nome de forma mais específica.")

    # --- FLUXO 2: CONFIRMAÇÃO E VALIDAÇÃO EM 5 ETAPAS ---
    elif session and session['current_state'] == "WAITING_FULL_NAME":
        input_name = text.strip().lower()
        expected_name = session['payload']['full_name'].strip().lower()

        if fuzz.ratio(input_name, expected_name) > 90:
            target_id = session['payload']['target_id']
            nome_real = session['payload']['full_name']
            
            # Manda um aviso de que a máquina começou a trabalhar
            await send_message(chat_id, f"⚙️ *Iniciando Protocolo de Desligamento...*\nAnalisando o perfil de {nome_real}. Aguarde...")

            try:
                # ETAPA 1: O funcionário existe? (Busca dados frescos do banco)
                emp_res = supabase.table('employees').select('*').eq('id', target_id).execute()
                if not emp_res.data:
                    await send_message(chat_id, "❌ *FALHA - Etapa 1:* Funcionário não localizado no banco de dados. Ele pode ter sido excluído. Operação abortada.")
                    supabase.table('bot_sessions').delete().eq('external_id', chat_id).execute()
                    return {"ok": True}
                
                emp_data = emp_res.data[0]

                # ETAPA 2: O funcionário está ativo?
                if emp_data.get('status') == 'Desligado':
                    await send_message(chat_id, f"⚠️ *FALHA - Etapa 2:* O funcionário *{nome_real}* JÁ CONSTA como 'Desligado' no sistema. Nenhuma ação extra é necessária.")
                    supabase.table('bot_sessions').delete().eq('external_id', chat_id).execute()
                    return {"ok": True}

                # ETAPA 3: O funcionário é da equipe do Supervisor? (Trava de Segurança Máxima)
                if emp_data.get('team_id') != supervisor['team_id']:
                    await send_message(chat_id, f"🚫 *FALHA - Etapa 3 (Segurança):* O funcionário *{nome_real}* pertence a outra equipe. Você não tem permissão de gestão sobre ele.")
                    supabase.table('bot_sessions').delete().eq('external_id', chat_id).execute()
                    return {"ok": True}

                # ETAPA 4: Tentar o desligamento
                update_res = supabase.table('employees').update({"status": "Desligado"}).eq('id', target_id).execute()

                # ETAPA 5: O funcionário FOI desligado com sucesso? (Garantia de gravação)
                if not update_res.data or update_res.data[0].get('status') != 'Desligado':
                    await send_message(chat_id, "❌ *FALHA - Etapa 4 e 5:* Erro ao gravar a informação no servidor da GSA. O status não foi alterado. Contate o suporte de TI.")
                    supabase.table('bot_sessions').delete().eq('external_id', chat_id).execute()
                    return {"ok": True}

                # -----------------------------------------------------
                # SE CHEGOU AQUI, PASSOU EM TODAS AS 5 ETAPAS!
                # -----------------------------------------------------
                
                # Registra Auditoria
                supabase.table('audit_logs').insert({
                    "action_type": "UPDATE",
                    "entity_type": "EMPLOYEE",
                    "description": f"Alteração de status (Ativo -> Desligado): {nome_real}",
                    "actor_name": supervisor['name']
                }).execute()
                
                # Monta o "Relatório Mastigado" para o Supervisor
                msg_sucesso = (
                    f"✅ *DESLIGAMENTO EFETIVADO COM SUCESSO!*\n\n"
                    f"📋 *Relatório de Auditoria:*\n"
                    f"1️⃣ Cadastro localizado: ✅\n"
                    f"2️⃣ Status anterior ativo: ✅\n"
                    f"3️⃣ Pertence à sua equipe: ✅\n"
                    f"4️⃣ Gravação no servidor: ✅\n\n"
                    f"O funcionário *{nome_real}* está oficialmente *DESLIGADO*."
                )

                # Verifica Ativos vinculados
                assets = await get_employee_assets(target_id)
                if assets:
                    asset_list = "\n".join([f"- {a['model']}" for a in assets])
                    msg_sucesso += f"\n\n📱 *ATENÇÃO - Ativos Retidos:*\n{asset_list}\n\nO que você deseja fazer com estes aparelhos?\n1. Mover para o *ESTOQUE*\n2. Transferir para outro *VENDEDOR*"
                    
                    supabase.table('bot_sessions').upsert({
                        "external_id": chat_id, 
                        "current_state": "DECIDING_ASSETS", 
                        "payload": {"target_id": target_id, "asset_ids": [a['id'] for a in assets]}
                    }).execute()
                else:
                    msg_sucesso += "\n\nNenhum ativo da GSA estava vinculado a ele."
                    supabase.table('bot_sessions').delete().eq('external_id', chat_id).execute()

                # Envia o relatório final
                await send_message(chat_id, msg_sucesso)

            except Exception as e:
                print(f"ERRO CRÍTICO DURANTE DESLIGAMENTO: {e}")
                await send_message(chat_id, "❌ *FALHA CRÍTICA:* Ocorreu um erro inesperado no sistema. A operação foi abortada de forma segura para evitar dados corrompidos.")
                supabase.table('bot_sessions').delete().eq('external_id', chat_id).execute()
                
        else:
            await send_message(chat_id, f"❌ O nome digitado ('{text}') não confere com o registrado ('{session['payload']['full_name']}'). Operação cancelada por segurança.")
            supabase.table('bot_sessions').delete().eq('external_id', chat_id).execute()

    # --- FLUXO 3: Destino dos Ativos ---
    elif session and session['current_state'] == "DECIDING_ASSETS":
        if "estoque" in text.lower() or "1" in text:
            for aid in session['payload']['asset_ids']:
                supabase.table('assets').update({"status": "Livre", "assigned_to": None}).eq('id', aid).execute()
            await send_message(chat_id, "📥 Ativos retornados ao estoque com sucesso!")
            supabase.table('bot_sessions').delete().eq('external_id', chat_id).execute()
        elif "vendedor" in text.lower() or "2" in text:
            await send_message(chat_id, "👤 Para qual vendedor deseja transferir? (Digite o nome)")
            # Aqui entrará a lógica da próxima etapa (Pesquisa do novo vendedor)
        else:
            await send_message(chat_id, "⚠️ Por favor, escolha '1' (Estoque) ou '2' (Vendedor).")

    return {"ok": True}