let enabled = true;
let videoNailOptions = {sync: true};

chrome.tabs.query({active: true, currentWindow: true}, tabs => {
  if (tabs && tabs[0]) {
    chrome.storage.local.set({activeTab: tabs[0].id});
  }
});

chrome.storage.local.get('VN_state', state => {
  if(state && state.VN_state) enabled = state.VN_state.enabled;
  else {
    chrome.storage.local.set({
      VN_state: {
          enabled: enabled
      }
    });
  }
});

// Keep track of active tab
chrome.tabs.onActivated.addListener(info => {
  chrome.storage.local.get('activeTab', data => {
    console.log('old tab: ' + data.activeTab);
    chrome.storage.sync.get('videoNailOptions', options => {
      if (options.videoNailOptions.sync) {
        chrome.tabs.sendMessage(data.activeTab, {type: "IS-BACKGROUND-TAB"});
        chrome.tabs.sendMessage(info.tabId, {type: "IS-ACTIVE-TAB"});
      }
    })
    chrome.storage.local.set({activeTab: info.tabId});
  });
});
chrome.windows.onFocusChanged.addListener(windowId => {
  if(windowId !== -1)
  chrome.storage.local.get('activeTab', data => {
    console.log('Window change, old tab: ' + data.activeTab);
    chrome.storage.sync.get('videoNailOptions', options => {
      if (options.videoNailOptions.sync) {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
          if (tabs && tabs[0] && tabs[0].id !== data.activeTab) {
            chrome.tabs.sendMessage(data.activeTab, {type: "IS-BACKGROUND-TAB"});
            chrome.tabs.sendMessage(tabs[0].id, {type: "IS-ACTIVE-TAB"});
          }
          chrome.storage.local.set({activeTab: tabs[0].id});
        });
      }
    });
  });
})

// Listens for same page YouTube navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && enabled) {
    // Save the tab videoData object
    chrome.tabs.get(tabId, tab => {
      if (tab.url.includes("youtube.com/watch?v=")) {
        chrome.tabs.sendMessage(tab.id, { type: "YT-WATCH" });
      } else if (tab.url.includes("youtube.com")) {
        chrome.tabs.sendMessage(tab.id, { type: "SAVE" }, response => {
          if (response && response.type === "SET") {
            // Write data to storage
            chrome.storage.sync.get('videoNailOptions', data => {
              let vidData = {};
              data.videoNailOptions.sync ? vidData['videoNailSyncedVid'] = response.data : vidData[navEvent.tabId] = response.data;
              chrome.storage.local.set(vidData, _ => {
                chrome.tabs.sendMessage(tab.id, { type: "YT-OTHER" });
              });          
            });
          }
        });
      }
    });
    // Remove context menu if on /watch and tab is active
    // chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    //   if (!tabs.length || tabs[0].id !== tabId) return;
    //   var tab = tabs[0];
    //   if (tab.url.includes("youtube.com/watch?v=")) {
    //     toggleContextMenu(false);
    //   }
    //   else if (tab.url.includes("youtube.com")) {
    //     toggleContextMenu(true);
    //   }
    // });
  }
});

// Listens for regular navigation
chrome.webNavigation.onBeforeNavigate.addListener(navEvent => {
  // Target only nav of main document (and not iframes)
  if (navEvent.frameId === 0 && !navEvent.url.includes("youtube.com/watch") && enabled) {
    // Send Message to get video metadata and position
    chrome.tabs.sendMessage(navEvent.tabId, { type: "SAVE" }, response => {
      if (response && response.type === "SET") {
        // Write data to storage
        chrome.storage.sync.get('videoNailOptions', data => {
          let vidData = {};
          data.videoNailOptions.sync ? vidData['videoNailSyncedVid'] = response.data : vidData[navEvent.tabId] = response.data;
          chrome.storage.local.set(vidData);          
        });
      }
    });
  }
});

// On tab closed, remove from storage
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  chrome.storage.local.remove(tabId.toString());
});

// On receiving a message from a tab (GET storage data, CLOSE videonail, SYNC-CREATE)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (sender.tab && request.type === "GET") sendResponse(sender.tab.id);
  else if (sender.tab && request.type === "DELETE") {
    chrome.storage.sync.get('videoNailOptions', data => {
      if (data.videoNailOptions.sync) {
        chrome.storage.local.remove('videoNailSyncedVid');
        chrome.tabs.query({}, tabs => {
          tabs.forEach(element => {
            if (element.id !== sender.tab.id) chrome.tabs.sendMessage(element.id, {type: "SYNC-DELETE"});
          });
        });
      } else chrome.storage.local.remove(sender.tab.id.toString());
    });
  } 
  // Create a video nail in sync mode. Create videonails on all tabs
  else if (sender.tab && request.type === "SYNC-CREATE") {
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(element => {
        if (element.id !== sender.tab.id) {
          chrome.tabs.sendMessage(element.id, {type: "SYNC-CREATE-BACKGROUND", videoData: request.videoData || null});
        }
      });
    });
  } 
  // Query from a tab when content script is loaded to check if it is the active tab
  else if (sender.tab && request.type === "ACTIVE-TAB-CHECK") {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      tabs && tabs[0] && tabs[0].id === sender.tab.id ? chrome.tabs.sendMessage(sender.tab.id, {type: "TAB-CHECK-RESULT", isActiveTab: true}) : chrome.tabs.sendMessage(sender.tab.id, {type: "TAB-CHECK-RESULT", isActiveTab: false})
    });
  }
  // Start from sync button
  else if (sender.tab && request.type === "SYNC-BUTTON-START") {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, {type: "MANUAL-START", url: request.url, timestamp: request.timestamp});
    });
  }
});


function onInstalled() {
  createContextMenu();
  chrome.storage.local.get('VN_state', function (state) {
    let VN_enabled = true;
    if(state && state.VN_state) VN_enabled = state.VN_state.enabled;
    chrome.storage.local.clear(function () {
      chrome.storage.local.set({
        VN_state: {
            enabled: VN_enabled
        }
      });
    });
  });
  // Keep videonail options, or create them if they don't exist
  chrome.storage.sync.get('videoNailOptions', data => {
    if(Object.keys(data).length === 0 && data.constructor === Object) {
      chrome.storage.sync.set({videoNailOptions: {
        sync: true
      }});
    } else videoNailOptions = data;
  });
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    if (tabs && tabs[0]) {
      chrome.storage.local.set({activeTab: tabs[0].id});
    }
  });
  chrome.contextMenus.onClicked.addListener(contextMenuListener);
}

// On installation
chrome.runtime.onInstalled.addListener(() => {
  onInstalled();
});
// On startup
// We create the context menu on startup because apparently when Chrome updates
// it doesn't save context menus
// Also update state, just in case Chrome update breaks something else
chrome.runtime.onStartup.addListener(() => {
  onInstalled();
});
chrome.contextMenus.onClicked.addListener(contextMenuListener);

// Create context menu
function createContextMenu() {
  chrome.contextMenus.create({
    contexts: ["link"],
    title: "Start VideoNail",
    targetUrlPatterns: ["*://*.youtube.com/watch*", "*://*.youtu.be/*", "*://*.youtube.com/embed/*"],
    id: "VideoNail_link",
    enabled: true
  });
  chrome.contextMenus.create({
    contexts: ["frame"],
    title: "Start VideoNail",
    documentUrlPatterns: ["*://*.youtube.com/watch*", "*://*.youtu.be/*", "*://*.youtube.com/embed/*"],
    id: "VideoNail_frame",
    enabled: true
  });
}

// toggle disabled/enabled state of context menus
function toggleContextMenu(enable) {
  chrome.contextMenus.update("VideoNail_link", {enabled: enable});
  chrome.contextMenus.update("VideoNail_frame", {enabled: enable});
}

// Context menu onClickListener - When clicked, send message to content script to start VideoNail
function contextMenuListener(info, tab) {
  if (info.menuItemId === "VideoNail_link" || info.menuItemId === "VideoNail_frame") {
    chrome.tabs.sendMessage(tab.id, {type: "MANUAL-START", url: info.linkUrl || info.frameUrl});  
  }
}

function checkContextMenuValid(activeInfo) {
  chrome.tabs.get(activeInfo.tabId || activeInfo.id, tabInfo => {
    if (tabInfo.url.includes("youtube.com/watch") || !enabled)  {
      toggleContextMenu(false);
    }
    else {
      toggleContextMenu(true);
    }
  });
}

// Disable context menu on /watch pages
// chrome.tabs.onActivated.addListener(activeInfo => {  
//   checkContextMenuValid(activeInfo);
// });

// Listen for VN_state change
chrome.storage.onChanged.addListener((changes, areaName) => {
  if(areaName === 'local') {
    chrome.storage.local.get('VN_state', state => {
      if(state && state.VN_state) enabled = state.VN_state.enabled;
      else {
        chrome.storage.local.set({
          VN_state: {
              enabled: enabled
          }
        });
      }
      // if(!enabled) toggleContextMenu(false);
      // else {
      //   chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      //     checkContextMenuValid(tabs[0]);
      //   });
      // }
    });    
  }
});