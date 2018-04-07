"use strict";

// ========================================================================= //
// INIT                                                                      //
// ========================================================================= //

if (document.querySelector("#videonail-container")) {
  removeVideoNailPlayer();
}

// If we're on /watch page, remove the entire container
if (window.location.pathname == "/watch") {
  if (document.querySelector(".videonail .videonail-container")) {
    let oldVNPlayer = document.querySelector(".videonail .videonail-container");
    oldVNPlayer.parentNode.removeChild(oldVNPlayer);
  }
}

state.isPolymer = document.querySelector("body#body") === null;

if (state.isPolymer) {
  watchCheckQuery = "ytd-watch";
} else {
  watchCheckQuery = "#player-api";
}

checkIfWatching();
