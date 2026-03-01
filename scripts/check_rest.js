const fs = require('fs');
const dotenvStr = fs.readFileSync('.env', 'utf8');
const env = dotenvStr.split('\n').reduce((acc, line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) acc[match[1]] = match[2];
    return acc;
}, {});

const URL = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;

async function checkDatabase() {
    console.log("Fetching profiles...");
    const res1 = await fetch(`${URL}/rest/v1/profiles?select=*`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
    });
    console.log("Profiles:", await res1.json());

    console.log("Fetching clinics...");
    const res2 = await fetch(`${URL}/rest/v1/clinics?select=*`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
    });
    console.log("Clinics:", await res2.json());
}

checkDatabase();
