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
  playerSection: null,
  playerContainer: null,
  msg: null,
  pipHeader: null
};

const SCROLL_THRESHOLD = 0.5;
const MIN_WIDTH = 400;
const MIN_HEIGHT = MIN_WIDTH / 16 * 9;
const EDGE_MARGIN = 4;

var miniPlayer = null;
var lastSavedStyle = null;

// End of what's configurable.
var clicked = null;
var onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

var rightScreenEdge, bottomScreenEdge;
var b, x, y;
var redraw = false;
var e;


// ========================================================================= //
// PIP LOGIC                                                                 //
// ========================================================================= //

function injectPIP() {
  if (document.getElementById("yt-pip-toggle")) {
    return;
  }

  // Get element references
  if (state.isPolymer) {
    elRefs.playerSection = document.querySelector("#top #player");
    elRefs.playerContainer = document.querySelector("#top #player #player-container");
    elRefs.player = document.querySelector("#player-container #movie_player");
  } else {
    elRefs.playerSection = document.querySelector("#player-api");
    elRefs.playerContainer = document.querySelector("#movie_player");
    elRefs.player = document.querySelector("#movie_player");
  }

  // Add header for PIP mode
  attachPIPHeader();

  // Add toggle button to corner of player
  attachToggleButton();

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
    },
    {
      threshold: SCROLL_THRESHOLD
    }
  );
  observer.observe(elRefs.playerSection);
}

function attachToggleButton() {
  const elTogglePIP = document.createElement("button");
  elTogglePIP.id = "yt-pip-toggle";
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
  elRefs.pipHeader = document.createElement("div");
  elRefs.pipHeader.classList.add("yt-pip-header");
  elRefs.playerContainer.insertBefore(
    elRefs.pipHeader,
    elRefs.playerContainer.firstChild
  );
}

function togglePIP() {
  state.inPipMode = !state.inPipMode;
  elRefs.playerSection.classList.toggle("yt-pip", state.inPipMode);
  var theaterButton = document.querySelector("[title='Theater mode']");
  if (theaterButton) {
    theaterButton.click();
  }
  // When users scroll down
  if (state.inPipMode) {
    setPlayerPosition();
    window.addEventListener("resize", resizePIP);
    makePIPDraggable();
    addPlayerMsg();
  } else {
    // When users scroll up
    state.manualPip = false;
    saveAndResetPlayerStyle();
    window.removeEventListener("resize", resizePIP);
    removePlayerMsg();
  }

  state.manualResize = false;
  window.dispatchEvent(new Event("resize"));
}

function setPlayerPosition() {
  if (lastSavedStyle) {
    elRefs.playerContainer.style = lastSavedStyle;
    return;
  }
  elRefs.playerContainer.style.right = "16px";
  elRefs.playerContainer.style.bottom = "32px";
}

function addPlayerMsg() {
  elRefs.msg = document.createElement("div");
  elRefs.msg.classList.add("yt-pip-player-msg");
  elRefs.msg.innerText = "Click to return player";
  elRefs.msg.addEventListener("click", togglePIP);
  elRefs.playerSection.appendChild(elRefs.msg);
}

function removePlayerMsg() {
  elRefs.msg.removeEventListener("click", togglePIP);
  elRefs.playerSection.removeChild(elRefs.msg);
  elRefs.msg = null;
}

function resizePIP() {
  requestAnimationFrame(() => {
    if (lastSavedStyle) {
      var vid = document.querySelector(".html5-main-video");
      vid.style.left = "0px";
      vid.style.top = "0px";
      return;
    }

    let newWidth = window.innerWidth / 2.5;
    if (newWidth < MIN_WIDTH) {
      newWidth = MIN_WIDTH;
    }

    let newHeight = newWidth / 16 * 9;

    elRefs.playerContainer.style.width = `${newWidth}px`;
    elRefs.playerContainer.style.height = `${newHeight}px`;

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
  elRefs.playerContainer.style.margin = "0px 0px 0px 0px";
  miniPlayer = elRefs.playerContainer;
  // Mouse events
  miniPlayer.addEventListener('mousedown', onMouseDown);
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
  clicked = null;
}

function saveAndResetPlayerStyle() {
  // TODO: save mini player size when scrolling up
  lastSavedStyle = elRefs.playerContainer.style.cssText;
  elRefs.playerContainer.style = null;
  elRefs.playerSection.style = null;
  elRefs.playerContainer.removeEventListener('mousedown', onMouseDown);
  document.removeEventListener('mousemove', onMove);
  document.removeEventListener('mouseup', onUp);
  clicked = null;
}

function onDown(e) {
  calc(e);

  var isResizing = onRightEdge || onBottomEdge || onTopEdge || onLeftEdge;

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

function canMove() {
  return x > 0 && x < b.width && y > 0 && y < b.height
    && y < 30;
}

function calc(e) {
  b = miniPlayer.getBoundingClientRect();
  x = e.clientX - b.left;
  y = e.clientY - b.top;

  onTopEdge = y < EDGE_MARGIN;
  onLeftEdge = x < EDGE_MARGIN;
  onRightEdge = x >= b.width - EDGE_MARGIN;
  onBottomEdge = y >= b.height - EDGE_MARGIN;

  rightScreenEdge = window.innerWidth - EDGE_MARGIN;
  bottomScreenEdge = window.innerHeight - EDGE_MARGIN;
}

function animate() {

  requestAnimationFrame(animate);

  if (!redraw) return;

  redraw = false;

  if (clicked && clicked.isResizing) {

    if (clicked.onRightEdge) miniPlayer.style.width = Math.max(x, MIN_WIDTH) + 'px';
    if (clicked.onBottomEdge) miniPlayer.style.height = Math.max(y, MIN_HEIGHT) + 'px';

    if (clicked.onLeftEdge) {
      var currentWidth = Math.max(clicked.cx - e.clientX + clicked.w, MIN_WIDTH);
      if (currentWidth > MIN_WIDTH) {
        miniPlayer.style.width = currentWidth + 'px';
        miniPlayer.style.left = e.clientX + 'px';
      }
    }

    if (clicked.onTopEdge) {
      var currentHeight = Math.max(clicked.cy - e.clientY + clicked.h, MIN_HEIGHT);
      if (currentHeight > MIN_HEIGHT) {
        miniPlayer.style.height = currentHeight + 'px';
        miniPlayer.style.top = e.clientY + 'px';
      }
    }



    return;
  }

  if (clicked && clicked.isMoving) {
    // moving
    miniPlayer.style.top = (e.clientY - clicked.y) + 'px';
    miniPlayer.style.left = (e.clientX - clicked.x) + 'px';

    return;
  }

  // This code executes when mouse moves without clicking
  // style cursor
  if (onRightEdge && onBottomEdge || onLeftEdge && onTopEdge) {
    miniPlayer.style.cursor = 'nwse-resize';
  } else if (onRightEdge && onTopEdge || onBottomEdge && onLeftEdge) {
    miniPlayer.style.cursor = 'nesw-resize';
  } else if (onRightEdge || onLeftEdge) {
    miniPlayer.style.cursor = 'ew-resize';
  } else if (onBottomEdge || onTopEdge) {
    miniPlayer.style.cursor = 'ns-resize';
  } else if (canMove()) {
    miniPlayer.style.cursor = 'move';
  } else {
    miniPlayer.style.cursor = 'default';
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
