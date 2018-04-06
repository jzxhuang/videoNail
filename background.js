// chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
//     console.log(details);
//     if (details.url.includes("youtube.com/watch?")) {
//         chrome.tabs.executeScript(null, { file: "videonail.js" });
//         chrome.tabs.insertCSS(null, { file: "videonail.css" });
//     } else {
//         chrome.tabs.executeScript(null, { file: "otherPage.js" });
//         chrome.tabs.insertCSS(null, { file: "videonail.css" });
//     }
// })
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.url) {
        if (changeInfo.url.includes("youtube.com")) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                var tab = tabs[0];
                if (!tab.url.includes("youtube.com/watch?v=")) {
                    chrome.tabs.executeScript(tab.id, { file: "resetState.js" }, function () {
                        chrome.tabs.executeScript(tab.id, { file: "otherPage.js" });
                    });
                    chrome.tabs.insertCSS(tab.id, { file: "videonail.css" });
                } else {
                    chrome.tabs.executeScript(tab.id, { file: "resetState.js" }, function () {
                        chrome.tabs.executeScript(tab.id, { file: "videonail.js" });
                    });
                    chrome.tabs.insertCSS(tab.id, { file: "videonail.css" });
                }
            });
        }
    }
});