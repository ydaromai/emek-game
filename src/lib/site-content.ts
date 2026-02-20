import { createClient } from '@/lib/supabase/server';

const DEFAULTS: Record<string, string> = {
  landing_title: 'פארק המעיינות',
  landing_subtitle: 'מסע חיות הבר',
  landing_description: 'ברוכים הבאים למסע חיות הבר! סרקו קודי QR בתחנות, גלו חיות מדהימות, אספו אותיות ופתרו את החידה כדי לזכות בפרס!',
  game_instructions: 'גשו לאחת מהתחנות בפארק, סרקו את קוד ה-QR וגלו את החיה שמחכה לכם!',
  game_tip: 'טיפ: חפשו את תחנות ה-QR ליד שילוט המעיינות והשבילים המסומנים',
  redeem_instructions: 'הציגו את הקוד הזה בדלפק הפרסים:',
};

export async function getSiteContent(key: string, tenantId?: string): Promise<string> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('site_content')
      .select('content_value')
      .eq('content_key', key);
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const { data } = await query.single();
    return data?.content_value || DEFAULTS[key] || '';
  } catch {
    return DEFAULTS[key] || '';
  }
}

export async function getAllSiteContent(tenantId?: string): Promise<Record<string, string>> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('site_content')
      .select('content_key, content_value');
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const { data } = await query;
    const fromDb: Record<string, string> = {};
    if (data) {
      for (const row of data) {
        fromDb[row.content_key] = row.content_value;
      }
    }
    return { ...DEFAULTS, ...fromDb };
  } catch {
    return { ...DEFAULTS };
  }
}
