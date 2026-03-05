import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/rodrigo.silva/Documents/navegar-360/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFK() {
    // we try to insert a dummy record with an arbitrary UUID
    // If we get an FK error on participant_id, we know there's a constraint.
    const dummyUUID = "00000000-0000-0000-0000-000000000000";
    const { data, error } = await supabase.from('case_protocol_executions').insert({
        participant_id: dummyUUID,
        stage_id: dummyUUID,
        status: 'pending'
    });

    if (error) {
        console.error("INSERT ERROR:");
        console.error(error);
    } else {
        console.log("INSERT SUCCESS");
    }
}

checkFK();
