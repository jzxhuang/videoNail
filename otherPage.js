"use strict";

// ========================================================================= //
// GLOBAL STATE / REFERENCES                                                 //
// ========================================================================= //

const state = {
  manualResize: false,
  isMinimized: false
};

const elRefs = {
  videoNailContainer: null,
  videoNailPlayer: null,
  videoNailHeader: null,
};

const INIT_WIDTH = 474;
const HEADER_AND_BOTTOM_BORDER = 29;
const LEFT_AND_RIGHT_BORDER = 10;
const SCROLL_THRESHOLD = 0.4;
const MIN_WIDTH = 325;
const MIN_HEIGHT = (MIN_WIDTH - LEFT_AND_RIGHT_BORDER) / 16 * 9 + HEADER_AND_BOTTOM_BORDER;
const EDGE_MARGIN = 5;
const NAVBAR_HEIGHT = 0;

let lastSavedStyle = null;
let savedBox = null;

// End of what's configurable.
let clicked = null;
let onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

let rightScreenEdge, bottomScreenEdge;
let e, b, x, y, preSnapped, minPrevHeight;
let redraw = false;

// ========================================================================= //
// SETUP LOGIC                                                               //
// ========================================================================= //

function addScriptContainer() {
  return new Promise((resolve, reject) => {
    if (document.querySelector("#script-container")) {
      let scriptContainer = document.querySelector("#script-container");
      scriptContainer.parentNode.removeChild(scriptContainer);
    }

    var scriptContainer = document.createElement("div");
    scriptContainer.id = "script-container";
    document.body.appendChild(scriptContainer);
    resolve();
  })
}

function setVideoEventHandlers() {
  return new Promise((resolve, reject) => {
    if (document.querySelector("#vidEventHandlers")) {
      let oldHandlerScript = document.querySelector("#vidEventHandlers");
      oldHandlerScript.parentNode.removeChild(vidHandlerScript);
    }
    var vidHandlerScript = document.createElement('script');
    vidHandlerScript.type = "text/javascript";
    vidHandlerScript.id = "vidEventHandlers";
    vidHandlerScript.src = chrome.extension.getURL("vidEventHandlers.js");
    document.querySelector("#script-container").appendChild(vidHandlerScript);
    vidHandlerScript.onload = resolve;
  })
}

function addIframeAPI() {
  return new Promise((resolve, reject) => {
    if (document.querySelector("#iframe-API")) {
      let iframeAPI = document.querySelector("#iframe-API");
      iframeAPI.parentNode.removeChild(iframeAPI);
    }
    var iframeAPI = document.createElement('script');
    iframeAPI.id = "iframe-API";
    iframeAPI.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(iframeAPI, firstScriptTag);
  })
}

function setupVideoNailPlayer() {
  return new Promise((resolve, reject) => {
    if (document.querySelector("#videonail-container")) {
      let oldContainer = document.querySelector("#videonail-container");
      oldContainer.parentNode.removeChild(oldContainer);
    }

    // Insert videoNailContainer first so that we can find other elements
    elRefs.videoNailContainer = document.createElement("div");
    elRefs.videoNailContainer.id = "videonail-container";
    elRefs.videoNailContainer.classList.add("videonail");
    document.querySelector("#content").appendChild(elRefs.videoNailContainer);

    elRefs.videoNailContainer.insertAdjacentHTML("afterbegin", '<div class="videonail-header" id="videonailHeader"><button id="minimizeButton"><i class="fas fa-window-minimize"></i></button></div>');
    elRefs.minimize = document.querySelector("#minimizeButton");

    elRefs.videoNailHeader = document.querySelector("#videonailHeader");
    elRefs.videoNailHeader.style.display = "flex";
    elRefs.videoNailContainer.appendChild(elRefs.videoNailHeader);

    elRefs.videoNailPlayer = document.createElement('div');
    elRefs.videoNailPlayer.id = "player-container";
    elRefs.videoNailPlayer.style.border = "5px solid rgba(208, 10, 10, 0.5)";
    elRefs.videoNailPlayer.style.borderTop = "none";
    elRefs.videoNailContainer.appendChild(elRefs.videoNailPlayer);
    
    setPlayerPosition();
    resizePIP();
    makePIPDraggable();
    resolve();
  })
}


addScriptContainer()
  .then(_ => {
    return setVideoEventHandlers();
  })
  .then(_ => {
    return setupVideoNailPlayer();
  })
  .then(_ => {
    return addIframeAPI();
  })
  .catch(err => console.log(err));
