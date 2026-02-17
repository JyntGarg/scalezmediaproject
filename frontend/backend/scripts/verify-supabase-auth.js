const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = `tester_${Date.now()}@scalez.in`;
const TEST_PASSWORD = 'Password123!';

async function testSignupAndLogin() {
    console.log(`Starting verification for ${TEST_EMAIL}...`);

    try {
        // 1. Test Signup via Supabase Auth Admin to bypass email confirmation
        console.log("Testing Supabase Auth Admin CreateUser...");
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            email_confirm: true
        });

        if (authError) {
            console.error("Signup failed:", authError.message);
            return;
        }
        console.log("Signup successful. User ID:", authData.user.id);

        // 2. Test inserting into public.users
        console.log("Testing public.users insertion...");
        const { data: userData, error: userError } = await supabase.from('users').insert({
            id: authData.user.id,
            email: TEST_EMAIL,
            first_name: 'Test',
            last_name: 'User',
            designation: 'Tester'
        }).select().single();

        if (userError) {
            console.error("Public users insertion failed:", userError.message);
            return;
        }
        console.log("Public users insertion successful.");

        // 3. Test Login via Supabase Auth
        console.log("Testing Supabase Auth SignIn...");
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        });

        if (loginError) {
            console.error("Login failed:", loginError.message);
            return;
        }
        console.log("Login successful. Session obtained.");

        // 4. Cleanup
        console.log("Cleaning up test user...");
        await supabase.from('users').delete().eq('id', authData.user.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log("Cleanup complete.");

        console.log("Verification PASSED!");
    } catch (err) {
        console.error("Verification error:", err);
    }
}

testSignupAndLogin();
