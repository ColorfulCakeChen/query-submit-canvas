


window.addEventListener( "load", window_onLoad );

/** */
function window_onLoad( event ) {
  let DownloadButton = document.querySelector( "#DownloadButton" );
  DownloadButton.addEventListener( "click", DownloadButton_onClick );


}

/** */
function DownloadButton_onClick( event ) {
  alert( "Hi" );

}
