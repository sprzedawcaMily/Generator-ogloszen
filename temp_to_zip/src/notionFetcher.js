const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(__dirname, 'lastNotionUrl.txt');

export async function fetchNotionData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        
        // Save the URL for future use
        saveLastUrl(url);
        
        // Extract the content from the Notion page
        // Looking for the main content between specific markers
        const contentMatch = text.match(/(?<=<main>).*?(?=<\/main>)/s);
        if (!contentMatch) {
            throw new Error('Could not find content in Notion page');
        }

        // Convert HTML content to plain text and format it
        let content = contentMatch[0]
            .replace(/<[^>]+>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
            .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines
            .trim();

        return content;
    } catch (error) {
        console.error('Error fetching Notion data:', error);
        throw error;
    }
}

export function saveLastUrl(url) {
    try {
        fs.writeFileSync(STORAGE_FILE, url, 'utf8');
    } catch (error) {
        console.error('Error saving last URL:', error);
    }
}

export function getLastUrl() {
    try {
        if (fs.existsSync(STORAGE_FILE)) {
            return fs.readFileSync(STORAGE_FILE, 'utf8');
        }
    } catch (error) {
        console.error('Error reading last URL:', error);
    }
    return null;
}
