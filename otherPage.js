"use strict";

// ========================================================================= //
// INIT                                                                      //
// ========================================================================= //

// TODO: Read the storage to get id
setupVideoNailPlayer()
  .then(_ => {
    return addBellsAndOrnaments();
  })
  .catch(err => console.log(err));