const fs = require('fs');
const devEnv = fs.readFileSync('.env', 'utf8');
const urlMatch = devEnv.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = devEnv.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const URL = urlMatch[1].trim();
const KEY = keyMatch[1].trim();

async function checkDatabase() {
    const res1 = await fetch(`${URL}/rest/v1/profiles?select=id,full_name,clinic_id`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
    });
    console.log("Profiles:", await res1.json());

    const res2 = await fetch(`${URL}/rest/v1/clinics?select=id,name`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
    });
    console.log("Clinics:", await res2.json());
}

checkDatabase();
