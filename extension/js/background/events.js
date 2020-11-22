import {browser} from '../api/webextension.js';
import {actions} from './actions.js';
import {storageMessageHandler, storage} from './storage.js';



function addListeners(){
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.event === "storage"){
            storageMessageHandler(request, sender, sendResponse);
        }
        else if (request.event === "readyCheck"){
            sendResponse(storage.ready);
        }
        else if (request.event === "openPlayer"){
            actions.openPlayer(request.queryStr, sender.tab.index+1);
        }
    });

    browser.runtime.onInstalled.addListener(function (object) {
        if(browser.runtime.OnInstalledReason.INSTALL === object.reason){
            actions.openList();   
        }
    });

    browser.browserAction.onClicked.addListener(function(tab) {
        browser.tabs.getSelected(tab=>{
            actions.openList(tab.index+1);
        });
    });
}


addListeners();
