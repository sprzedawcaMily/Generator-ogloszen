// src/parser.ts
function parseData(data) {
  const lines = data.split(`
`).map((line) => line.trim()).filter((line) => line.length > 0);
  const items = [];
  let currentItem = null;
  lines.forEach((line) => {
    const isNewItem = line.toLowerCase().match(/^(roca|ecko|phat|rydel|fishbone|unc|affliction|dc|mass|akademiks|konflic|raw|kko|karl|crown|g|extreme|tapout|coogi|mma|dogtown|blind|k1x|dada|hood|ccm|wokal|spodenki|mammoth|fubu|stoprocent|and1|fubuplatinum|b3|iriedaily|ed|vocal|townz|superr|mass|dc|southpole|smiths|clinic|lgb|really|rydel|msbhv|bottle|johnny|5ive|elpolako|karl|fox|senate|afliction|pelle|sancezz|dox|hemp|moro|raw|and|clinic|supreme|jigga|eminem|dressy|mammut|y3|toy|suhu|levis|koman|xtreme|liquidn|bucket|us40|wuntangclan|plecak|okulary|bluza|spodnie|koszulka|koszula|koszyulka|koszyula|kurtka|czapka|klapki|ruuf|topout|lordstyles|clh|twinners|pell|sohk|sir|sanhorn|komann|work|mentor|sean|brand|hoodboyz|ufo|duffs|mecca|time|sweter|zero|aem-kei|no fear|kosmolupo|outkast|artful|cropp|soutpole|taput|tapout)/i);
    if (isNewItem) {
      if (currentItem) {
        items.push(currentItem);
      }
      currentItem = { rawTitle: line, details: [] };
    } else if (currentItem) {
      currentItem.details.push(line);
    }
  });
  if (currentItem) {
    items.push(currentItem);
  }
  return items;
}

// src/main.ts
function createItemCard(item, index) {
  const card = document.createElement("div");
  card.className = "item-card";
  const itemNumber = document.createElement("span");
  itemNumber.className = "item-number";
  itemNumber.textContent = String(index + 1);
  card.appendChild(itemNumber);
  const titleElement = document.createElement("div");
  titleElement.className = "title-preview";
  titleElement.textContent = item.rawTitle;
  card.appendChild(titleElement);
  const detailsElement = document.createElement("div");
  detailsElement.className = "preview-container";
  detailsElement.textContent = item.details.join(`
`);
  card.appendChild(detailsElement);
  return card;
}
function init() {
  const container = document.getElementById("itemsContainer");
  if (!container)
    return;
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
document.addEventListener("DOMContentLoaded", init);
