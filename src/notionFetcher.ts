import { Client } from '@notionhq/client';

// Temporary mock data until we get the Notion API key
const mockData = [
    "roca wear jersey długi rękaw, granatowy, size L bez wad",
    "d 77 s 60",
    "",
    "ecko unltd jortsy size 38 granatowe bez wad",
    "p 48 d 60 u 40 n 32",
    "",
    "phat farm jeansy size 34/34 nogawki poszczerbione",
    "p 45 d 107 u 38 n 24"
];

export async function fetchNotionData(): Promise<string[]> {
    // For now, return mock data until we get the Notion API key
    return mockData;

    // TODO: Implement with real Notion API once we have the key
    /*
    const notion = new Client({
        auth: process.env.NOTION_API_KEY,
    });

    try {
        const response = await notion.pages.retrieve({
            page_id: '24fc8943cc7f804c8aebc7bd513e598a'
        });
        
        // Process the response and extract the data
        // This will need to be implemented based on the actual structure of your Notion page
        
        return [];
    } catch (error) {
        console.error('Error fetching Notion data:', error);
        return [];
    }
    */
}