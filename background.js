chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // Only shows video-nail when playing a video, not 
    // on other pages (trending page, channel page, home page, etc.)
    if (changeInfo.url) {
        if (changeInfo.url.includes("youtube.com/watch?v=")) {
            chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
                var tab = tabs[0];
                if (tab.url.includes("youtube.com/watch?v=")) {
                    chrome.tabs.executeScript({file: "content.js"});
                    chrome.tabs.insertCSS({file: "videonail.css"});
                }
            });
        }
    }
});


chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript({file: "toggle.js"});
 });