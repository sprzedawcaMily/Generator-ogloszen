import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ekltegqppkjhfwyvbzqw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbHRlZ3FwcGtqaGZ3eXZienF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5MDc3MzIsImV4cCI6MjA0MDQ4MzczMn0.8u0AhWQjkmfE9KCE4oGdNjbgW5l8E0Q9-QR2PaGJcVs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    
    try {
        // Test 1: Check if table exists and get its structure
        console.log('\n📋 1. Checking table structure...');
        const { data: tableInfo, error: tableError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_name', 'advertisements');
            
        if (tableError) {
            console.log('❌ Error checking table structure:', tableError);
            
            // Alternative method to check columns
            console.log('\n🔄 Trying alternative method...');
            const { data: sampleData, error: sampleError } = await supabase
                .from('advertisements')
                .select('*')
                .limit(1);
                
            if (sampleError) {
                console.log('❌ Cannot access advertisements table:', sampleError);
            } else {
                console.log('✅ Sample data from advertisements table:');
                if (sampleData && sampleData.length > 0) {
                    console.log('Columns found:', Object.keys(sampleData[0]));
                    console.log('Sample record:', sampleData[0]);
                } else {
                    console.log('⚠️ Table exists but is empty');
                }
            }
        } else {
            console.log('✅ Table structure:', tableInfo);
        }
        
        // Test 2: Check specifically for Grailed column
        console.log('\n🎯 2. Checking for is_published_to_grailed column...');
        const { data: grailedData, error: grailedError } = await supabase
            .from('advertisements')
            .select('id, tytul, is_published_to_grailed')
            .limit(5);
            
        if (grailedError) {
            console.log('❌ Column is_published_to_grailed does not exist:', grailedError);
            console.log('\n💡 You need to run this SQL command in Supabase:');
            console.log('ALTER TABLE advertisements ADD COLUMN is_published_to_grailed BOOLEAN DEFAULT FALSE;');
        } else {
            console.log('✅ Column is_published_to_grailed exists!');
            console.log('Sample data:', grailedData);
        }
        
        // Test 3: Count unpublished to Grailed
        console.log('\n📊 3. Counting unpublished advertisements...');
        const { data: unpublishedData, error: unpublishedError } = await supabase
            .from('advertisements')
            .select('id, tytul, rodzaj')
            .eq('is_completed', true)
            .eq('is_published_to_grailed', false);
            
        if (unpublishedError) {
            console.log('❌ Error counting unpublished:', unpublishedError);
        } else {
            console.log(`✅ Found ${unpublishedData?.length || 0} completed but unpublished to Grailed advertisements`);
            if (unpublishedData && unpublishedData.length > 0) {
                console.log('First few unpublished ads:');
                unpublishedData.slice(0, 3).forEach((ad, index) => {
                    console.log(`${index + 1}. ID: ${ad.id}, Title: ${ad.tytul}, Type: ${ad.rodzaj}`);
                });
            }
        }
        
    } catch (error) {
        console.log('❌ Unexpected error:', error);
    }
}

console.log('🚀 Starting database test...');
testDatabaseConnection();
