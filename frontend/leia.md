Iniciar o Backend (Python/FastAPI):

cd backend ;
.\venv\Scripts\activate ; 
uvicorn main:app --reload

Abrir o Túnel (ngrok):

ngrok http 8000

-Lembre-se de que o ngrok gera um link novo toda vez que é reiniciado (na conta gratuita). Se você fechar o terminal do ngrok, precisará atualizar o link do Webhook no navegador novamente.

Iniciar o Frontend (React/Vite):

cd AtivosGSA-main/AtivosGSA-main ; 
npm run dev


Gestão de Versão (Git)


Configuração Inicial do Repositório (Só na primeira vez):
git init
git remote add origin https://github.com/matheuxpf/AtivosGSA.git
git branch -M main

Salvar Progresso e Subir para o GitHub (Rápido):
git add .
git commit -m "feat: implementando logica de estados e automacao de ativos"
git push origin main

Atualizar o Projeto Local (Caso mude algo pelo site do GitHub):
git pull origin main