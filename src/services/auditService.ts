import { supabase } from '@/integrations/supabase/client';

type LogOptions = {
  entityType?: string | null;
  entityId?: string | null;
  details?: any;
};

export const logAudit = async (action: string, opts: LogOptions = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = {
      action,
      entity_type: opts.entityType ?? null,
      entity_id: opts.entityId ?? null,
      user_id: user?.id ?? null,
      details: opts.details ?? null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    };
    await supabase.from('audit_logs').insert(payload);
  } catch (e) {
    console.warn('Falha ao registrar auditoria:', e);
  }
};
