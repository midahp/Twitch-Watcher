import {browser} from '../api/webextension.js';

const PLAYER_URL = browser.runtime.getURL("../player.html");
const LIST_URL = browser.runtime.getURL("../list.html");

class Actions{
    openList(index){
        browser.tabs.create({ index: index, url: LIST_URL });
    }
    openPlayer(queryStr, index){
        let newUrl = PLAYER_URL + queryStr;
        browser.tabs.create({ index: index, url: newUrl });
    }
}


const actions = new Actions();
export {
    actions,
}
