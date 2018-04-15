try {
  observer.unobserve(elRefs.originalPlayerSection);
} catch(e) {

}

clearListeners();

state = {
  firstTime: true,
  isPolymer: false,
  inPipMode: false,
  manualClose: false,
  isMinimized: false
};

elRefs = {
  originalPlayerSection: null,
  videoNailContainer: null,
  videoNailPlayer: null,
  videoNailHeader: null,
  player: null, // the html5 video
};

