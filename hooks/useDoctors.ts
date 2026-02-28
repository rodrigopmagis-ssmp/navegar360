import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Doctor } from '../types';

export const useDoctors = () => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('doctors')
                .select('*')
                .order('full_name', { ascending: true });

            if (error) throw error;
            setDoctors(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    return { doctors, loading, error, refetch: fetchDoctors };
};
