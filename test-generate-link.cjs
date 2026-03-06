const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
    const email = "amandadias.true+test2@gmail.com";
    console.log("Generating link for:", email);
    try {
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "invite",
            email: email,
            options: {
                data: { full_name: "Amanda Test" },
            },
        });

        if (error) {
            console.error("EXPECTED ERROR:", error);
        } else {
            console.log("SUCCESS:", data);
        }
    } catch (e) {
        console.error("EXCEPTION:", e);
    }
}

test();
