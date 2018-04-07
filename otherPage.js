"use strict";

// ========================================================================= //
// INIT                                                                      //
// ========================================================================= //

// TODO: Read the storage to get id
if (document.querySelector("#videonail-container")) {
  removeVideoNailHeader()
    .then(_ => {
      return setupVideoNailPlayer();
    })
    .then(_ => {
      return addBellsAndOrnaments();
    })
    .catch(err => console.log(err));
}
setupVideoNailPlayer()
  .then(_ => {
    return addBellsAndOrnaments();
  })
  .catch(err => console.log(err));