import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PatientV2 } from '../types';

export const usePatients = () => {
    const [patients, setPatients] = useState<PatientV2[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('patients_v2')
                .select(`
                    *,
                    patient_insurances (
                        id,
                        card_number,
                        valid_until,
                        is_primary,
                        insurance_plans (
                            plan_name,
                            health_insurers (
                                name
                            )
                        )
                    )
                `)
                .order('full_name', { ascending: true });

            if (error) throw error;
            setPatients(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    return { patients, loading, error, refetch: fetchPatients };
};
