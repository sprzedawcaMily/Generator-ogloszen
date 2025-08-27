import { Item } from './types';
import { parseData } from './parser';

const tagsTemplate = `#hiphop #rap #skate #vintage #OG #90s #00s #y2k #baggy #szerokie #swag #drip #usa #fubu #southpole #rave #drain #tribal #cargo #carpenter #boxy #kani #mass #clinic #jigga #metoda #elpolako #stoprocent`;

function createItemCard(item: Item, index: number) {
    const card = document.createElement('div');
    card.className = 'item-card';

    const itemNumber = document.createElement('span');
    itemNumber.className = 'item-number';
    itemNumber.textContent = String(index + 1);
    card.appendChild(itemNumber);

    const titleElement = document.createElement('div');
    titleElement.className = 'title-preview';
    titleElement.textContent = item.rawTitle;
    card.appendChild(titleElement);

    const detailsElement = document.createElement('div');
    detailsElement.className = 'preview-container';
    detailsElement.textContent = item.details.join('\n');
    card.appendChild(detailsElement);

    return card;
}

function init() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    const testData = `
    roca wear jersey dlugi rekaw granatowy size L bez wad
    d 77 s 60
    ecko unltd jortsy size 38 granatowe bez wad
    p 48 d 60 u 40 n 32
    `;

    const items = parseData(testData);
    items.forEach((item, index) => {
        const card = createItemCard(item, index);
        container.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', init);
