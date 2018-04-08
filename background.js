chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url && changeInfo.url.includes("youtube.com")) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var tab = tabs[0];
      if (!tab.url.includes("youtube.com/watch?v=")) {
        chrome.tabs.sendMessage(tab.id, { to: "other YT page" });
      } else {
        chrome.tabs.sendMessage(tab.id, { to: "watch page" });
      }
    });
  }
});
