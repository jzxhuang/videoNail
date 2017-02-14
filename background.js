chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    console.log("before changeInfo");
    console.log(changeInfo);
    if (changeInfo.url) {
        if (changeInfo.url.includes("youtube")) {
            console.log("check YouTube url");
            console.log(changeInfo);
            chrome.tabs.executeScript({file: "content.js"});
        }
    }
});
