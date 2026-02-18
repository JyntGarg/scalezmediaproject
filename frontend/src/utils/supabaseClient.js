import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fiyqfcpwdslopnifwgpm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeXFmY3B3ZHNsb3BuaWZ3Z3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDE5NTEsImV4cCI6MjA4NjIxNzk1MX0.gjASnViO4m2pdTpIzLeCDdpZgFGvs_YlYWEYVIkEkgc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getOwnerId = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data: profile } = await supabase
        .from('users')
        .select('*, roles!role_id(*)')
        .eq('id', authUser.id)
        .maybeSingle();

    if (profile) {
        const roleName = profile.roles?.name?.toLowerCase() || "";
        return (roleName === "owner" || roleName === "super owner") ? profile.id : (profile.owner_id || profile.id);
    }
    return authUser.id;
};
