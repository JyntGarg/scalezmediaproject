const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedRoles() {
    console.log("Seeding roles...");
    const allPermissions = {
        add_user: true,
        remove_user: true,
        create_goals: true,
        create_ideas: true,
        create_roles: true,
        create_tests: true,
        create_models: true,
        company_access: true,
        create_project: true,
        delete_project: true,
        nominate_ideas: true,
        create_comments: true,
        create_learnings: true,
        create_workspace: true,
        mention_everyone: true,
        create_actionPlans: true,
        read_users: true // Adding this one specifically
    };

    const roles = [
        { name: 'Owner', permissions: allPermissions },
        { name: 'Admin', permissions: allPermissions },
        { name: 'Member', permissions: { ...allPermissions, remove_user: false, create_roles: false } }, // Subtle diff
        { name: 'Viewer', permissions: Object.keys(allPermissions).reduce((acc, key) => ({ ...acc, [key]: false }), {}) }
    ];

    const { data, error } = await supabase.from('roles').insert(roles).select();

    if (error) {
        console.error("Error seeding roles:", error.message);
    } else {
        console.log("Roles seeded successfully:", data);
    }
}

seedRoles();
