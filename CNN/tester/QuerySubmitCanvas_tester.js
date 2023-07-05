/**
 * @file This is a classic javascript file. It should be loaded in a HTML web
 * page by a HTML script tag.
 */

window.addEventListener( "load", function ( e ) {
  console.log( "QuerySubmitCanvas_tester.js: window_onload..." );

  const canvas = document.querySelector( "canvas" );
  const ctx = canvas.getContext( "2d" );
  ctx.fillStyle = "green";
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

//!!! ...unfinished... (2022/08/25)
} );
