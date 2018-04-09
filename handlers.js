// ** TO-DO: send message to background script when 'x' button is closed on otherPages

// Listen for navigation events detected by background.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // If YouTube same page nav
  if (request.type === "YT-WATCH") {
    onWatchPage();
  } else if (request.type === "YT-OTHER") {
    onOtherPage();
  } else if (request.type === "OTHER") {
    initOtherPage();
  } else if (request.type == "SAVE") {
    // TODO: extract data and send it back thru sendResponse
    var response = {
      type: "SET",
      data: {
        id: "ZHb-QsAnEiY",
        style:
          "width: 526px; height: 319.25px; cursor: default; top: 402px; left: 192px;",
        metadata: {
          position: "1:24",
          speed: "0.5",
          quality: "480p"
        }
      }
    };
    sendResponse(response);
  }
});

state.currPage = window.location.href;
if (state.currPage.includes("youtube.com/watch")) initWatchPage();
else if (state.currPage.includes("youtube.com")) {
} else initOtherPage();

function initWatchPage() {
  state.isPolymer = document.querySelector("body#body") === null;
  if (state.isPolymer) watchCheckQuery = "ytd-watch";
  else watchCheckQuery = "#player-api";
  checkIfWatching();
}

function onWatchPage() {
  // Only save style if the video was in pip mode
  // (other page, watch page when scrolled down)
  if (elRefs.videoNailContainer && state.inPipMode)
    lastSavedStyle = elRefs.videoNailContainer.style.cssText;
  state.inPipMode = false;

  // If we're from other YT pages, remove the entire container,
  // then set up like usual
  if (
    !state.currPage.includes("youtube.com/watch") &&
    document.querySelector("#videonail-container")
  ) {
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

function initOtherPage() {
  fetchVidData()
    .then(data => {
      return setupVideoNailPlayer(data);
    })
    .then(_ => {
      return addBellsAndOrnaments();
    })
    .catch(err => console.log(err));
}

function onOtherPage() {
  // If we're from YT, remove the header & unwrap
  // If we're from other YT pages, do nothing to keep the same video
  // from reloading
  lastSavedStyle = elRefs.videoNailContainer.style.cssText;
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
