import axios from 'axios';

// Cria a instancia de comunicacao apontando para o nosso FastAPI local
export const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Funcoes utilitarias prontas para os seus componentes React usarem
export const getTeams = async () => {
    const response = await api.get('/teams/');
    return response.data;
};

export const getRoles = async () => {
    const response = await api.get('/roles/');
    return response.data;
};
