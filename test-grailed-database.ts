import { getFirestore, collection, getDocs, limit, query, where } from 'firebase/firestore';
import { firebaseApp } from './src/firebaseConfig';

async function testDatabaseConnection() {
    const db = getFirestore(firebaseApp);
    console.log('🔍 Testing database connection...');
    
    try {
        // Test 1: Check if collection exists and get its structure
        console.log('\n📋 1. Checking table structure...');
        const sampleSnap = await getDocs(query(collection(db, 'advertisements'), limit(1)));
        if (!sampleSnap.empty) {
            const sample = { id: sampleSnap.docs[0].id, ...(sampleSnap.docs[0].data() as any) };
            console.log('✅ Sample data from advertisements collection:');
            console.log('Columns found:', Object.keys(sample));
            console.log('Sample record:', sample);
        } else {
            console.log('⚠️ Collection exists but is empty');
        }
        
        // Test 2: Check specifically for Grailed column
        console.log('\n🎯 2. Checking for is_published_to_grailed column...');
        const grailedSnap = await getDocs(query(collection(db, 'advertisements'), limit(5)));
        const grailedData = grailedSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

        if (grailedData.length > 0 && !Object.prototype.hasOwnProperty.call(grailedData[0], 'is_published_to_grailed')) {
            console.log('❌ Pole is_published_to_grailed nie istnieje w dokumentach');
        } else {
            console.log('✅ Column is_published_to_grailed exists!');
            console.log('Sample data:', grailedData);
        }
        
        // Test 3: Count unpublished to Grailed
        console.log('\n📊 3. Counting unpublished advertisements...');
        const unpublishedSnap = await getDocs(
            query(
                collection(db, 'advertisements'),
                where('is_completed', '==', true),
                where('is_published_to_grailed', '==', false)
            )
        );
        const unpublishedData = unpublishedSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

        console.log(`✅ Found ${unpublishedData?.length || 0} completed but unpublished to Grailed advertisements`);
        if (unpublishedData && unpublishedData.length > 0) {
                console.log('First few unpublished ads:');
                unpublishedData.slice(0, 3).forEach((ad, index) => {
                    console.log(`${index + 1}. ID: ${ad.id}, Title: ${ad.tytul || ad.title}, Type: ${ad.rodzaj}`);
                });
        }
        
    } catch (error) {
        console.log('❌ Unexpected error:', error);
    }
}

console.log('🚀 Starting database test...');
testDatabaseConnection();
