try {
  observer.unobserve(elRefs.originalPlayerSection);
} catch(e) {

}

cleanUpListeners();

state = {
  firstTime: true,
  isPolymer: false,
  inPipMode: false,
  manualPip: false,
  manualResize: false,
  isMinimized: false
};

elRefs = {
  originalPlayerSection: null,
  videoNailContainer: null,
  videoNailPlayer: null,
  videoNailHeader: null,
  player: null, // the html5 video
};

