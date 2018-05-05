state.currPage = window.location.href;
chrome.runtime.sendMessage({ type: "ACTIVE-TAB-CHECK" });

// Listen for events from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // If YouTube same page nav
  if (request.type === "YT-WATCH") {
    onWatchPage();
  } else if (request.type === "YT-OTHER") {
    onOtherPage();
  } else if (request.type === "OTHER") {
    initOtherPage();
  } else if (request.type === "SAVE") {
    if (elRefs.videoNailContainer) {
      //If on /watch page, get vid metadata. On other pages, it is updated through timer
      if (state.currPage.includes("youtube.com/watch")) {
        if (!videoNailOptions.sync) {
          videoData.metadata.timestamp = document.querySelector("div.ytp-time-display>span.ytp-time-current").textContent;
          let vidLength = document.querySelector("div.ytp-time-display>span.ytp-time-duration").textContent;
          videoData.metadata.isPlaying = document.querySelector("div.html5-video-player").classList.contains("paused-mode") ? false : true;
          if (vidLength !== videoData.metadata.timestamp) {
            sendResponse({ type: "SET", data: videoData });
          }
          else {
            sendResponse({ type: "SET", data: null });
          }
        } else state.syncVidActive ? sendResponse({ type: "SET", data: videoData }) : sendResponse({ type: "SET", data: null });
      }
      else {
        sendResponse({ type: "SET", data: videoData });
      }
    }
  } else if (request.type === "TAB-CHECK-RESULT") {
    state.isActiveTab = request.isActiveTab;
    chrome.storage.local.get('VN_state', data => {
      if (data && data.VN_state) {
        VN_enabled = data.VN_state.enabled;
      } else {
        chrome.storage.local.set({
          VN_state: {
            enabled: VN_enabled
          }
        });
      }
      if (VN_enabled) {
        // Get VN options from sync storage
        chrome.storage.sync.get('videoNailOptions', data => {
          videoNailOptions = data.videoNailOptions;
          if (state.currPage.includes("youtube.com/watch")) initWatchPage();
          else initOtherPage();
        });
      }
    });
  }
  // Starting VN from context menu or popup
  else if (request.type === "MANUAL-START") {
    if (!window.location.href.includes('youtube.com/watch')) {
      // Cases for if videonail container already exists
      if (elRefs.videoNailContainer) {
        window.removeEventListener("message", windowMessageListener, false);
        setVidId(request.url)
          .then(_ => {
            // If container exists, simply load new video by changing src and updating browserscript metadata
            let srcString = `https://www.youtube.com/embed/${videoData.metadata.id}?enablejsapi=1&modestbranding=1&autoplay=1&origin=${window.location.origin}`;
            if (videoData.metadata.isPlaylist) srcString += `&listType=playlist&list=${videoData.metadata.playlistId}`;
            elRefs.videoNailPlayer.src = srcString;
            videoData.metadata.timestamp = "0:00";
            videoData.metadata.isPlaying = true;
            sendWindowMessage("MANUAL-NEW");
          })
          .then(_ => {
            if (videoNailOptions.sync) {
              chrome.storage.local.set({ videoNailSyncedVid: videoData }, function () {
                state.syncVidActive = true;
                chrome.runtime.sendMessage({ type: "SYNC-CREATE", videoData: videoData });
                window.addEventListener("message", windowMessageListener, false);
              });
            }
          })
          .catch(err => {
            console.log(err);
          });
      } else {
        // If no container, then go through usual initOtherPage process, always autoplay
        setVidId(request.url)
          .then(_ => {
            videoData.metadata.timestamp = "0:00";
            videoData.metadata.isPlaying = true;
            initOtherPage(videoData)
          })
          .then(_ => {
            if (videoNailOptions.sync) {
              state.syncVidActive = true;
              chrome.storage.local.set({ videoNailSyncedVid: videoData }, function () {
                chrome.runtime.sendMessage({ type: "SYNC-CREATE" });
              });
            }
          })
          .catch(err => {
            console.log(err);
          });
      }
    } else {
      if (videoNailOptions.sync) {
        if (state.syncVidActive) {
          // If container exists, simply load new video by changing src and updating browserscript metadata
          window.removeEventListener("message", windowMessageListener, false);
          setVidId(request.url)
            .then(_ => {
              // If container exists, simply load new video by changing src and updating browserscript metadata
              let srcString = `https://www.youtube.com/embed/${videoData.metadata.id}?enablejsapi=1&modestbranding=1&autoplay=1&origin=${window.location.origin}`;
              if (videoData.metadata.isPlaylist) srcString += `&listType=playlist&list=${videoData.metadata.playlistId}`;
              let startTime = 0;
              if (request.timestamp) {
                let timeArray = request.timestamp.split(":");
                for (let i = timeArray.length - 1; i >= 0; --i) startTime += parseInt(timeArray[i]) * Math.pow(60, timeArray.length - 1 - i);
              }
              srcString += "&start=" + startTime;
              elRefs.videoNailPlayer.src = srcString;
              videoData.metadata.timestamp = startTime || "0:00";
              videoData.metadata.isPlaying = true;
              sendWindowMessage("MANUAL-NEW");
            })
            .then(_ => {
              if (videoNailOptions.sync) {
                chrome.storage.local.set({ videoNailSyncedVid: videoData }, function () {
                  state.syncVidActive = true;
                  chrome.runtime.sendMessage({ type: "SYNC-CREATE", videoData: videoData });
                  window.addEventListener("message", windowMessageListener, false);
                });
                if (!document.querySelector("div.html5-video-player").classList.contains("paused-mode")) document.querySelector("button.ytp-play-button.ytp-button").click();
              }
            })
            .catch(err => {
              console.log(err);
            });
        } else {
          removeVideoNailHeader()
            .then(_ => {
              return unwrapAll(elRefs.videoNailContainer);
            })
            .then(_ => {
              elRefs.originalPlayerSection.classList.toggle("videonail", false);
              document.querySelector("div#player-container").classList.remove("videonail-player-active");
              observer.disconnect();
              if (!document.querySelector("div.html5-video-player").classList.contains("paused-mode")) document.querySelector("button.ytp-play-button.ytp-button").click();
              setVidId(request.url);
            })
            .then(_ => {
              let startTime = 0;
              if (request.timestamp) {
                let timeArray = request.timestamp.split(":");
                for (let i = timeArray.length - 1; i >= 0; --i) startTime += parseInt(timeArray[i]) * Math.pow(60, timeArray.length - 1 - i);
              }
              videoData.metadata.timestamp = startTime;
              videoData.metadata.isPlaying = true;
              initOtherPage(videoData)
            })
            .then(_ => {
              state.syncVidActive = true;
              chrome.storage.local.set({ videoNailSyncedVid: videoData }, function () {
                chrome.runtime.sendMessage({ type: "SYNC-CREATE" });
              });
            })
            .catch(err => console.log(err));
        }
      }
    }
  } else if (request.type === "SYNC-CREATE-BACKGROUND") {
    // Synced tabs, initalize videonail in background 
    state.syncVidActive = true;
    if (!window.location.href.includes('youtube.com/watch')) {
      // Get synced vid data
      chrome.storage.local.get('videoNailSyncedVid', data => {
        videoData = request.videoData || data.videoNailSyncedVid;
        if (elRefs.videoNailContainer) {
          let srcString = `https://www.youtube.com/embed/${videoData.metadata.id}?enablejsapi=1&modestbranding=1&autoplay=0&origin=${window.location.origin}`;
          if (videoData.metadata.isPlaylist) srcString += `&listType=playlist&list=${videoData.metadata.playlistId}`;
          elRefs.videoNailPlayer.src = srcString;
          videoData.metadata.isPlaying = false;
          sendWindowMessage("MANUAL-NEW");
        } else {
          videoData.metadata.isPlaying = false;
          initOtherPage(videoData);
        }
      });
    }
  } else if (request.type === "SYNC-DELETE") {
    if (elRefs.videoNailContainer) {
      removeVideoNailPlayer();
      sendWindowMessage("DELETE");
      reset();
      if (window.location.href.includes('youtube.com/watch')) initScrollingPip();
    }
  }
  // The tab has been switched to active tab
  else if (request.type === "IS-ACTIVE-TAB") {
    state.isActiveTab = true;
    window.addEventListener("message", windowMessageListener, false);
    if (elRefs.videoNailContainer) {
      chrome.storage.local.get('videoNailSyncedVid', data => {
        if (state.syncVidActive && data.videoNailSyncedVid) {
          sendWindowMessage("ACTIVE-TAB");
          videoData = data.videoNailSyncedVid;
          setStyle(videoData);
        }
      })
    }
  }
  // The tab is no longer the active tab
  else if (request.type === "IS-BACKGROUND-TAB") {
    state.isActiveTab = false;
    window.removeEventListener("message", windowMessageListener, false);
    if (state.syncVidActive) sendWindowMessage("BACKGROUND-TAB");
  }
  // VideoNail disabled from popup
  else if (request.type === 'VN-DISABLE') {
    if (elRefs.videoNailContainer) {
      removeVideoNailPlayer();
      sendWindowMessage("DELETE");
      chrome.runtime.sendMessage({
        type: "DELETE"
      });
      reset();
    }
  }
});

function initWatchPage() {
  if (videoNailOptions.sync) {
    chrome.storage.local.get('videoNailSyncedVid', data => {
      if (data.videoNailSyncedVid) {
        videoData = data.videoNailSyncedVid;
        initOtherPage(videoData);
      } else initScrollingPip();
    });
  } else initScrollingPip();
}

function initScrollingPip() {
  state.isPolymer = document.querySelector("body#body") === null;
  state.currPage = window.location.href;
  if (state.isPolymer) watchCheckQuery = "ytd-watch";
  else watchCheckQuery = "#player-api";
  checkIfWatching();
}

function onWatchPage() {
  // Only save style if the video was in pip mode
  // (other page, watch page when scrolled down)
  state.inPipMode = false;

  // If we're from other YT pages, remove the entire container, then set up like usual
  if (!state.syncVidActive) {
    if (
      !state.currPage.includes("youtube.com/watch") &&
      document.querySelector("#videonail-container")
    ) {
      sendWindowMessage("DELETE");
      removeVideoNailPlayer();
      initWatchPage();
    } else if (state.currPage.includes("youtube.com/watch")) {
      // If we're from another /watch page, remove the header & unwrap container
      removeVideoNailHeader()
        .then(_ => {
          return unwrapAll(elRefs.videoNailContainer);
        })
        .then(_ => {
          elRefs.originalPlayerSection.classList.toggle("videonail", false);
        })
        .then(_ => {
          initWatchPage();
        })
        .catch(err => console.log(err));
    } else {
      initWatchPage();
    }
  } else {

  }
  state.currPage = window.location.href;
}

function initOtherPage(vData) {
  // If an input parameter is passed, this is being called from a manual action. Do not need to fetch from storage
  if (vData) {
    setupVideoNailPlayer(vData)
      .then(_ => {
        if (videoNailOptions.sync) state.syncVidActive = true;
        window.addEventListener("message", windowMessageListener, false);
        injectBrowserScript();
        return addBellsAndOrnaments();
      })
      .catch(err => console.log(err));
  } else {
    fetchVidData()
      .then(data => {
        videoData = data;
        window.addEventListener("message", windowMessageListener, false);
        return setupVideoNailPlayer(data);
      })
      .then(_ => {
        if (videoNailOptions.sync) state.syncVidActive = true;
        injectBrowserScript();
        return addBellsAndOrnaments();
      })
      .catch(err => console.log(err));
  }
}

function onOtherPage() {
  // If we're from YT, remove the header & unwrap
  // If we're from other YT pages, do nothing to keep the same video from reloading
  if (state.currPage.includes("youtube.com/watch")) {
    if (!state.syncVidActive) {
      removeVideoNailHeader()
        .then(_ => {
          return unwrapAll(elRefs.videoNailContainer);
        })
        .then(_ => {
          elRefs.originalPlayerSection.classList.toggle("videonail", false);
        })
        .then(_ => {
          initOtherPage();
        })
        .catch(err => console.log(err));
    }
  }
  state.currPage = window.location.href;
}
