import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkDatabase() {
    const { data: profiles, error: err1 } = await supabase.from('profiles').select('*');
    if (err1) console.error('Erro profiles:', err1);
    else console.log('Profiles:', profiles);

    const { data: clinics, error: err2 } = await supabase.from('clinics').select('*');
    if (err2) console.error('Erro clinics:', err2);
    else console.log('Clinics:', clinics);
}

checkDatabase();
