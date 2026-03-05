import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/Users/rodrigo.silva/Documents/navegar-360/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProtocol() {
    const { data, error } = await supabase.from('protocols').select('*').eq('type', 'team');

    if (error) {
        console.error("SELECT ERROR:");
        console.error(error);
    } else {
        console.log("TEAM PROTOCOLS FOUND:", data.length);
        data.forEach(p => console.log(`- ${p.name} (ID: ${p.id})`));
    }
}

checkProtocol();
