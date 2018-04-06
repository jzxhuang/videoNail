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
let afterMinClick = false;
let onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

let rightScreenEdge, bottomScreenEdge;
let e, b, x, y, preSnapped, minPrevHeight;
let redraw = false;

// ========================================================================= //
// INIT                                                                      //
// ========================================================================= //

setupVideoNailPlayer()
  .then(_ => {
    return addBellsAndOrnaments();
  })
  .catch(err => console.log(err));
