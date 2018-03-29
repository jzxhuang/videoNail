// TODO: make videos persistent across all YouTube pages
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url) {
        if (changeInfo.url.includes("youtube.com")) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                var tab = tabs[0];
                if (!tab.url.includes("youtube.com/watch?v=")) {
                    chrome.tabs.executeScript(null, {file: "otherPage.js"});
                    chrome.tabs.insertCSS(null, {file: "videonail.css"});
                }
            });
        }
    }
});