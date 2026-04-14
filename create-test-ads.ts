import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { firebaseApp } from './src/firebaseConfig';

async function createTestAdvertisements() {
    const db = getFirestore(firebaseApp);
    console.log('🏗️  Creating test advertisements...\n');
    
    const testAds = [
        {
            title: "Piękna Sukienka Letnia - Rozmiar M",
            description: "Sprzedam piękną sukienkę letnią w kolorze niebieskim. Rozmiar M, bardzo dobry stan. Sukienka jest wykonana z wysokiej jakości materiału, idealna na letnie spacery i spotkania. Noszona tylko kilka razy, bez śladów użytkowania.",
            photos: [
                "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500",
                "https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=500"
            ],
            is_completed: false
        },
        {
            title: "Adidas Buty Sportowe - Rozmiar 42",
            description: "Sprzedam buty sportowe marki Adidas w rozmiarze 42. Stan bardzo dobry, używane sporadycznie. Idealne do biegania i codziennego noszenia. Oryginalne, z wszystkimi dokumentami. Reason for sale: kupione w złym rozmiarze.",
            photos: [
                "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500",
                "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500"
            ],
            is_completed: false
        },
        {
            title: "Vintage Kurtka Jeans - Oversize",
            description: "Unikalna vintage kurtka jeansowa w stylu oversize. Bardzo modna, w doskonałym stanie. Kurtka ma charakterystyczny fason lat 90-tych. Idealna na jesień i wiosnę. Rozmiar uniwersalny, pasuje na S-L.",
            photos: [
                "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500"
            ],
            is_completed: false
        }
    ];
    
    for (let i = 0; i < testAds.length; i++) {
        const ad = testAds[i];
        console.log(`📝 Creating advertisement ${i + 1}: "${ad.title}"`);
        
        try {
            const ref = await addDoc(collection(db, 'advertisements'), {
                ...ad,
                photo_uris: ad.photos,
                created_at: new Date().toISOString(),
            });
            console.log(`✅ Created advertisement ${i + 1} with ID: ${ref.id}`);
        } catch (error) {
            console.error(`❌ Exception creating advertisement ${i + 1}:`, error);
        }
        
        // Poczekaj chwilę między tworzeniem
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎉 Test advertisements creation completed!');
    console.log('💡 Now you can run the Vinted automation to test title and description filling.');
}

createTestAdvertisements().catch(console.error);
