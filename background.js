/* 
** STRUCTURE OF STORAGE **
{
    <tabId>: {
        position: {...},
        vidMetadata: {...}
    }
}
*/

// Listens for same page YouTube navigation
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.url && changeInfo.url.includes("youtube.com")) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var tab = tabs[0];
            if (!tab.url.includes("youtube.com/watch?v=")) {
                chrome.tabs.sendMessage(tab.id, { type: "YT-NAV", target: "other YT page" });
            } else {
                chrome.tabs.sendMessage(tab.id, { type: "YT-NAV", target: "watch page" });
            }
        });
    }
});

// Listens for regular navigation
chrome.webNavigation.onBeforeNavigate.addListener(navEvent => {
    // Target only nav of main document (and not iframes)
    if (navEvent.frameId === 0) {
        // Send Message to get video metadata and position
        chrome.tabs.sendMessage(navEvent.tabId, { type: "REGULAR-NAV" }, response => {
            if (response) {
                if (response.type === "SET") {
                    // Write data to storage
                    let toWrite = {};
                    toWrite[navEvent.tabId] = response.body;
                    chrome.storage.local.set(toWrite);
                }
            }
        })
    }
})

// On tab closed, remove from storage
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    chrome.storage.local.remove(tabId.toString());
});

// On receivng a message from a tab (GET storage data, CLOSE videonail)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // If GET, return tabId
    if (sender.tab && request.type === "GET") sendResponse(sender.tab.id);
    // If DELETE, clear corresponding key in storage
    else if (sender.tab && request.type === "DELETE") {
        chrome.storage.local.remove(sender.tab.id.toString());
    }
})