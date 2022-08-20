/**
 * In Construct.net "On start of layout" event, use Browser.ExexJS() to execute this
 * file.
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

      if (inputElement)    // 表單中的欄位數量比需要的還多，移除多出來的欄位。
      {
        while (this.form.lastElementChild != inputElement)   // 從最後一個欄位開始，往前逐一移除，直到有使用到的欄位的下一個欄位為止。
        {
          this.form.removeChild(this.form.lastElementChild);
          inputElementRemovedCount++;
        }

        this.form.removeChild(inputElement);  // 有使用到的欄位的下一個欄位，已經成為最後一個欄位，把它移除後，就沒有多餘的欄位了。
        inputElement = null;
        // For debug.
        //alert("input element removed. (" + inputElementRemovedCount + "+1)");
      }

      this.form.submit();
      // For debug.
      //alert("form submitted.");

      this.requestId++;
    }


  /**
   * @param inputArrayUID
   *   傳入存放有查詢相關參數的 Construct.net Array plugin 的 instance 的 UID。
   *   該陣列的尺寸 (width, height, depth) 必須是 (1, 3, n)，其中 n 是要被傳送的欄位總數量。
   *
   *     inputArray(0,0,0) = formActionURL  (form submit action的完整網址，類似："https://docs.google.com/forms/.../formResponse")
   *
   *     inputArray(0,1,0) = 欄位0的名稱     (例如："entry.1504146089") 
   *     inputArray(0,1,1) = 欄位1的名稱     (例如："entry.1756834287") 
   *       : 
   *     inputArray(0,1,n) = 欄位n的名稱
   *
   *     inputArray(0,2,0) = 欄位0的資料     (例如："ABC") 
   *     inputArray(0,2,1) = 欄位1的資料     (例如：123) 
   *       : 
   *     inputArray(0,2,n) = 欄位n的資料
   */
  BackgroundFormSender.prototype.sendByArray = function (inputArrayUID)
  {
    var inputArray = this.theRuntime.getObjectByUID(inputArrayUID);

    var formActionURL = inputArray.at(0, 0, 0);  // 表單的接收網址。
    var formData = {};
    for (var i = 0; i < inputArray.cz; ++i)      // 陣列的depth(cz)，代表欄位的數量。
    {
      var fieldName = inputArray.at(0, 1, i);   // 欄位名稱。
      var fieldData = inputArray.at(0, 2, i);   // 欄位資料。
      formData[fieldName] = fieldData;
      //alert("send data = " + JSON.stringify(formData));
      this.sendByURL(formActionURL, formData);
    }
  }

  }

  if (!theGlobal.gBackgroundFormSender)
  { // 第一次執行時，產生用來在背景進行form submit的全域物件。
    theGlobal.gBackgroundFormSender = new BackgroundFormSender();
  }


// 因為是透過 Construct.net 的 Browser.ExecJS() 執行這整段程式碼，所以這裡的 this 就是 Browser plugin 自己。
})(window, this.runtime);
