export function parseData(data) {
    const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const items = [];
    let currentItem = null;

    lines.forEach(line => {
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
