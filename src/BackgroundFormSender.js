/**
 * Please in Construct.net "On start of layout" event, use Construct.net Browser
 * plugin's Browser.ExexJS() to execute this file.
 *
 * After execution, a global object gBackgroundFormSender will be created. Call its
 * method .sendByArray() with arguments Array UID (note: here, the Array is a kind of
 * Construct.net plugin) to sned data. For example,
 *
 *   Browser.ExecJS( "gBackgroundFormSender.sendByArray(" & inputArray.UID & ");" )
 *
 * According to experiments, if the interval of two sending (to the same destination
 * url) is too short, sent data might be lost. It is suggested interval 300ms at least.
 *
 */

/**
 *
 * @param theGlobal
 *   The global variables container (i.e. globalThis. in Browser, it is usually the
 * window object)。 It will be used to record the gBackgroundFormSender object.
 *
 * @param theRuntime
 *   Pass in the Construct.net Runtime object. It is used to look up game object by
 * UID.
 */
( function ( theGlobal, theRuntime ) {

  /**
   * 
   */
  class BackgroundFormSender {

    /**
     * Let all instances of BackgroundFormSender could access Construct.net runtime engine.
     */
    static theRuntime = theRuntime;

    /** */
    constructor() {
      // Create an invisible iframe for placing some helper HTML elements.
      this.theIFrame = document.createElement("iframe");
      this.theIFrame.style.display = "none";                 // never display the iframe.
      document.body.appendChild(this.theIFrame);

      // The internal document for all the helper HTML elements.
      this.theDocument = this.theIFrame.contentDocument;

      // The target iframe for receving form submit response.
      this.resultIFrame = this.theDocument.createElement("iframe");
      this.resultIFrame.id = "BackgroundFormSender_"
        + "ResultIFrame_"
        + Date.now(); // Ensure the (form submit response target iframe) name is unique.
      this.resultIFrame.name = this.resultIFrame.id;
      this.theDocument.body.appendChild(this.resultIFrame);

      // The form for sending data.
      //
      // This invisible form will be re-used for every time data sending (instead of
      // re-creating a new form every time).
      this.form = this.theDocument.createElement("form");

      // To be sent, the form needs to be attached to the main document.
      this.theDocument.body.appendChild(this.form);

      this.requestId = 0; // Record how many times sending. (For debug.)
    }

    /**
     * Send data by the invisible form.
     *
     * Advantage:
     *   - Sending data by form could cross domain. (i.e. The same origin policy
     *       restriction of ajax could be avoided.)
     *
     * @param {string} URL  The server url for receiving data.
     * @param {Object} data The data to be sent. (i.e. a key/value pairs object)
     */
    sendByURL( URL, data ) {

      // // Define what happens when the response loads
      // resultIFrame.addEventListener( "load", function () {
      //   alert( "Yeah! Data sent." );
      // });

      this.form.action = URL;

      // Let the response web page be placed in the invisible iframe.
      this.form.target = this.resultIFrame.name;

      let inputElementCreatedCount = 0;
      let inputElementRemovedCount = 0;

      // (Assume all fields of the form are text input element.)
      let inputElement = this.form.firstElementChild;
      //let dataItemIndex = 0;
      for ( let dataItemName in data ) {

        if ( !inputElement ) {
          // Since the fields of the form are not enough, generate new field.
          inputElement = this.theDocument.createElement( "input" );
          this.form.appendChild(inputElement);
          inputElementCreatedCount++;
        }

        inputElement.name  = dataItemName;
        inputElement.value = data[ dataItemName ].toString();

        inputElement = inputElement.nextElementSibling;
        //dataItemIndex++;
      }

      // For debug.
      //if ( inputElementCreatedCount > 0 )
      //  alert( "inputElement created. (" + inputElementCreatedCount + ")" );

      // If the form has more fields than necessary, remove th extra fields.
      if ( inputElement ) {

        // From the last field, remove every field until the next field of used field.
        while ( this.form.lastElementChild != inputElement ) {
          this.form.removeChild(this.form.lastElementChild);
          inputElementRemovedCount++;
        }

        // Since the next field of used field has been the last field, there is no
        // more extra fields after remove it.
        this.form.removeChild( inputElement) ;
        inputElement = null;
        // For debug.
        //alert( "input element removed. (" + inputElementRemovedCount + "+1)" );
      }

      this.form.submit();
      // For debug.
      //alert( "form submitted." );

      this.requestId++;
    }

    /**
     * @param inputArrayUID
     *   The Construct.net Array plugin's instance UID (for sending arguments).
     * The array shape ( width, height, depth ) must be (1, 3, n). The n is the quantity
     * of fields to be sent.
     *
     *     inputArray(0,0,0) = formActionURL  (form submit action url, e.g. "https://docs.google.com/forms/.../formResponse")
     *
     *     inputArray(0,1,0) = name of field0 (e.g. "entry.1504146089") 
     *     inputArray(0,1,1) = name of field1 (e.g. "entry.1756834287") 
     *       : 
     *     inputArray(0,1,n) = name of fieldn
     *
     *     inputArray(0,2,0) = data of field0 (e.g. "ABC") 
     *     inputArray(0,2,1) = data of field1 (e.g. 123) 
     *       : 
     *     inputArray(0,2,n) = data of fieldn
     */
    sendByArray( inputArrayUID ) {
      let inputArray = this.theRuntime.getObjectByUID( inputArrayUID );

      let formActionURL = inputArray.at(0, 0, 0);  // form submit url.
      let formData = {};

      // (Note: array depth(cz) represents field count.)
      for ( let i = 0; i < inputArray.cz; ++i ) {
        let fieldName = inputArray.at(0, 1, i);   // field name.
        let fieldData = inputArray.at(0, 2, i);   // field data.
        formData[fieldName] = fieldData;
        //alert( "send data = " + JSON.stringify( formData ) );
        this.sendByURL( formActionURL, formData );
      }
    }

  }

  if ( !theGlobal.gBackgroundFormSender ) {
    // First time execution, create the global object for form submitting in
    // the background.
    theGlobal.gBackgroundFormSender = new BackgroundFormSender();
  }


// Because thuis file is executed by Construct.net Browser.ExecJS(), the "this" here
// will be the Construct.net Browser plugin itself.
} )( window, this.runtime );
