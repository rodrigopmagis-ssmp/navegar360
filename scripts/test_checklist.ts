import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xafjeyynbnqmudtdqufg.supabase.co';
const supabaseKey = 'sb_publishable_jnQMoP248r91ZY8WPkFajA_P8y87cwm';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("-----------------------------------------");
    console.log("Checking DB directly to see if anything was saved...");

    // Check if table case_protocol_executions has ANYTHING
    const { data: allExecs, error: e1 } = await supabase.from('case_protocol_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log("Recent Executions in DB:", allExecs);
    if (e1) console.log("Error finding execs:", e1);

    // Check the structure of completed_actions
    if (allExecs && allExecs.length > 0) {
        console.log("Type of completed_actions:", typeof allExecs[0].completed_actions);
    }
}
check();
