chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.to === "watch page") {
    onWatchPage();
  } else if (request.to === "other YT page") {
    onOtherPage();
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
  lastSavedStyle = elRefs.videoNailContainer.style.cssText;
  state.inPipMode = false;

  // If we're from other YT pages, remove the entire container,
  // then set up like usual
  if (!state.currPage.includes("youtube.com/watch")) {
    removeVideoNailPlayer();
    initWatchPage();
  }

  // If we're from another /watch page, remove the header & unwrap container
  if (state.currPage.includes("youtube.com/watch")) {
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
