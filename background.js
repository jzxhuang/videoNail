chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url) {
        if (changeInfo.url.includes("youtube")) {
            chrome.tabs.executeScript({file: "content.js"});
        }
    }
});
