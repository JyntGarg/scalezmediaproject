const fs = require('fs');
const path = require('path');

const controllersDir = path.resolve(__dirname, 'frontend/backend/controllers');
const files = fs.readdirSync(controllersDir);

files.forEach(file => {
    if (file.endsWith('.js')) {
        const filePath = path.join(controllersDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Pattern to match: const supabase = require('@supabase/supabase-js').createClient(...)
        const pattern = /const supabase = require\(['"]@supabase\/supabase-js['"]\)\.createClient\(.*?\);/g;

        if (pattern.test(content)) {
            console.log(`Updating ${file}...`);
            const updatedContent = content.replace(pattern, "const supabase = require('../config/supabaseClient');");
            fs.writeFileSync(filePath, updatedContent);
        }
    }
});
