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
    elRefs.minimize.insertAdjacentHTML("afterbegin", '<i class="fas fa-window-minimize"></i>');
    elRefs.minimize.addEventListener('mousedown', onMinimizeClick);
    elRefs.videoNailHeader.appendChild(elRefs.minimize);

    elRefs.close = document.createElement("button");
    elRefs.close.id = "closeButton";
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
    saveDefaultStyle();
    setVNPlayerStyle();
    initOrRestoreSize();
    addListeners();
  } else {
    // When users scroll up
    state.manualClose = false;
    saveVNPlayerStyle();
    setDefaultStyle();
    clearListeners();
  }
  window.dispatchEvent(new Event("resize"));
}

function saveDefaultStyle() {
  defaultStyle = elRefs.videoNailContainer.style.cssText;
}

function setDefaultStyle() {
  if (defaultStyle) {
    // elRefs.videoNailContainer.style.cssText = defaultStyle;
    elRefs.videoNailContainer.removeAttribute('style');
  }
  window.dispatchEvent(new Event("resize"));
}

function saveVNPlayerStyle() {
  lastSavedStyle = elRefs.videoNailContainer.style.cssText;
}

function setVNPlayerStyle() {
  var adContainer = document.querySelector(".ad-container");
  if (adContainer) {
    adContainer.style.top = '0px';
    adContainer.style.left = '0px';
  }
  if (lastSavedStyle) {
    elRefs.videoNailContainer.style = lastSavedStyle;
    return;
  }
  window.dispatchEvent(new Event("resize"));
}

function initOrRestoreSize() {
  if (lastSavedStyle) {
    return;
  }

  let newWidth = INIT_WIDTH;
  if (newWidth < MIN_WIDTH) {
    newWidth = MIN_WIDTH;
  }
  let newHeight = (newWidth - LEFT_AND_RIGHT_BORDER) / 16 * 9 + HEADER_AND_BOTTOM_BORDER;

  elRefs.videoNailContainer.style.width = `${newWidth}px`;
  elRefs.videoNailContainer.style.height = `${newHeight}px`;
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

function onCloseClick() {
  if (window.location.pathname == "/watch") {
    togglePIP();
    return;
  }
  removeVideoNailPlayer();
}

function onMinimizeClick() {
  let min = elRefs.minimize;
  let minSVG = min.children[0];
  afterMinClick = true;
  // if maximized -> minimized
  if (!state.isMinimized) {
    savedBox = elRefs.videoNailContainer.getBoundingClientRect();
    minPrevHeight = elRefs.videoNailPlayer.offsetHeight;
    elRefs.videoNailContainer.style.width = '300px';
    elRefs.videoNailContainer.style.top = window.innerHeight - elRefs.videoNailHeader.offsetHeight + 'px';
    elRefs.videoNailContainer.style.left = document.body.clientWidth - 300 + 'px';
    elRefs.videoNailContainer.style.height = savedBox.height - minPrevHeight + 'px';
    // elRefs.videoNailPlayer.style.display = "none";
    elRefs.videoNailPlayer.classList.toggle('minimize', true)
    state.isMinimized = true;
  } else {
    // elRefs.videoNailPlayer.style.display = "inherit";
    elRefs.videoNailPlayer.classList.toggle('minimize', false);
    elRefs.videoNailContainer.style.width = savedBox.width + 'px';
    elRefs.videoNailContainer.style.height = elRefs.videoNailContainer.offsetHeight + minPrevHeight + 'px';
    elRefs.videoNailContainer.style.top = savedBox.top + 'px';
    elRefs.videoNailContainer.style.left = savedBox.left + 'px';
    state.isMinimized = false;
  }
  minSVG.classList.toggle("fa-window-minimize");
  minSVG.classList.toggle("fa-plus");
}

function onDown(e) {
  calc(e);
  let isResizing = (onRightEdge || onBottomEdge || onTopEdge || onLeftEdge) && !state.isMinimized;

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
      return;
    }
  }

  if (clicked && clicked.isMoving) {
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
    } else if (canMove()) {
      elRefs.videoNailContainer.style.cursor = 'move';
    } else {
      elRefs.videoNailContainer.style.cursor = 'default';
    }
  } else {
    elRefs.videoNailContainer.style.cursor = 'move' ? canMove() : elRefs.videoNailContainer.style.cursor = 'default';
  }
}

function wrapAll(nodes, wrapper) {
  return new Promise((resolve, reject) => {
    var parent = nodes[0].parentNode;
    var previousSibling = nodes[0].previousSibling;

    for (var i = 0; nodes.length - i; wrapper.firstChild === nodes[0] && i++) {
      wrapper.appendChild(nodes[i]);
    }

    parent.insertBefore(wrapper, previousSibling.nextSibling);
    resolve();
  })
}

function unwrapAll(wrapper) {
  return new Promise((resolve, reject) => {
    var parent = wrapper.parentNode;
    var children = wrapper.children;
    var insertBeforeNode = wrapper.nextSibling;

    for (var i = 0; i < children.length; i++) {
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
    setVNPlayerStyle();
    initOrRestoreSize();
    addListeners();
    bubbleIframeMouseMove(elRefs.videoNailPlayer);
    bubbleIframeMouseUp(elRefs.videoNailPlayer);
    function bubbleIframeMouseMove(iframe) {
      iframe.contentWindow.addEventListener('mousemove', function (event) {
        var boundingClientRect = iframe.getBoundingClientRect();
    
        var evt = new CustomEvent('mousemove', {
          bubbles: true,
          cancelable: false
        })
        evt.clientX = event.clientX + boundingClientRect.left;
        evt.clientY = event.clientY + boundingClientRect.top;
    
        iframe.dispatchEvent(evt);
      });
    };
    function bubbleIframeMouseUp(iframe) {
      iframe.contentWindow.addEventListener('mouseup', function (event) {
        var boundingClientRect = iframe.getBoundingClientRect();
    
        var evt = new CustomEvent('mouseup', {
          bubbles: true,
          cancelable: false
        })
        evt.clientX = event.clientX + boundingClientRect.left;
        evt.clientY = event.clientY + boundingClientRect.top;
    
        iframe.dispatchEvent(evt);
      });
    };
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
  var container = document.querySelector("#videonail-container");
  container.parentNode.removeChild(container);
  document.removeEventListener('mousemove', onMove);
  document.removeEventListener('mouseup', onUp);
}

function setupVideoNailPlayer() {
  return new Promise((resolve, reject) => {
    elRefs.videoNailContainer = document.createElement("div");
    elRefs.videoNailContainer.id = "videonail-container";
    elRefs.videoNailContainer.classList.add("videonail", "videonail-container-pip-mode");
    elRefs.videoNailContainer.classList.add("videonail-container");
    document.body.appendChild(elRefs.videoNailContainer);

    elRefs.videoNailPlayer = document.createElement('iframe');
    elRefs.videoNailPlayer.type = "text/html";
    elRefs.videoNailPlayer.frameborder = "0";
    elRefs.videoNailPlayer.src = "https://www.youtube.com/embed/M7lc1UVf-VE?autoplay=1";
    elRefs.videoNailPlayer.classList.add("videonail-player-active");
    elRefs.videoNailContainer.appendChild(elRefs.videoNailPlayer);

    attachVideoNailHeader()
      .then(_ => {
        elRefs.videoNailHeader.classList.toggle("videonail-header-std-mode", false);
        elRefs.videoNailHeader.classList.add("videonail-header");
        window.dispatchEvent(new Event("resize"));
      })
      .catch(err => console.log(err));

    resolve();
  })
}
