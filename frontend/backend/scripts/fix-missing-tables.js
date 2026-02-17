const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTables() {
    console.log("Fixing missing tables...");

    const sqlQueries = [
        // Models Table
        `CREATE TABLE IF NOT EXISTS public.models (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            name text NOT NULL,
            creator_id uuid REFERENCES public.users(id),
            data jsonb DEFAULT '{}'::jsonb,
            created_at timestamptz DEFAULT now()
        );`,

        // Scenarios Table
        `CREATE TABLE IF NOT EXISTS public.scenarios (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            name text NOT NULL,
            data jsonb DEFAULT '{}'::jsonb,
            project_id uuid REFERENCES public.funnel_projects(id),
            created_at timestamptz DEFAULT now()
        );`
    ];

    console.log("Note: You need to run these queries in the Supabase SQL Editor manually if the API doesn't support raw SQL execution.");
    console.log("Attempting to verify table presence first...");

    for (const table of ['models', 'scenarios']) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error && error.code === 'PGRST205') {
            console.log(`❌ Table '${table}' is definitely missing.`);
        } else if (error) {
            console.log(`ℹ️ Table '${table}' check error: ${error.message}`);
        } else {
            console.log(`✅ Table '${table}' already exists.`);
        }
    }

    console.log("\nSince raw SQL via JS API is restricted in standard Supabase clients, please run the following SQL in your Supabase Dashboard -> SQL Editor:\n");
    console.log(sqlQueries.join('\n\n'));
}

fixTables();
