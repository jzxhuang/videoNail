"use strict";

// ========================================================================= //
// GLOBAL STATE / REFERENCES                                                 //
// ========================================================================= //

const state = {
  isPolymer: false,
  inPipMode: false,
  manualPip: false,
  manualResize: false
};
const elRefs = {
  originalPlayerSection: null,
  videoNailContainer: null,
  msg: null,
  pipHeader: null,
  ghostpane: null
};

const SCROLL_THRESHOLD = 0.4;
const MIN_WIDTH = 400;
const MIN_HEIGHT = MIN_WIDTH / 16 * 9;
const EDGE_MARGIN = 5;

let videoNailContainer = null;
let lastSavedStyle = null;

// End of what's configurable.
let clicked = null;
let onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

let rightScreenEdge, bottomScreenEdge;
let e, b, x, y, preSnapped;
let redraw = false;

const NAVBAR_HEIGHT = 56;


// ========================================================================= //
// PIP LOGIC                                                                 //
// ========================================================================= //
function injectPIP() {
  if (document.getElementById("videonail-pip-toggle")) {
    return;
  }

  // Get element references
  if (state.isPolymer) {
    elRefs.originalPlayerSection = document.querySelector("#top #player");
    elRefs.videoNailContainer = document.querySelector("#top #player #player-container");
    elRefs.player = document.querySelector("#player-container #movie_player");
  } else {
    elRefs.originalPlayerSection = document.querySelector("#player-api");
    elRefs.videoNailContainer = document.querySelector("#movie_player");
    elRefs.player = document.querySelector("#movie_player");
  }
  elRefs.ytPlayer = document.getElementById("ytd-player");
  console.log(elRefs.ytPlayer);
  elRefs.relatedVideoDiv = document.getElementById('related');

  // Add header for PIP mode
  attachPIPHeader();

  // Add toggle button to corner of player
  attachToggleButton();

  // Add ghostpane
  elRefs.videoNailContainer.insertAdjacentHTML('afterend', '<div id="ghostpane"></div>');
  elRefs.ghostpane = document.querySelector('#ghostpane');

  // Auto-PIP on scroll (if not manually done)
  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (
          (entry.intersectionRatio < SCROLL_THRESHOLD && !state.inPipMode) ||
          (entry.intersectionRatio > SCROLL_THRESHOLD &&
            state.inPipMode &&
            !state.manualPip)
        ) {
          togglePIP();
        }
      });
    }, {
      threshold: SCROLL_THRESHOLD
    }
  );
  observer.observe(elRefs.originalPlayerSection);
}

function attachToggleButton() {
  const elTogglePIP = document.createElement("button");
  elTogglePIP.id = "videonail-pip-toggle";
  elTogglePIP.title = "Toggle PIP";
  elTogglePIP.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 22.11"><rect x="18.73" y="10.53" width="17.27" height="11.58" fill="#777"/><polygon points="30.85 1 3.48 1 1.55 1 1.55 2.93 1.55 17.48 1.55 19.41 3.48 19.41 16.69 19.41 16.69 17.48 3.48 17.48 3.48 2.93 30.85 2.93 30.85 8.69 32.78 8.69 32.78 2.93 32.78 1 30.85 1" fill="#777"/><rect x="17.18" y="9.53" width="17.27" height="11.58" fill="#fff"/><polygon points="29.3 0 1.93 0 0 0 0 1.93 0 16.48 0 18.41 1.93 18.41 15.14 18.41 15.14 16.48 1.93 16.48 1.93 1.93 29.3 1.93 29.3 7.69 31.23 7.69 31.23 1.93 31.23 0 29.3 0" fill="#fff"/></svg>';
  elRefs.player.appendChild(elTogglePIP);

  // Add listener to toggle button
  elTogglePIP.addEventListener("click", () => {
    state.manualPip = true;
    togglePIP();
  });
}

function attachPIPHeader() {
  elRefs.videoNailContainer.insertAdjacentHTML('afterbegin', '<div class="videonail-header" style="display:none" id="videonailHeader"></div>');
  elRefs.pipHeader = document.getElementById("videonailHeader");
}

function togglePIP() {
  state.inPipMode = !state.inPipMode;
  elRefs.originalPlayerSection.classList.toggle("videonail-pip", state.inPipMode);
  let theaterButton = document.querySelector("[title='Theater mode']");

  // When users scroll down
  if (state.inPipMode) {
    setPlayerPosition();
    window.addEventListener("resize", resizePIP);
    makePIPDraggable();
    addPlayerMsg();
    elRefs.pipHeader.style.display = "flex";
    elRefs.ytPlayer.style.border = "5px solid rgba(208, 10, 10, 0.5)";
    elRefs.ytPlayer.style.width = "initial";
  } else {
    // When users scroll up
    state.manualPip = false;
    saveAndResetPlayerStyle();
    window.removeEventListener("resize", resizePIP);
    removePlayerMsg();
    elRefs.pipHeader.style.display = "none";
    elRefs.ytPlayer.style.border = "none";
    elRefs.ytPlayer.style.width = "100%";
  }
  if (theaterButton) {
    theaterButton.click();
  }

  state.manualResize = false;
  window.dispatchEvent(new Event("resize"));
}

// Sets the pane position on transition
function setPlayerPosition() {
  var adContainer = document.querySelector(".ad-container");
  if (adContainer) {
    adContainer.style.top = '0px';
    adContainer.style.left = '0px';
  }
  if (lastSavedStyle) {
    elRefs.videoNailContainer.style = lastSavedStyle;
    return;
  }
  elRefs.videoNailContainer.style.right = "0px";
  elRefs.videoNailContainer.style.bottom = "0px";
}

// Adds message to original video container
function addPlayerMsg() {
  elRefs.msg = document.createElement("div");
  elRefs.msg.classList.add("videonail-original-player-msg");
  elRefs.msg.innerText = "Click to return player";
  elRefs.msg.addEventListener("click", togglePIP);
  elRefs.originalPlayerSection.appendChild(elRefs.msg);
}

function removePlayerMsg() {
  elRefs.msg.removeEventListener("click", togglePIP);
  elRefs.originalPlayerSection.removeChild(elRefs.msg);
  elRefs.msg = null;
}

function resizePIP() {
  requestAnimationFrame(() => {
    let vid = document.querySelector(".html5-main-video");
    vid.style.left = "0px";
    vid.style.top = "0px";
    if (lastSavedStyle) {
      return;
    }

    //    let newWidth = window.innerWidth / 3.75;
    let newWidth = elRefs.relatedVideoDiv.offsetWidth + 24;
    console.log(elRefs.relatedVideoDiv.offsetWidth);
    if (newWidth < MIN_WIDTH) {
      newWidth = MIN_WIDTH;
    }
    let newHeight = (newWidth - 10) / 16 * 9 + 34;

    elRefs.videoNailContainer.style.width = `${newWidth}px`;
    elRefs.videoNailContainer.style.height = `${newHeight}px`;

    if (!state.manualResize) {
      state.manualResize = true;
      window.dispatchEvent(new Event("resize"));
    } else {
      state.manualResize = false;
      makePIPDraggable();
    }
  });
}

function makePIPDraggable() {
  elRefs.videoNailContainer.style.margin = "0px 0px 0px 0px";
  videoNailContainer = elRefs.videoNailContainer;
  // Mouse events
  videoNailContainer.addEventListener('mousedown', onMouseDown);
  videoNailContainer.addEventListener('mouseenter', onMouseHover);
  elRefs.videoNailContainer.addEventListener('mouseleave', onMouseOut);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  animate();
}

function setBounds(element, x, y, w, h) {
  element.style.left = x + 'px';
  element.style.top = y + 'px';
  element.style.width = w + 'px';
  element.style.height = h + 'px';
}

function onMouseDown(e) {
  onDown(e);
  e.preventDefault();
}

function onMove(ee) {
  calc(ee);
  e = ee;
  redraw = true;
}

function onUp(e) {
  calc(e);
  // Snapping
//  if (clicked && clicked.isMoving) {
//    // Snap
//    var snapped = {
//      width: b.width,
//      height: b.height
//    };
//    let bounds = getSnapBounds();
//    if (bounds) {
//      setBounds(elRefs.videoNailContainer, ...bounds);
//      preSnapped = snapped;
//    } else {
//      preSnapped = null;
//    }
//    hintHide();
//  }
  clicked = null;
}

function saveAndResetPlayerStyle() {
  // TODO: save mini player size when scrolling up
  lastSavedStyle = elRefs.videoNailContainer.style.cssText;
  elRefs.videoNailContainer.style = null;
  elRefs.originalPlayerSection.style = null;
  elRefs.videoNailContainer.removeEventListener('mousedown', onMouseDown);
  elRefs.videoNailContainer.removeEventListener('mouseenter', onMouseHover);
  elRefs.videoNailContainer.removeEventListener('mouseleave', onMouseOut);
  document.removeEventListener('mousemove', onMove);
  document.removeEventListener('mouseup', onUp);
  clicked = null;
}

function onMouseHover() {
  elRefs.pipHeader.style.opacity = 0.5;
//  elRefs.ytPlayer.style.borderTop = "none";
}

function onMouseOut() {
  elRefs.pipHeader.style.opacity = 0;
  //  elRefs.videoNailContainer.style.border = "none";
  elRefs.ytPlayer.style.border = "5px solid rgba(208, 10, 10, 0.5)"
}

function onDown(e) {
  calc(e);
  let isResizing = onRightEdge || onBottomEdge || onTopEdge || onLeftEdge;

  clicked = {
    x: x,
    y: y,
    cx: e.clientX,
    cy: e.clientY,
    w: b.width,
    h: b.height,
    isResizing: isResizing,
    isMoving: !isResizing && canMove(),
    onTopEdge: onTopEdge,
    onLeftEdge: onLeftEdge,
    onRightEdge: onRightEdge,
    onBottomEdge: onBottomEdge
  };
}

// Checks if you can move the pane
function canMove() {
  return x > 0 && x < b.width && y > 0 && y < b.height &&
    y < 30;
}

// Hides the ghost pane 
function hintHide() {
  setBounds(elRefs.ghostpane, b.left, b.top, b.width, b.height);
  elRefs.ghostpane.style.opacity = 0;
  elRefs.ghostpane.style.display = 'none';
}

// Calculates size of pane and location of cursor relative to pane after a click. Checks if cursor is on an edge for resizing. Defines right and bottom edges
function calc(e) {
  b = videoNailContainer.getBoundingClientRect();
  x = e.clientX - b.left;
  y = e.clientY - b.top;

  onTopEdge = y < EDGE_MARGIN;
  onLeftEdge = x < EDGE_MARGIN;
  onRightEdge = x >= b.width - EDGE_MARGIN;
  onBottomEdge = y >= b.height - EDGE_MARGIN;

  rightScreenEdge = window.innerWidth - EDGE_MARGIN;
  bottomScreenEdge = window.innerHeight - EDGE_MARGIN;
}

// Calculate snap coords
function getSnapBounds() {
  let bounds = []; // x, y, width, height
  let wiw = window.innerWidth;
  let wih = window.innerHeight;
  let bw = b.width;
  let bh = b.height;

  // BR, BL, TL, TR, R, L, B, T
  if (b.right > rightScreenEdge && b.bottom > bottomScreenEdge) bounds = [wiw - bw - 17, wih - bh, bw, bh];
  else if (b.left < EDGE_MARGIN && b.bottom > bottomScreenEdge) bounds = [0, wih - bh, bw, bh];
  else if (b.left < EDGE_MARGIN && b.top < EDGE_MARGIN + NAVBAR_HEIGHT) bounds = [0, NAVBAR_HEIGHT, bw, bh];
  else if (b.right > rightScreenEdge && b.top < EDGE_MARGIN + NAVBAR_HEIGHT) bounds = [wiw - bw - 17, NAVBAR_HEIGHT, bw, bh];
  else if (b.right > rightScreenEdge) bounds = [wiw - bw - 17, b.top, bw, bh];
  else if (b.left < EDGE_MARGIN) bounds = [0, b.top, bw, bh];
  else if (b.bottom > bottomScreenEdge) bounds = [b.left, wih - bh, bw, bh];
  else if (b.top < EDGE_MARGIN + NAVBAR_HEIGHT) bounds = [b.left, NAVBAR_HEIGHT, bw, bh];
  else {
    return null
  };
  return bounds;
}

function animate() {
  // requestAnimationFrame with this fct as the callback
  requestAnimationFrame(animate);
  // If no change, return
  if (!redraw) return;

  redraw = false;

  // Resizing
  if (clicked && clicked.isResizing) {
    if (clicked.onRightEdge) videoNailContainer.style.width = Math.max(x, MIN_WIDTH) + 'px';
    if (clicked.onBottomEdge) videoNailContainer.style.height = Math.max(y, MIN_HEIGHT) + 'px';
    if (clicked.onLeftEdge) {
      let currentWidth = Math.max(clicked.cx - e.clientX + clicked.w, MIN_WIDTH);
      if (currentWidth > MIN_WIDTH) {
        videoNailContainer.style.width = currentWidth + 'px';
        videoNailContainer.style.left = e.clientX + 'px';
      }
    }
    if (clicked.onTopEdge) {
      let currentHeight = Math.max(clicked.cy - e.clientY + clicked.h, MIN_HEIGHT);
      if (currentHeight > MIN_HEIGHT) {
        videoNailContainer.style.height = currentHeight + 'px';
        videoNailContainer.style.top = e.clientY + 'px';
      }
    }
    return;
  }

  // Moving or Snapping
  if (clicked && clicked.isMoving) {
    // Snapping
//    let bounds = getSnapBounds();
//    if (bounds) {
//      setBounds(elRefs.ghostpane, ...bounds);
//      elRefs.ghostpane.style.opacity = 0.3;
//      elRefs.ghostpane.style.display = 'block';
//    } else {
//      hintHide();
//    }
//    if (preSnapped) {
//      setBounds(elRefs.videoNailContainer,
//        e.clientX - preSnapped.width / 2,
//        e.clientY - Math.min(clicked.y, preSnapped.height),
//        preSnapped.width,
//        preSnapped.height
//      );
//      return;
//    }

    // Moving
    var container = videoNailContainer.getBoundingClientRect();
    videoNailContainer.style.top = Math.max(56, Math.min(window.innerHeight - container.height, (e.clientY - clicked.y))) + 'px';
    videoNailContainer.style.left = Math.max(0, Math.min(window.innerWidth- container.width - 17, (e.clientX - clicked.x))) + 'px';
//    videoNailContainer.style.top = (e.clientY - clicked.y) + 'px';
//    videoNailContainer.style.left = (e.clientX - clicked.x) + 'px';
    return;
  }

  // This code executes when mouse moves without clicking
  // style cursor
  if (onRightEdge && onBottomEdge || onLeftEdge && onTopEdge) {
    videoNailContainer.style.cursor = 'nwse-resize';
  } else if (onRightEdge && onTopEdge || onBottomEdge && onLeftEdge) {
    videoNailContainer.style.cursor = 'nesw-resize';
  } else if (onRightEdge || onLeftEdge) {
    videoNailContainer.style.cursor = 'ew-resize';
  } else if (onBottomEdge || onTopEdge) {
    videoNailContainer.style.cursor = 'ns-resize';
  } else if (canMove()) {
    videoNailContainer.style.cursor = 'move';
  } else {
    videoNailContainer.style.cursor = 'default';
  }
}

// ========================================================================= //
// INIT                                                                      //
// ========================================================================= //

let watchCheckQuery;

function checkIfWatching() {
  if (document.location.pathname === "/watch") {
    if (document.querySelector(watchCheckQuery)) {
      injectPIP();
    }
  }
}

state.isPolymer = document.querySelector("body#body") === null;

if (state.isPolymer) {
  watchCheckQuery = "ytd-watch";
  window.addEventListener("yt-navigate-finish", checkIfWatching);
} else {
  watchCheckQuery = "#player-api";
}

checkIfWatching();
