import { data, tagsTemplate, measurementMap, brandMap, initializeData } from './data.js';
import { formatItem, formatTitle, parseData } from './formatter.js';

// Initialize data when the app starts
async function init() {
    try {
        await initializeData();
        // After data is loaded, you might want to update the UI
        console.log('Data loaded successfully');
    } catch (error) {
        console.error('Failed to load data:', error);
        showMessage('Błąd podczas ładowania danych. Spróbuj ponownie.');
    }
}

// Start initialization
init();

function showMessage(text) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = text;
    messageBox.classList.add('show');
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 2000);
}

function copyToClipboard(text, successMessage) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showMessage(successMessage);
        } else {
            showMessage('Błąd kopiowania, spróbuj ponownie.');
        }
    } catch (err) {
        showMessage('Błąd kopiowania, spróbuj ponownie.');
    }
    document.body.removeChild(tempInput);
}

function createItemCard(item, index) {
    const card = document.createElement('div');
    card.className = 'item-card';

    const itemNumber = document.createElement('span');
    itemNumber.className = 'item-number';
    itemNumber.textContent = index + 1;

    const previewText = formatItem(item);
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    
    const markdownPreview = document.createElement('div');
    markdownPreview.innerHTML = previewText
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\n/g, '<br>');
    previewContainer.appendChild(markdownPreview);

    const titlePreview = document.createElement('div');
    titlePreview.className = 'title-preview';
    const titleText = formatTitle(item);
    titlePreview.textContent = titleText;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex flex-col md:flex-row gap-4 w-full';

    const copyTitleButton = document.createElement('button');
    copyTitleButton.className = 'copy-button title-button flex-1';
    copyTitleButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg> Kopiuj Tytuł`;
    copyTitleButton.onclick = () => copyToClipboard(titleText, 'Tytuł skopiowany!');

    const copyDescButton = document.createElement('button');
    copyDescButton.className = 'copy-button flex-1';
    copyDescButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg> Kopiuj Opis`;
    copyDescButton.onclick = () => copyToClipboard(previewText, 'Opis skopiowany!');

    buttonContainer.appendChild(copyTitleButton);
    buttonContainer.appendChild(copyDescButton);

    card.appendChild(itemNumber);
    card.appendChild(titlePreview);
    card.appendChild(previewContainer);
    card.appendChild(buttonContainer);

    return card;
}

function init() {
    const container = document.getElementById('itemsContainer');
    if (!container) {
        console.error('Container not found!');
        return;
    }

    console.log('Data received:', data);
    const items = parseData(data);
    console.log('Parsed items:', items);

    if (items.length === 0) {
        container.innerHTML = '<div class="text-red-500">Nie znaleziono żadnych przedmiotów</div>';
        return;
    }

    items.forEach((item, index) => {
        const card = createItemCard(item, index);
        container.appendChild(card);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
