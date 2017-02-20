chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url) {
        if (changeInfo.url.includes("youtube.com/watch")) {
            chrome.tabs.executeScript({file: "content.js"});
        }
    }
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript({file: "toggle.js"});
 });
