chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // Only shows video-nail when playing a video, not 
    // on other pages (trending page, channel page, home page, etc.)
    if (changeInfo.url) {
        if (changeInfo.url.includes("youtube.com/watch?v=")) {
            chrome.tabs.executeScript({file: "content.js"});
        } else if (changeInfo.url.includes("youtube.com")) {
            chrome.tabs.executeScript({file: "removeVideoNail.js"});
        }
    }
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript({file: "toggle.js"});
 });
