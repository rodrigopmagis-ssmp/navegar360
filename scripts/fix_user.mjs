import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://xafjeyynbnqmudtdqufg.supabase.co',
    'sb_publishable_jnQMoP248r91ZY8WPkFajA_P8y87cwm'
);

async function fixUser() {
    console.log('Fetching clinics...');
    const { data: clinics, error: err1 } = await supabase.from('clinics').select('*');
    if (err1) {
        console.error('Error fetching clinics:', err1);
        return;
    }

    let targetClinicId;
    if (!clinics || clinics.length === 0) {
        console.log('No clinics found. Creating a default clinic...');
        const { data: newClinic, error: errCreate } = await supabase
            .from('clinics')
            .insert([{ name: 'Clínica Principal' }])
            .select()
            .single();

        if (errCreate) {
            console.error('Error creating clinic:', errCreate);
            return;
        }
        targetClinicId = newClinic.id;
        console.log('Created clinic:', targetClinicId);
    } else {
        targetClinicId = clinics[0].id;
        console.log('Found clinic:', targetClinicId);
    }

    const targetUserId = '127643c8-8ec8-434c-a6b4-5282ac030d14';

    console.log(`\nAssigning user ${targetUserId} to clinic ${targetClinicId}...`);

    const { data: updatedProfile, error: err2 } = await supabase
        .from('profiles')
        .update({ clinic_id: targetClinicId })
        .eq('id', targetUserId)
        .select();

    if (err2) {
        console.error('Error updating profile:', err2);
    } else {
        console.log('Profile updated successfully:', updatedProfile);
    }
}

fixUser();
