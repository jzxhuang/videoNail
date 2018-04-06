"use strict";

// ========================================================================= //
// INIT                                                                      //
// ========================================================================= //

if (document.querySelector("#videonail-container")) {
  removeVideoNailPlayer();
}

state.isPolymer = document.querySelector("body#body") === null;

if (state.isPolymer) {
  watchCheckQuery = "ytd-watch";
  // window.addEventListener("yt-navigate-finish", checkIfWatching);
} else {
  watchCheckQuery = "#player-api";
}

checkIfWatching();
