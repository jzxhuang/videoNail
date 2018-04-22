state.currPage = window.location.href;
chrome.storage.local.get('VN_state', data => {
  if(data && data.VN_state) {
    VN_enabled = data.VN_state.enabled;
  }
  else {
    chrome.storage.local.set({
      VN_state: {
          enabled: VN_enabled
      }
    });
  }
  if (VN_enabled) {
    if (state.currPage.includes("youtube.com/watch")) initWatchPage();
    else initOtherPage();
  }
})

// Listen for navigation events detected by background.js
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
        videoData.metadata.timestamp = document.querySelector("div.ytp-time-display>span.ytp-time-current").textContent;
        videoData.metadata.isPlaying = document.querySelector("div.html5-video-player").classList.contains("paused-mode") ? false : true;
      }
      sendResponse({ type: "SET", data: videoData });
    }
  } else if (request.type === "MANUAL-START") {
    if (!window.location.href.includes('youtube.com/watch')) {
      // Cases for if videonail container already exists
      if (elRefs.videoNailContainer) {
        setVidId(request.url)
          .then(_ => {
            // If playlist, need to resfresh container. Otherwise, can load new video by changing src
            if (videoData.metadata.isPlaylist) {
              removeVideoNailPlayer();
              sendWindowMessage("DELETE");
              videoData.metadata.timestamp = "0:00";
              initOtherPage(videoData);
            } else {
              elRefs.videoNailPlayer.src = `https://www.youtube.com/embed/${videoData.metadata.id}?enablejsapi=1&modestbranding=1&autoplay=1&origin=${window.location.origin}`
              sendWindowMessage("MANUAL-NEW");
            }
          })
          .catch(err => { 
            console.log(err);
          });
      } else {
        // If no container, then go through usual initOtherPage process, always autoplay
        setVidId(request.url)
          .then(_ => {
            videoData.metadata.isPlaying = true;
            initOtherPage(videoData)
          })
          .catch(err => { 
            console.log(err);
          });
      }
    }
  }
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

  // If we're from other YT pages, remove the entire container,
  // then set up like usual
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
  state.currPage = window.location.href;
}

function initOtherPage(vData) {
  if (vData) {
    setupVideoNailPlayer(vData)
      .then(_ => {
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
  state.currPage = window.location.href;
}
