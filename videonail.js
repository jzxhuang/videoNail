"use strict";

// ========================================================================= //
// GLOBAL STATE / REFERENCES                                                 //
// ========================================================================= //

const state = {
  isPolymer: false,
  inPipMode: false,
  manualPip: false,
  manualResize: false,
  isMinimized: false
};
const elRefs = {
  originalPlayerSection: null,
  videoNailContainer: null,
  videoNailPlayer: null,
  msg: null,
  pipHeader: null
};

const headerBottomBorder = 29;
const sideBorderSizes = 10;
const SCROLL_THRESHOLD = 0.4;
const MIN_WIDTH = 325;
const MIN_HEIGHT = (MIN_WIDTH - sideBorderSizes) / 16 * 9 + headerBottomBorder;
const EDGE_MARGIN = 5;

let videoNailContainer = null;
let lastSavedStyle = null;
let savedBox = null;

// End of what's configurable.
let clicked = null;
let onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

let rightScreenEdge, bottomScreenEdge;
let e, b, x, y, preSnapped, minPrevHeight;
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
    elRefs.videoNailPlayer = document.querySelector("#top #player #player-container");
    elRefs.player = document.querySelector("#player-container #movie_player");
  } else {
    elRefs.originalPlayerSection = document.querySelector("#player-api");
    elRefs.videoNailPlayer = document.querySelector("#movie_player");
    elRefs.player = document.querySelector("#movie_player");
  }

  elRefs.videoNailPlayer = elRefs.videoNailPlayer;
  elRefs.relatedVideoDiv = document.getElementById('related');

  // Wrap player in container
  elRefs.videoNailContainer = document.createElement('div');
  elRefs.videoNailContainer.id = "videonail-container";
  wrapAll([elRefs.videoNailPlayer], elRefs.videoNailContainer);

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
  elRefs.videoNailContainer.insertAdjacentHTML('afterbegin', '<div class="videonail-header" style="display:none" id="videonailHeader"><button id="minimizeButton"><i class="fas fa-window-minimize"></i></button></div>');
  elRefs.minimize = document.getElementById("minimizeButton");
  elRefs.pipHeader = document.getElementById("videonailHeader");
}

function togglePIP() {
  state.inPipMode = !state.inPipMode;
  elRefs.originalPlayerSection.classList.toggle("videonail-pip", state.inPipMode);
  let theaterButton = document.querySelector("[title='Theater mode']");

  // When users scroll down
  if (state.inPipMode) {
    if (state.isMinimized) elRefs.videoNailPlayer.style.display = "none";
    setPlayerPosition();
    window.addEventListener("resize", resizePIP);
    makePIPDraggable();
    addPlayerMsg();
    elRefs.pipHeader.style.display = "flex";
    elRefs.videoNailPlayer.style.border = "5px solid rgba(208, 10, 10, 0.5)";
    elRefs.videoNailPlayer.style.borderTop = "none";
  } else {
    // When users scroll up
    state.manualPip = false;
    saveAndResetPlayerStyle();
    window.removeEventListener("resize", resizePIP);
    removePlayerMsg();
    elRefs.pipHeader.style.display = "none";
    elRefs.videoNailPlayer.style.border = "none";
    elRefs.videoNailPlayer.style.width = "100%";
  }
  if (theaterButton) {
    theaterButton.click();
  }

  state.manualResize = false;
  window.dispatchEvent(new Event("resize"));
}

// Sets the pane position on transition
function setPlayerPosition() {
  elRefs.videoNailContainer.style.position = 'fixed';
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
    let newWidth = elRefs.relatedVideoDiv.offsetWidth + 48;
    if (newWidth < MIN_WIDTH) {
      newWidth = MIN_WIDTH;
    }
    let newHeight = (newWidth - sideBorderSizes) / 16 * 9 + headerBottomBorder;

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
  //  videoNailContainer = elRefs.videoNailContainer;
  // Mouse events
  elRefs.videoNailContainer.addEventListener('mousedown', onMouseDown);
  elRefs.videoNailContainer.addEventListener('mouseenter', onMouseHover);
  elRefs.videoNailContainer.addEventListener('mouseleave', onMouseOut);
  elRefs.minimize.addEventListener('mousedown', minimizeClick);
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
  lastSavedStyle = elRefs.videoNailContainer.style.cssText;
  elRefs.videoNailPlayer.style.display = 'flex';
  elRefs.videoNailContainer.style = null;
  elRefs.originalPlayerSection.style = null;
  elRefs.videoNailContainer.removeEventListener('mousedown', onMouseDown);
  elRefs.videoNailContainer.removeEventListener('mouseenter', onMouseHover);
  elRefs.videoNailContainer.removeEventListener('mouseleave', onMouseOut);
  elRefs.minimize.removeEventListener('mousedown', minimizeClick);
  document.removeEventListener('mousemove', onMove);
  document.removeEventListener('mouseup', onUp);
  clicked = null;
}

function minimizeClick() {
  let substring = "fa-window-minimize";
  let min = elRefs.minimize;
  let minSVG = min.children[0];

  // if maximized -> minimized
  if (minSVG.className.baseVal.includes(substring)) {
    savedBox = elRefs.videoNailContainer.getBoundingClientRect();
    minPrevHeight = elRefs.videoNailPlayer.offsetHeight;
    elRefs.videoNailContainer.style.width = '300px';
    elRefs.videoNailContainer.style.top = window.innerHeight - elRefs.pipHeader.offsetHeight + 'px';
    elRefs.videoNailContainer.style.left = document.body.clientWidth - 300 + 'px';
    elRefs.videoNailContainer.style.height = savedBox.height - minPrevHeight + 'px';
    elRefs.videoNailPlayer.style.display = "none";
    state.isMinimized = true;
  } else {
    elRefs.videoNailContainer.style.height = elRefs.videoNailContainer.offsetHeight + minPrevHeight + 'px';
    elRefs.videoNailContainer.style.width = savedBox.width + 'px';
    elRefs.videoNailContainer.style.top = savedBox.top + 'px';
    elRefs.videoNailContainer.style.left = savedBox.left + 'px';
    elRefs.videoNailPlayer.style.display = "inherit";
    state.isMinimized = false;
  }
  minSVG.classList.toggle("fa-window-minimize");
  minSVG.classList.toggle("fa-plus");
}

function onMouseHover() {
  //  elRefs.pipHeader.style.opacity = 0.5;
  //  elRefs.videoNailContainer.style.borderColor = 'rgba(208, 10, 10, 0.75)';
}

function onMouseOut() {
  //  if (!state.isMinimized) elRefs.pipHeader.style.opacity = 0;
  //  elRefs.videoNailPlayer.style.border = "5px solid rgba(208, 10, 10, 0.5)"
  //  elRefs.videoNailContainer.style.borderColor = 'rgba(208, 10, 10, 0.5)';
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
    box: b,
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

// Calculates size of pane and location of cursor relative to pane after a click. Checks if cursor is on an edge for resizing. Defines right and bottom edges
function calc(e) {
  b = elRefs.videoNailContainer.getBoundingClientRect();
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
//function getSnapBounds() {
//  let bounds = []; // x, y, width, height
//  let wiw = window.innerWidth;
//  let wih = window.innerHeight;
//  let bw = b.width;
//  let bh = b.height;
//
//  // BR, BL, TL, TR, R, L, B, T
//  if (b.right > rightScreenEdge && b.bottom > bottomScreenEdge) bounds = [wiw - bw - 17, wih - bh, bw, bh];
//  else if (b.left < EDGE_MARGIN && b.bottom > bottomScreenEdge) bounds = [0, wih - bh, bw, bh];
//  else if (b.left < EDGE_MARGIN && b.top < EDGE_MARGIN + NAVBAR_HEIGHT) bounds = [0, NAVBAR_HEIGHT, bw, bh];
//  else if (b.right > rightScreenEdge && b.top < EDGE_MARGIN + NAVBAR_HEIGHT) bounds = [wiw - bw - 17, NAVBAR_HEIGHT, bw, bh];
//  else if (b.right > rightScreenEdge) bounds = [wiw - bw - 17, b.top, bw, bh];
//  else if (b.left < EDGE_MARGIN) bounds = [0, b.top, bw, bh];
//  else if (b.bottom > bottomScreenEdge) bounds = [b.left, wih - bh, bw, bh];
//  else if (b.top < EDGE_MARGIN + NAVBAR_HEIGHT) bounds = [b.left, NAVBAR_HEIGHT, bw, bh];
//  else {
//    return null
//  };
//  return bounds;
//}

function animate() {
  // requestAnimationFrame with this fct as the callback
  requestAnimationFrame(animate);
  // If no change, return
  if (!redraw) return;

  redraw = false;

  // Resizing
  //  DO NOT READ THIS CODE 
  if (!state.isMinimized) {
    if (clicked && clicked.isResizing) {
      let newWidth, newHeight, newLeft, newTop;
      if (clicked.onTopEdge && clicked.onLeftEdge) {
        newWidth = Math.max(clicked.cx - e.clientX + clicked.w, MIN_WIDTH);
        newHeight = calculateHeight(newWidth);
        newTop = b.top - (newHeight - b.height);
        if (newWidth > MIN_WIDTH) {
          if (newTop < NAVBAR_HEIGHT) {
            newHeight = clicked.h + clicked.box.top - NAVBAR_HEIGHT;
            elRefs.videoNailContainer.style.top = NAVBAR_HEIGHT + 'px';
            elRefs.videoNailContainer.style.height = newHeight + 'px';
            elRefs.videoNailContainer.style.width = calculateWidth(newHeight) + 'px';
            elRefs.videoNailContainer.style.left = clicked.box.left - (calculateWidth(newHeight) - clicked.w) + 'px';
          } else if (e.clientX < 0) {
            newWidth = clicked.w + clicked.box.left;
            elRefs.videoNailContainer.style.left = '0px';
            elRefs.videoNailContainer.style.width = newWidth + 'px';
            elrefs.videoNailContainer.style.height = calculateHeight(newWidth) + 'px';
            elrefs.videoNailContainer.style.top = clicked.top - (calculateHeight(newWidth) - clicked.box.h) + 'px';
          } else {
            elRefs.videoNailContainer.style.left = e.clientX < document.body.clientWidth ? e.clientX - 3 + 'px' : document.body.clientWidth - newWidth - 5 + 'px';
            elRefs.videoNailContainer.style.top = b.top - (newHeight - b.height) + 'px';
            elRefs.videoNailContainer.style.width = newWidth + 'px';
            elRefs.videoNailContainer.style.height = newHeight + 'px';
          }
        }
        if (newWidth > MIN_WIDTH && newTop > NAVBAR_HEIGHT && e.clientX > 0) {
          elRefs.videoNailContainer.style.left = e.clientX < document.body.clientWidth ? e.clientX - 3 + 'px' : document.body.clientWidth - newWidth - 5 + 'px';
          elRefs.videoNailContainer.style.top = b.top - (newHeight - b.height) + 'px';
          elRefs.videoNailContainer.style.width = newWidth + 'px';
          elRefs.videoNailContainer.style.height = newHeight + 'px';
        }
      } else if (clicked.onTopEdge && clicked.onRightEdge) {
        newWidth = Math.max(x, MIN_WIDTH);
        newHeight = calculateHeight(newWidth);
        newTop = b.top - (newHeight - b.height);
        if (newWidth > MIN_WIDTH) {
          if (newTop < NAVBAR_HEIGHT) {
            console.log(1);
            elRefs.videoNailContainer.style.top = NAVBAR_HEIGHT + 'px';
            newHeight = clicked.h + clicked.box.top - NAVBAR_HEIGHT;
            elRefs.videoNailContainer.style.height = newHeight + 'px';
            elRefs.videoNailContainer.style.width = calculateWidth(newHeight) + 'px';
          } else if (e.clientX > document.body.clientWidth) {
            newWidth = document.body.clientWidth - clicked.box.left;
            elRefs.videoNailContainer.style.width = newWidth + 'px';
            elRefs.videoNailContainer.style.height = calculateHeight(newWidth) + 'px';
            elRefs.videoNailContainer.style.top = clicked.box.top - (calculateHeight(newWidth) - clicked.h) + 'px';
          } else {
            elRefs.videoNailContainer.style.top = newTop + 'px';
            elRefs.videoNailContainer.style.width = newWidth + 'px';
            elRefs.videoNailContainer.style.height = newHeight + 'px';
          }
        }
      } else if (clicked.onBottomEdge && clicked.onRightEdge) {
        newWidth = Math.max(x, MIN_WIDTH);
        newHeight = calculateHeight(newWidth);
        if (newWidth > MIN_WIDTH) {
          if (b.top + newHeight > window.innerHeight) {
            newHeight = clicked.h + window.innerHeight - clicked.box.bottom;
            elRefs.videoNailContainer.style.height = newHeight + 'px';
            elRefs.videoNailContainer.style.width = calculateWidth(newHeight) + 'px';
          } else if (e.clientX > document.body.clientWidth) {
            newWidth = document.body.clientWidth - clicked.box.left;
            elRefs.videoNailContainer.style.width = newWidth + 'px';
            elRefs.videoNailContainer.style.height = calculateHeight(newWidth) + 'px';
          } else {
            elRefs.videoNailContainer.style.width = newWidth + 'px';
            elRefs.videoNailContainer.style.height = newHeight + 'px';
          }
        }
      } else if (clicked.onBottomEdge && clicked.onLeftEdge) {
        console.log(1);
        newWidth = Math.max(clicked.cx - e.clientX + clicked.w, MIN_WIDTH);
        newHeight = calculateHeight(newWidth);
        if (newWidth > MIN_WIDTH) {
          if (b.top + newHeight > window.innerHeight) {
            newHeight = clicked.h + window.innerHeight - clicked.box.bottom;
            elRefs.videoNailContainer.style.height = newHeight + 'px';
            elRefs.videoNailContainer.style.width = calculateWidth(newHeight) + 'px';
          } else if (e.clientX < 0) {
            newWidth = clicked.w + clicked.box.left;
            elRefs.videoNailContainer.style.left = '0px';
            elRefs.videoNailContainer.style.width = newWidth + 'px';
            elRefs.videoNailContainer.style.height = calculateHeight(newWidth) + 'px';
          } else {
            elRefs.videoNailContainer.style.left = e.clientX + 'px';
            elRefs.videoNailContainer.style.width = newWidth + 'px';
            elRefs.videoNailContainer.style.height = newHeight + 'px';
          }
        }
      } else if (clicked.onRightEdge) {
        newWidth = Math.max(x, MIN_WIDTH);
        if (e.clientX < document.body.clientWidth) {
          elRefs.videoNailContainer.style.width = newWidth + 'px';
          elRefs.videoNailContainer.style.height = calculateHeight(newWidth) + 'px';
        } else {
          newWidth = (document.body.clientWidth - clicked.box.left);
          elRefs.videoNailContainer.style.width = newWidth + 'px';
          elrefs.videoNailContainer.style.height = calculateHeight(newWidth) + 'px';
        }
      } else if (clicked.onLeftEdge) {
        newWidth = Math.max(clicked.cx - e.clientX + clicked.w, MIN_WIDTH);
        if (newWidth > MIN_WIDTH) {
          if (e.clientX > 0) {
            elRefs.videoNailContainer.style.width = newWidth + 'px';
            elRefs.videoNailContainer.style.left = e.clientX + 'px';
            elRefs.videoNailContainer.style.height = calculateHeight(newWidth) + 'px';
          } else {
            newWidth = clicked.w + clicked.box.left;
            elRefs.videoNailContainer.style.width = newWidth + 'px';
            elRefs.videoNailContainer.style.height = calculateHeight(newWidth) + 'px';
            elRefs.videoNailContainer.style.left = '0px';
          }
        }
      } else if (clicked.onBottomEdge) {
        newHeight = Math.max(y, MIN_HEIGHT);
        if (e.clientY < window.innerHeight) {
          elRefs.videoNailContainer.style.height = newHeight + 'px';
          elRefs.videoNailContainer.style.width = calculateWidth(newHeight) + 'px';
        } else {
          newHeight = window.innerHeight - clicked.box.top;
          elRefs.videoNailContainer.style.height = newHeight + 'px';
          elRefs.videoNailContainer.style.width = calculateWidth(newHeight) + 'px';
        }
      } else if (clicked.onTopEdge) {
        newHeight = Math.max(clicked.cy - e.clientY + clicked.h, MIN_HEIGHT);
        if (newHeight > MIN_HEIGHT) {
          if (e.clientY > NAVBAR_HEIGHT) {
            elRefs.videoNailContainer.style.height = newHeight + 'px';
            elRefs.videoNailContainer.style.top = e.clientY + 'px';
            elRefs.videoNailContainer.style.width = calculateWidth(newHeight) + 'px';
          } else {
            elRefs.videoNailContainer.style.top = NAVBAR_HEIGHT + 'px';
            newHeight = clicked.h + clicked.box.top - NAVBAR_HEIGHT;
            elRefs.videoNailContainer.style.height = newHeight + 'px';
            elRefs.videoNailContainer.style.width = calculateWidth(newHeight) + 'px';
          }
        }
      }
      return;
    }
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
    var container = elRefs.videoNailContainer.getBoundingClientRect();
    if (!state.isMinimized) elRefs.videoNailContainer.style.top = Math.max(NAVBAR_HEIGHT, Math.min(window.innerHeight - container.height, (e.clientY - clicked.y))) + 'px';
    elRefs.videoNailContainer.style.left = Math.max(0, Math.min(document.body.clientWidth - container.width, (e.clientX - clicked.x))) + 'px';
    return;
  }

  // This code executes when mouse moves without clicking
  // style cursor
  if (!state.isMinimized) {
    if (onRightEdge && onBottomEdge || onLeftEdge && onTopEdge) {
      elRefs.videoNailContainer.style.cursor = 'nwse-resize';
    } else if (onRightEdge && onTopEdge || onBottomEdge && onLeftEdge) {
      elRefs.videoNailContainer.style.cursor = 'nesw-resize';
    } else if (onRightEdge || onLeftEdge) {
      elRefs.videoNailContainer.style.cursor = 'ew-resize';
    } else if (onBottomEdge || onTopEdge) {
      elRefs.videoNailContainer.style.cursor = 'ns-resize';
    } else if (canMove()) {
      elRefs.videoNailContainer.style.cursor = 'move';
    } else {
      elRefs.videoNailContainer.style.cursor = 'default';
    }
  } else {
    elRefs.videoNailContainer.style.cursor = 'move' ? canMove() : elRefs.videoNailContainer.style.cursor = 'default';
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


// Wrap wrapper around nodes - Just pass a collection of nodes, and a wrapper element
function wrapAll(nodes, wrapper) {
  // Cache the current parent and previous sibling of the first node.
  var parent = nodes[0].parentNode;
  var previousSibling = nodes[0].previousSibling;

  // Place each node in wrapper.
  //  - If nodes is an array, we must increment the index we grab from 
  //    after each loop.
  //  - If nodes is a NodeList, each node is automatically removed from 
  //    the NodeList when it is removed from its parent with appendChild.
  for (var i = 0; nodes.length - i; wrapper.firstChild === nodes[0] && i++) {
    wrapper.appendChild(nodes[i]);
  }
  // Place the wrapper just after the cached previousSibling
  parent.insertBefore(wrapper, previousSibling.nextSibling);
  return wrapper;
}

// Calculates height maintaining aspect ratio
function calculateHeight(width) {
  return (width - sideBorderSizes) * 9 / 16 + headerBottomBorder;
}
// Calculate width maintaining aspect ratio
function calculateWidth(height) {
  return (((height - headerBottomBorder) * 16 / 9) + sideBorderSizes);
}
