// ** TO-DO: send message to background script when 'x' button is closed on otherPages

// On loading a new page, get data from chrome.storage. 
// Only background script has access to tabId, so we need to send message to background to get tabId
chrome.runtime.sendMessage({type: "GET"}, response => {
  console.log(response);  // this is the tabId, now read from storage
  chrome.storage.local.get(response.toString(), result => {
    // would write this to a variable / init videonail based on this result
    console.log(result);
  })
});

// Listen for navigation events detected by background.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // If YouTube same page nav
  if (request.type === "YT-NAV") {
    if (request.target === "watch page") {
      onWatchPage();
    } else if (request.target === "other YT page") {
      onOtherPage();
    }
  }
  // Regular nav
  else if (request.type === "REGULAR-NAV") {
    console.log(window.location.href);
    let response = {
      type: "SET",
      url: window.location.href
    }
    // TODO: getBoundingClientRect will not work as expected if on watch page in std-mode. In this case, use lastsavedstyle?
    if (elRefs.videoNailContainer) {
      response.body = {
        position: elRefs.videoNailContainer.getBoundingClientRect(),
        vidMetadata: null
      }
    } else { response.body - null};
    sendResponse(response);
  }
});

if (window.location.pathname == "/watch") {
  initWatchPage();
} else {
  initOtherPage();
}
state.currPage = window.location.href;

function initWatchPage() {
  state.isPolymer = document.querySelector("body#body") === null;
  if (state.isPolymer) watchCheckQuery = "ytd-watch";
  else watchCheckQuery = "#player-api";
  checkIfWatching();
}

function onWatchPage() {
  // If we're from other YT pages, remove the entire container,
  // then set up like usual
  if (document.querySelector("#videonail-container")) {
    removeVideoNailPlayer();
    initWatchPage();
  }

  // If we're from another /watch page, remove the header & unwrap container
  if (
    state.currPage.includes("youtube.com/watch") &&
    elRefs.videoNailContainer
  ) {
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
  }
  state.currPage = window.location.href;
}

function initOtherPage() {
  setupVideoNailPlayer()
    .then(_ => {
      animate();
      return addBellsAndOrnaments();
    })
    .catch(err => console.log(err));
}

function onOtherPage() {
  // If we're from YT, remove the header & unwrap
  // If we're from other YT pages, do nothing to keep the same video
  // from reloading
  if (
    state.currPage.includes("youtube.com/watch") &&
    elRefs.videoNailContainer
  ) {
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
