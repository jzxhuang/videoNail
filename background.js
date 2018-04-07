chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.url) {
        if (changeInfo.url.includes("youtube.com")) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                var tab = tabs[0];
                if (!tab.url.includes("youtube.com/watch?v=")) {
                        chrome.tabs.executeScript(tab.id, { file: "otherPage.js" }, function () {
                            console.log("other YT pages");
                        });
                    chrome.tabs.insertCSS(tab.id, { file: "videonail.css" });
                } else {
                    chrome.tabs.executeScript(tab.id, { file: "resetState.js" }, function () {
                        chrome.tabs.executeScript(tab.id, { file: "videonail.js" }, function () {
                            console.log("watch page");
                        });
                    });
                    chrome.tabs.insertCSS(tab.id, { file: "videonail.css" });
                }
            });
        }
    }
});