// ========================================================================= //
// GLOBAL STATE / REFERENCES                                                 //
// ========================================================================= //
var state = {
  firstTime: true,
  isPolymer: false,
  inPipMode: false,
  manualClose: false,
  isMinimized: false,
  currPage: "",
};

var elRefs = {
  originalPlayerSection: null,
  videoNailContainer: null,
  videoNailPlayer: null,
  videoNailHeader: null,
  player: null, // the html5 video
  msg: null
};

var observer;

const INIT_WIDTH = 474;
const HEADER_AND_BOTTOM_BORDER = 29;
const LEFT_AND_RIGHT_BORDER = 10;
const SCROLL_THRESHOLD = 0.4;
const MIN_WIDTH = 325;
const MIN_HEIGHT = (MIN_WIDTH - LEFT_AND_RIGHT_BORDER) / 16 * 9 + HEADER_AND_BOTTOM_BORDER;
const EDGE_MARGIN = 5;
const NAVBAR_HEIGHT = 0;

let lastSavedStyle = null;
let defaultStyle = null;
let savedBox = null;

// End of what's configurable.
let clicked = null;
let onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

let rightScreenEdge, bottomScreenEdge;
let e, b, x, y, preSnapped, minPrevHeight;
let redraw = false;

let watchCheckQuery;