// Listens for same page YouTube navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs.length || tabs[0].id !== tabId) return;
      var tab = tabs[0];
      if (tab.url.includes("youtube.com/watch?v=")) {
        chrome.tabs.sendMessage(tab.id, { type: "YT-WATCH" });
      } else if (tab.url.includes("youtube.com")) {
        chrome.tabs.sendMessage(tab.id, { type: "SAVE" }, response => {
          if (response && response.type === "SET") {
            // Write data to storage
            let vidData = {};
            vidData[tab.id] = response.data;
            chrome.storage.local.set(vidData, _ => {
                chrome.tabs.sendMessage(tab.id, { type: "YT-OTHER" });
            })
          }
        });
      }
    });
  }
});

// Listens for regular navigation
chrome.webNavigation.onBeforeNavigate.addListener(navEvent => {
  // Target only nav of main document (and not iframes)
  if (navEvent.frameId === 0 && !navEvent.url.includes("youtube.com/watch")) {
    // Send Message to get video metadata and position
    chrome.tabs.sendMessage(navEvent.tabId, { type: "SAVE" }, response => {
      if (response && response.type === "SET") {
        // Write data to storage
        let vidData = {};
        console.log(response.data);
        vidData[navEvent.tabId] = response.data;
        chrome.storage.local.set(vidData);
      }
    });
  }
});

// On tab closed, remove from storage
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  chrome.storage.local.remove(tabId.toString());
});

// On receiving a message from a tab (GET storage data, CLOSE videonail)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (sender.tab && request.type === "GET") sendResponse(sender.tab.id);
  else if (sender.tab && request.type === "DELETE") {
    chrome.storage.local.remove(sender.tab.id.toString());
  }
});

// On installation, create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    contexts: ["link"],
    title: 'Start VideoNail',
    targetUrlPatterns: ["*://*.youtube.com/watch*"],
    id: 'VideoNail'
  })
});
chrome.contextMenus.onClicked.addListener(contextMenuListener);

// Context menu listener
function contextMenuListener(info, tab) {
  if (info.menuItemId === "VideoNail") {
    console.log(info);
    console.log(tab);
    chrome.tabs.sendMessage(tab.id, {type: "MANUAL-START", url: info.linkUrl});  
  }
  
}