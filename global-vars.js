// ========================================================================= //
// GLOBAL STATE / REFERENCES                                                 //
// ========================================================================= //
let VN_enabled;

let videoNailOptions = {

};

let state = {
  firstTime: true,
  isPolymer: false,
  inPipMode: false,
  manualClose: false,
  isMinimized: false,
  currPage: "",
  isActiveTab: false
};

let elRefs = {
  originalPlayerSection: null,
  videoNailContainer: null,
  videoNailPlayer: null,
  videoNailHeader: null,
  player: null, // the html5 video
  msg: null
};

let videoData = {
  metadata: {
    id: null,
    isPlaying: false,
    isPlaylist: false,
    playlistId: null,
    timestamp: "0:00"
  },
  style: {
    right: 0,
    bottom: 0,
    width: null,
    height: null
  },
  isMinimized: false,
  isInitialStyle: true,
  leftPercentage: null,
  topPercentage: null,
  widthPercentage: null,
  heightPercentage: null
}

let observer;
let SCROLL_THRESHOLD = 0.25;

const INIT_WIDTH = 474;
const HEADER_AND_BOTTOM_BORDER = 29;
const LEFT_AND_RIGHT_BORDER = 10;
const MIN_WIDTH = 325;
const MIN_HEIGHT = (MIN_WIDTH - LEFT_AND_RIGHT_BORDER) / 16 * 9 + HEADER_AND_BOTTOM_BORDER;
const EDGE_MARGIN = 5;
const NAVBAR_HEIGHT = 0;
const HEADER_HEIGHT = 24;

// End of what's configurable.
let clicked = null;
let onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

let rightScreenEdge, bottomScreenEdge;
let e, b, x, y, preSnapped, minPrevHeight;
let redraw = false;

let watchCheckQuery;
let initialView, theaterButton, theaterQuery;
let afterMinClick = false;