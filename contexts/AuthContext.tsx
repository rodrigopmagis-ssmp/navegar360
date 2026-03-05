import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, UserClinic, UserPermissions } from '../types';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    userClinics: UserClinic[];
    selectedClinic: UserClinic | null;
    permissions: UserPermissions;
    loading: boolean;
    selectClinic: (clinicId: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
    can_view_financial: true,
    can_manage_users: true,
    can_access_reports: true,
    can_delete_schedule: true,
    can_create_case: true,
    can_edit_settings: true,
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    userClinics: [],
    selectedClinic: null,
    permissions: DEFAULT_PERMISSIONS,
    loading: true,
    selectClinic: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [userClinics, setUserClinics] = useState<UserClinic[]>([]);
    const [selectedClinic, setSelectedClinic] = useState<UserClinic | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserData = async (currentUser: User) => {
        try {
            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error fetching profile:', profileError);
            }

            setProfile(profileData);

            // Fetch user_clinics with clinics join
            const { data: clinicsData, error: clinicsError } = await supabase
                .from('user_clinics')
                .select(`
          *,
          clinics (*)
        `)
                .eq('user_id', currentUser.id);

            if (clinicsError) {
                console.error('Error fetching user_clinics:', clinicsError);
            }

            setUserClinics(clinicsData || []);

            // If already had a selected clinic in localStorage, try to reselect it
            const savedClinicId = localStorage.getItem('navegar360_selected_clinic');
            if (savedClinicId && clinicsData) {
                const saved = clinicsData.find((c) => c.clinic_id === savedClinicId && c.status === 'active');
                if (saved) {
                    setSelectedClinic(saved);
                } else {
                    // If only 1 active clinic, auto-select it
                    const activeClinics = clinicsData.filter(c => c.status === 'active');
                    if (activeClinics.length === 1) {
                        setSelectedClinic(activeClinics[0]);
                        localStorage.setItem('navegar360_selected_clinic', activeClinics[0].clinic_id);
                    } else {
                        // Let the user choose
                        setSelectedClinic(null);
                        localStorage.removeItem('navegar360_selected_clinic');
                    }
                }
            } else if (clinicsData) {
                const activeClinics = clinicsData.filter(c => c.status === 'active');
                if (activeClinics.length === 1) {
                    setSelectedClinic(activeClinics[0]);
                    localStorage.setItem('navegar360_selected_clinic', activeClinics[0].clinic_id);
                } else {
                    setSelectedClinic(null);
                }
            }

        } catch (err) {
            console.error('Error loading user data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserData(session.user);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setLoading(true);
                fetchUserData(session.user);
            } else {
                setProfile(null);
                setUserClinics([]);
                setSelectedClinic(null);
                localStorage.removeItem('navegar360_selected_clinic');
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const selectClinic = async (clinicId: string) => {
        const selected = userClinics.find((c) => c.clinic_id === clinicId && c.status === 'active');
        if (selected) {
            setSelectedClinic(selected);
            localStorage.setItem('navegar360_selected_clinic', selected.clinic_id);
        } else {
            throw new Error("Clínica inválida ou inativa.");
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const permissions: UserPermissions = useMemo(() => {
        if (!selectedClinic) return DEFAULT_PERMISSIONS;
        const role = selectedClinic.role;
        // Admins always have full access
        if (role === 'admin') return DEFAULT_PERMISSIONS;
        const stored = selectedClinic.permissions || {};
        return {
            can_view_financial: stored.can_view_financial ?? false,
            can_manage_users: stored.can_manage_users ?? false,
            can_access_reports: stored.can_access_reports ?? false,
            can_delete_schedule: stored.can_delete_schedule ?? false,
            can_create_case: stored.can_create_case ?? true,
            can_edit_settings: stored.can_edit_settings ?? false,
        };
    }, [selectedClinic]);

    return (
        <AuthContext.Provider value={{ user, profile, userClinics, selectedClinic, permissions, loading, selectClinic, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
