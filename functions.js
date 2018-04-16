function injectPIP() {
  if (document.getElementById("videonail-container")) {
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

  elRefs.videoNailPlayer.classList.add("videonail-player");
  elRefs.videoNailPlayer.classList.toggle("videonail-player-active", false);

  // Wrap player in container
  elRefs.videoNailContainer = document.createElement('div');
  elRefs.videoNailContainer.classList.add("videonail-container-std-mode", "videonail-container");
  wrapAll([elRefs.videoNailPlayer], elRefs.videoNailContainer)
    .then(_ => {
      return attachVideoNailHeader();
    })
    .then(_ => {
      window.dispatchEvent(new Event("resize"));
    })
  animate();
  setVidId();

  // Auto-PIP on scroll (if not manually done)
  observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (
          (entry.intersectionRatio < SCROLL_THRESHOLD && !state.inPipMode) ||
          (entry.intersectionRatio > SCROLL_THRESHOLD &&
            state.inPipMode &&
            !state.manualClose)
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

function attachVideoNailHeader() {
  return new Promise((resolve, reject) => {
    elRefs.videoNailHeader = document.createElement("div");
    elRefs.videoNailHeader.id = "videonail-header";
    elRefs.videoNailHeader.classList.add("videonail-header-std-mode");
    elRefs.videoNailContainer.insertBefore(elRefs.videoNailHeader, elRefs.videoNailPlayer);

    elRefs.minimize = document.createElement("button");
    elRefs.minimize.id = "minimizeButton";
    elRefs.minimize.classList.add("videonail-button");
    if (state.isMinimized)
      elRefs.minimize.insertAdjacentHTML("afterbegin", '<i class="fas fa-plus"></i>');
    else
      elRefs.minimize.insertAdjacentHTML("afterbegin", '<i class="fas fa-window-minimize"></i>');
    elRefs.minimize.addEventListener('mousedown', onMinimizeClick);
    elRefs.videoNailHeader.appendChild(elRefs.minimize);

    elRefs.close = document.createElement("button");
    elRefs.close.id = "closeButton";
    elRefs.close.classList.add("videonail-button");
    elRefs.close.insertAdjacentHTML("afterbegin", '<i class="fas fa-times"></i>');
    elRefs.close.addEventListener('mousedown', onCloseClick);
    elRefs.videoNailHeader.appendChild(elRefs.close);
    resolve();
  })
}

function checkIfWatching() {
  if (document.location.pathname === "/watch") {
    const interval = setInterval(checkForPlayer, 100);

    function checkForPlayer() {
      if (document.querySelector(watchCheckQuery)) {
        clearInterval(interval);
        injectPIP();
      }
    }
  }
}

function togglePIP() {
  state.inPipMode = !state.inPipMode;
  elRefs.originalPlayerSection.classList.toggle("videonail", state.inPipMode);
  elRefs.videoNailContainer.classList.toggle("videonail-container-std-mode", !state.inPipMode);
  elRefs.videoNailContainer.classList.toggle("videonail-container-pip-mode", state.inPipMode);
  elRefs.videoNailHeader.classList.toggle("videonail-header", state.inPipMode);
  elRefs.videoNailPlayer.classList.toggle("videonail-player-active", state.inPipMode);
  elRefs.videoNailPlayer.classList.toggle("minimize", state.isMinimized && state.inPipMode);

  let theaterButton = document.querySelector("[title='Theater mode']");
  if (theaterButton) theaterButton.click();

  // When users scroll down
  if (state.inPipMode) {
    setVNPlayerStyle();
    addListeners();
  } else {
    // When users scroll up
    state.manualClose = false;
    clearListeners();
  }
  window.dispatchEvent(new Event("resize"));
}

function setVNPlayerStyle() {
  let adContainer = document.querySelector(".ad-container");
  if (adContainer) {
    adContainer.style.top = '0px';
    adContainer.style.left = '0px';
  }

  // Cases: Initial state (bottom, right 0 thru CSS), minimized (set to bottom right), all other cases (use % to deal with zoom issues)
  if (videoData.isInitialStyle) {
    let newWidth = INIT_WIDTH;
    if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
    let newHeight = (newWidth - LEFT_AND_RIGHT_BORDER) / 16 * 9 + HEADER_AND_BOTTOM_BORDER;
    elRefs.videoNailContainer.style.width = `${newWidth}px`;
    elRefs.videoNailContainer.style.height = `${newHeight}px`;
  } else if (state.isMinimized) {
    let min = elRefs.minimize;
    let minSVG = min.children[0];
    setBounds(elRefs.videoNailContainer, document.body.clientWidth - 300, window.innerHeight - elRefs.videoNailHeader.offsetHeight, 300, 24);
    elRefs.videoNailPlayer.classList.toggle('minimize', true);
    minSVG.classList.toggle("fa-window-minimize", false);
    minSVG.classList.toggle("fa-plus", true);
  } else {
    setBounds(elRefs.videoNailContainer, videoData.style.left, videoData.style.top, videoData.style.width, videoData.style.height, videoData.leftPercentage, videoData.topPercentage, videoData.widthPercentage, videoData.heightPercentage);
  }
}

function addListeners() {
  elRefs.videoNailContainer.addEventListener('mousedown', onMouseDown);
  elRefs.minimize.addEventListener('mousedown', onMinimizeClick);
  elRefs.close.addEventListener('mousedown', onCloseClick);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function clearListeners() {
  elRefs.videoNailContainer.removeEventListener('mousedown', onMouseDown);
  elRefs.minimize.removeEventListener('mousedown', onMinimizeClick);
  elRefs.close.removeEventListener('mousedown', onCloseClick);
  document.removeEventListener('mousemove', onMove);
  document.removeEventListener('mouseup', onUp);
  clicked = null;
}

function setBounds(element, l, t, w, h, lPct, tPct, wPct, hPct) {
  let docWidth = document.body.clientWidth;
  let docHeight = window.innerHeight;

  var left = (lPct ? docWidth * lPct : l);
  var top = (tPct ? docHeight * tPct : t);
  var width = Math.max(MIN_WIDTH, (wPct ? docWidth * wPct : w));
  var height = Math.max(MIN_HEIGHT, (hPct ? docHeight * hPct : h));

  element.style.width = width + 'px';
  element.style.height = height + 'px';
  
  if(left + width > docWidth) {
    element.style.right = '0px';
  }
  else {
    element.style.left = left + 'px';
  }
  if(top + height > docHeight) {
    element.style.bottom = '0px';
  }
  else {
    element.style.top = top + 'px';
  }
}

// Save the box as well as the % location
function saveBounds(element) {
  let box = element.getBoundingClientRect();
  videoData.style = box;
  videoData.leftPercentage = box.left / document.body.clientWidth;
  videoData.topPercentage = box.top / window.innerHeight;
  videoData.widthPercentage = box.width / document.body.clientWidth;
  videoData.heightPercentage = box.height / window.innerHeight;
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
   // Save bounds if clicked within the videonail container and not minimized
  if (clicked && !state.isMinimized) {
  videoData.isInitialStyle = false;
  saveBounds(elRefs.videoNailContainer);
  }
  if (!state.currPage.includes("youtube.com/watch"))
    elRefs.videoNailPlayer.style.pointerEvents = 'auto';
  clicked = null;
  window.dispatchEvent(new Event("resize"));
}

function onCloseClick() {
  if (window.location.pathname == "/watch") {
    togglePIP();
    return;
  } else {
    removeVideoNailPlayer();
    chrome.runtime.sendMessage({
      type: "DELETE"
    }); // Delete from storage
    sendWindowMessage("DELETE"); // Send DELETE message to in browser script
    reset();
  }
}

function onMinimizeClick() {
  let min = elRefs.minimize;
  let minSVG = min.children[0];
  afterMinClick = true;
  // if maximized -> minimized
  if (!state.isMinimized) {
    saveBounds(elRefs.videoNailContainer);
    setBounds(elRefs.videoNailContainer, document.body.clientWidth - 300, window.innerHeight - elRefs.videoNailHeader.offsetHeight, 300, 24);
    elRefs.videoNailPlayer.classList.toggle("minimize", true);
    minSVG.classList.toggle("fa-window-minimize", false);
    minSVG.classList.toggle("fa-plus", true);
    state.isMinimized = true;
    videoData.isMinimized = true;
  } else {
    elRefs.videoNailPlayer.classList.toggle('minimize', false);
    setBounds(elRefs.videoNailContainer, videoData.style.left, videoData.style.top, videoData.style.width, videoData.style.height, videoData.leftPercentage, videoData.topPercentage, videoData.widthPercentage, videoData.heightPercentage);
    state.isMinimized = false;
    videoData.isMinimized = false;
    minSVG.classList.toggle("fa-window-minimize", true);
    minSVG.classList.toggle("fa-plus", false);
  }
}

function onDown(e) {
  calc(e);
  let isResizing = ((onLeftEdge && onBottomEdge) || (onRightEdge && onBottomEdge) || (onTopEdge && onLeftEdge) || (onTopEdge && onRightEdge)) && !state.isMinimized;

  clicked = {
    x: x,
    y: y,
    cx: e.clientX,
    cy: e.clientY,
    w: b.width,
    h: b.height,
    box: b,
    isResizing: isResizing && !afterMinClick,
    isMoving: !isResizing && canMove(),
    onTopEdge: onTopEdge,
    onLeftEdge: onLeftEdge,
    onRightEdge: onRightEdge,
    onBottomEdge: onBottomEdge
  };
  afterMinClick = false;
  if (!state.currPage.includes("youtube.com/watch")) {
    elRefs.videoNailPlayer.style.pointerEvents = 'none';
  }
}

// Checks if you can move the pane
function canMove() {
  return x > 0 && x < b.width && y > 0 && y < 24;
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
      }
    }
  }

  if (clicked && clicked.isMoving) {
    // Moving
    let container = elRefs.videoNailContainer.getBoundingClientRect();
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
    } else if (canMove()) {
      elRefs.videoNailContainer.style.cursor = 'move';
    } else elRefs.videoNailContainer.style.cursor = 'default';
  } else elRefs.videoNailContainer.style.cursor = canMove() ? 'move' : 'default';
}

function wrapAll(nodes, wrapper) {
  return new Promise((resolve, reject) => {
    let parent = nodes[0].parentNode;
    let previousSibling = nodes[0].previousSibling;

    for (let i = 0; nodes.length - i; wrapper.firstChild === nodes[0] && i++) {
      wrapper.appendChild(nodes[i]);
    }

    parent.insertBefore(wrapper, previousSibling.nextSibling);
    resolve();
  })
}

function unwrapAll(wrapper) {
  return new Promise((resolve, reject) => {
    let parent = wrapper.parentNode;
    let children = wrapper.children;
    let insertBeforeNode = wrapper.nextSibling;

    for (let i = 0; i < children.length; i++) {
      parent.insertBefore(children[i], insertBeforeNode);
    }

    parent.removeChild(wrapper);
    resolve();
  })
}

function calculateHeight(width) {
  return (width - LEFT_AND_RIGHT_BORDER) * 9 / 16 + HEADER_AND_BOTTOM_BORDER;
}

function calculateWidth(height) {
  return (((height - HEADER_AND_BOTTOM_BORDER) * 16 / 9) + LEFT_AND_RIGHT_BORDER);
}

function addBellsAndOrnaments() {
  return new Promise((resolve, reject) => {
    animate();
    addListeners();
    resolve();
  })
}

function removeVideoNailHeader() {
  return new Promise((resolve, reject) => {
    elRefs.videoNailHeader.parentNode.removeChild(elRefs.videoNailHeader);
    resolve();
  })
}

function removeVideoNailPlayer() {
  let container = document.querySelector("#videonail-container");
  container.parentNode.removeChild(container);
  document.removeEventListener('mousemove', onMove);
  document.removeEventListener('mouseup', onUp);
  window.removeEventListener("message", windowMessageListener, false);
}

function setupVideoNailPlayer(vidData) {
  let startTime = 0;
  return new Promise((resolve, reject) => {
    elRefs.videoNailContainer = document.createElement("div");
    elRefs.videoNailContainer.id = "videonail-container";
    elRefs.videoNailContainer.classList.add("videonail", "videonail-container-pip-mode");
    elRefs.videoNailContainer.classList.add("videonail-container");
    document.body.appendChild(elRefs.videoNailContainer);

    elRefs.videoNailPlayer = document.createElement('iframe');
    elRefs.videoNailPlayer.id = "videonail-iframe";
    elRefs.videoNailPlayer.type = "text/html";
    elRefs.videoNailPlayer.frameborder = "0";
    elRefs.videoNailPlayer.setAttribute('allowFullScreen', '');
    elRefs.videoNailPlayer.classList.add("videonail-player-active");
    elRefs.videoNailContainer.appendChild(elRefs.videoNailPlayer);

    state.isMinimized = vidData.isMinimized;
    let srcString = `https://www.youtube.com/embed/${vidData.metadata.id}?enablejsapi=1&modestbranding=1`;

    // Check if you need to convert from xx:xx:xx to seconds
    if (typeof vidData.metadata.timestamp !== 'number') {
      let timeArray = vidData.metadata.timestamp.split(":");
      for (let i = timeArray.length - 1; i >= 0; --i)
        startTime += parseInt(timeArray[i]) * Math.pow(60, timeArray.length - 1 - i);
    } else startTime = Math.round(vidData.metadata.timestamp);
    srcString += "&start=" + startTime;
    if (vidData.metadata.isPlaying) srcString += "&autoplay=1";
    srcString += "&origin=" + window.location.origin;
    // Check playlist
    if (vidData.metadata.isPlaylist) srcString += `&listType=playlist&list=${vidData.metadata.playlistId}`;

    elRefs.videoNailPlayer.src = srcString;

    attachVideoNailHeader()
      .then(_ => {
        elRefs.videoNailHeader.classList.toggle("videonail-header-std-mode", false);
        elRefs.videoNailHeader.classList.add("videonail-header");
        setVNPlayerStyle();
        window.dispatchEvent(new Event("resize"));
        resolve();
      })
      .catch(err => console.log(err));
  })
}

function fetchVidData() {
  return new Promise((resolve, reject) => {
    // On loading a new page, get vidData from chrome.storage.
    // Only background script has access to tabId, so we need to send message to background to get tabId
    chrome.runtime.sendMessage({
      type: "GET"
    }, tabId => {
      if (!tabId) return;
      chrome.storage.local.get(tabId.toString(), vidData => {
        if (vidData[tabId]) resolve(vidData[tabId]);
        else reject("No video for this tab.");
      });
    });
  });
}

// Sets the video id, parses parameters for playlist information (used on /watch)
function setVidId() {
  if (state.currPage.includes("youtube.com/watch")) {
    videoData.metadata.isPlaylist = false;
    videoData.metadata.playlistId = null;
    let vidUrl = state.currPage;
    vidUrl = vidUrl.split("watch?");
    if (vidUrl)
      vidUrl = vidUrl[1].split("&");
    vidUrl.forEach((element, index) => {
      if (element.startsWith("list=")) {
        videoData.metadata.isPlaylist = true;
        videoData.metadata.playlistId = element.substr(5);
      } else if (element.startsWith("v=")) {
        videoData.metadata.id = element.substr(2);
      }
    });
  }
}

// Inject videonail custom script into the browser environment
// TODO: Check if the script already exists (possible if I close -> manually init from browser action)
function injectBrowserScript() {
  if (document.querySelector("#vn-injected-script")) {
    sendWindowMessage("START-NEW");
    return;
  }
  let script = document.createElement("script");
  script.type = "text/javascript";
  script.id = "vn-injected-script";
  script.src = chrome.runtime.getURL("browser-script.js");
  script.onload = function () {
    sendWindowMessage("INIT");
    injectYTIframeAPIScript();
  };
  document.body.appendChild(script);
}

// Inject YT Iframe API script into the browser environment
function injectYTIframeAPIScript() {
  let YTscript = document.createElement("script");
  YTscript.type = "text/javascript";
  YTscript.src = "https://www.youtube.com/iframe_api";
  document.body.appendChild(YTscript);
}

// Send message to the videonail custom script with the videoData object
function sendWindowMessage(type) {
  if (type === "INIT") window.postMessage({
    type: "VIDEONAIL-CONTENT-SCRIPT-INIT",
    videoData: videoData
  }, "*");
  else if (type === "DELETE") window.postMessage({
    type: "VIDEONAIL-CONTENT-SCRIPT-DELETE"
  }, "*");
  else if (type === "START-NEW") window.postMessage({
    type: "VIDEONAIL-CONTENT-SCRIPT-START-NEW"
  }, "*")
}

function reset() {
  try {
    observer.unobserve(elRefs.originalPlayerSection);
  } catch (e) {

  }
  clearListeners();
  state = {
    firstTime: true,
    isPolymer: false,
    inPipMode: false,
    manualClose: false,
    isMinimized: false,
    currPage: ""
  };
  elRefs = {
    originalPlayerSection: null,
    videoNailContainer: null,
    videoNailPlayer: null,
    videoNailHeader: null,
    player: null, // the html5 video
    msg: null
  };
  videoData.metadata = {
    id: null,
    isPlaying: false,
    isPlaylist: false,
    playlistId: null,
    timestamp: "0:00"
  }
}

// Listen for message from VN browser script and update videoData object
function windowMessageListener(event) {
  if (event.source == window && event.data.type) {
    if (event.data.type === "VIDEONAIL-BROWSER-SCRIPT-YTP-STATUS") {
      videoData.metadata = event.data.vidMetadata;
    }
  }
}