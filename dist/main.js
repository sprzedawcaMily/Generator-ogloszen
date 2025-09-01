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
async function apiCall(endpoint, method = "GET", data) {
  const response = await fetch(`http://localhost:3002${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: data ? JSON.stringify(data) : undefined
  });
  return await response.json();
}
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
function createControlPanel() {
  const panel = document.createElement("div");
  panel.className = "control-panel";
  const title = document.createElement("h2");
  title.textContent = "Automatyzacja Vinted";
  panel.appendChild(title);
  const puppeteerButton = document.createElement("button");
  puppeteerButton.textContent = "Uruchom Puppeteer - Logowanie Vinted";
  puppeteerButton.addEventListener("click", handlePuppeteerLogin);
  panel.appendChild(puppeteerButton);
  const addItemsButton = document.createElement("button");
  addItemsButton.textContent = "Dodaj wszystkie ogłoszenia";
  addItemsButton.disabled = true;
  addItemsButton.id = "addItemsButton";
  addItemsButton.addEventListener("click", handleAddItems);
  panel.appendChild(addItemsButton);
  const statusDiv = document.createElement("div");
  statusDiv.id = "puppeteerStatus";
  statusDiv.textContent = "Status: Nie uruchomiono";
  panel.appendChild(statusDiv);
  return panel;
}
async function handlePuppeteerLogin() {
  const statusDiv = document.getElementById("puppeteerStatus");
  const addButton = document.getElementById("addItemsButton");
  try {
    if (statusDiv)
      statusDiv.textContent = "Status: Inicjalizacja Puppeteer...";
    const initResult = await apiCall("/api/puppeteer/init", "POST");
    if (!initResult.success) {
      throw new Error(initResult.error);
    }
    if (statusDiv)
      statusDiv.textContent = "Status: Przekierowywanie na stronę logowania...";
    const loginResult = await apiCall("/api/puppeteer/login", "POST");
    if (!loginResult.success) {
      throw new Error(loginResult.error);
    }
    if (statusDiv)
      statusDiv.textContent = "Status: Zalogowano pomyślnie! Można dodawać ogłoszenia.";
    if (addButton)
      addButton.disabled = false;
  } catch (error) {
    console.error("Błąd podczas logowania:", error);
    if (statusDiv)
      statusDiv.textContent = `Status: Błąd - ${error}`;
  }
}
async function handleAddItems() {
  const statusDiv = document.getElementById("puppeteerStatus");
  const addButton = document.getElementById("addItemsButton");
  try {
    addButton.disabled = true;
    if (statusDiv)
      statusDiv.textContent = "Status: Pobieranie danych przedmiotów...";
    const testData = `
        roca wear jersey dlugi rekaw granatowy size L bez wad
        d 77 s 60
        ecko unltd jortsy size 38 granatowe bez wad
        p 48 d 60 u 40 n 32
        `;
    const items = parseData(testData);
    if (statusDiv)
      statusDiv.textContent = `Status: Dodawanie ${items.length} przedmiotów...`;
    const result = await apiCall("/api/puppeteer/add-items", "POST", { items });
    if (!result.success) {
      throw new Error(result.error);
    }
    if (statusDiv)
      statusDiv.textContent = "Status: Wszystkie przedmioty zostały dodane!";
  } catch (error) {
    console.error("Błąd podczas dodawania przedmiotów:", error);
    if (statusDiv)
      statusDiv.textContent = `Status: Błąd - ${error}`;
  } finally {
    addButton.disabled = false;
  }
}
function init() {
  const container = document.getElementById("itemsContainer");
  if (!container)
    return;
  const controlPanel = createControlPanel();
  container.appendChild(controlPanel);
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
