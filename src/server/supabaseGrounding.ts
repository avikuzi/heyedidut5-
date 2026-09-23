import { createClient } from '@supabase/supabase-js';
import { sanitizeGrounding } from '../lib/ai/committeeChat';
import type { AiGroundingContext } from '../types/ai';
import { AiHttpError, readServerSupabase, type ServerEnv } from './aiChatHandler';

export async function buildGroundingFromSession(options: {
  jwt: string;
  periodLabel?: string;
  env: ServerEnv;
}): Promise<AiGroundingContext> {
  const supabaseEnv = readServerSupabase(options.env);
  if (!supabaseEnv) {
    throw new AiHttpError(500, 'supabase_missing', 'Supabase לא מוגדר בשרת.');
  }

  const supabase = createClient(supabaseEnv.url, supabaseEnv.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: { Authorization: `Bearer ${options.jwt}` }
    }
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(options.jwt);
  if (userError || !userData.user) {
    throw new AiHttpError(401, 'unauthorized', 'נדרשת כניסת ועד הבית.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== 'admin') {
    throw new AiHttpError(403, 'forbidden', 'העוזר זמין לוועד הבית בלבד.');
  }

  const { data, error } = await supabase.rpc('build_ai_grounding', {
    p_period_label: options.periodLabel ?? null
  });

  if (error) {
    if (/committee only/i.test(error.message || '')) {
      throw new AiHttpError(403, 'forbidden', 'העוזר זמין לוועד הבית בלבד.');
    }
    throw new AiHttpError(502, 'grounding_failed', 'לא הצלחתי לטעון את נתוני הקופה.');
  }

  const grounding = sanitizeGrounding(data);
  if (!grounding) {
    throw new AiHttpError(502, 'grounding_invalid', 'נתוני הקופה שהתקבלו אינם תקינים.');
  }
  return grounding;
}
