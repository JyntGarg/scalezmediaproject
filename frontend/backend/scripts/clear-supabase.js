const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseKey) {
    console.error("Error: SUPABASE_SERVICE_KEY or SUPABASE_KEY is required.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function clearData() {
    console.log('Clearing Supabase data...');

    // Delete in reverse dependency order to avoid FK constraints
    const tables = [
        'history',
        'learnings',
        'tests',
        'ideas',
        'goals',
        'project_teams',
        'funnel_projects',
        'projects',
        'workspaces',
        'keymetrics',
        'levers',
        'categories',
        'notifications',
        'users',
        'roles',
        'super_owners'
    ];

    for (const table of tables) {
        console.log(`Clearing ${table}...`);

        // Handle junction tables or tables without 'id'
        if (table === 'project_teams') {
            // For project_teams, we can delete based on project_id not being null/empty
            const { error } = await supabase.from(table).delete().neq('project_id', '00000000-0000-0000-0000-000000000000');
            if (error) console.error(`Error clearing ${table}:`, error.message);
        } else {
            const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) console.error(`Error clearing ${table}:`, error.message);
        }
    }

    // Clear Auth Users
    console.log('Clearing Auth Users...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error listing auth users:', listError.message);
    } else {
        for (const user of users) {
            console.log(`Deleting auth user ${user.email} (${user.id})...`);
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
            if (deleteError) console.error(`Error deleting auth user ${user.id}:`, deleteError.message);
        }
    }

    console.log('Data and Auth Users cleared.');
}

clearData();
