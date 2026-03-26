import { supabase } from './supabase';
import { LogAction, LogEntity } from '../types';

export const registerLog = async (
  action: LogAction, 
  entity: LogEntity, 
  description: string, 
  actor: string = 'Administrador' // No futuro, pegaremos o nome do usuário logado
) => {
  try {
    const { error } = await supabase.from('audit_logs').insert([{
      action_type: action,
      entity_type: entity,
      description: description,
      actor_name: actor
    }]);

    if (error) throw error;
  } catch (err) {
    console.error("Falha ao registrar log de auditoria:", err);
  }
};