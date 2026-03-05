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

async function checkEntityTypes() {
    console.log("Checking entity_type values in case_protocol_executions...");
    const { data, error } = await supabase
        .from('case_protocol_executions')
        .select('entity_type')
        .not('entity_type', 'is', null);

    if (error) {
        console.error("SELECT ERROR:", error);
    } else {
        const types = new Set(data.map(d => d.entity_type));
        console.log("Found entity_type values:", Array.from(types));
    }
}

checkEntityTypes();
