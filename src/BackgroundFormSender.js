/**
 * 請在 Construct.net 的 On start of layout 中，使用 Browser.ExexJS() 執行這個檔案的內容。
 * 執行後產生一個名叫 gBackgroundFormSender 的全域物件，呼叫 gBackgroundFormSender.sendByArray()，
 * 並傳入記載有相關參數的 (Consteuct.net) Array plugin instance UID，即可傳送資料。類似這樣：
 *
 *   Browser.ExexJS("gBackgroundFormSender.sendByArray(" & inputArray.UID & ");")
 *
 * 根據測試，如果兩次發送資料(到同一個目的地URL)的時間間隔太短，結果可能會有資料丟失。建議至少間隔300ms以上。
 *
 * @param theGlobal
 *   傳入記載全域變數的地方(在Browser中，通常就是window)。用來存放這個BackgroundFormSender物件。
 *
 * @param theRuntime
 *   傳入Consrruct.net的Runtime引擎物件。用來根據UID取得物件。
 */
(function (theGlobal, theRuntime) {

  function BackgroundFormSender()
  {
    this.theIFrame = document.createElement("iframe");      // 產生一個看不見的iframe，存放這個物件產生的所有HTML物件。
    this.theIFrame.style.display = "none";                  // 永不顯示這個用來運作的iframe。
    document.body.appendChild(this.theIFrame);

    this.theDocument = this.theIFrame.contentDocument;     // 接下來產生的HTML物件，都要放在這個內部文件裡。

                                                           // 產生用來接收form submit response的目的地iframe。
    this.resultIFrame = this.theDocument.createElement("iframe");
    this.resultIFrame.id = "BackgroundFormSender_"
                             + "ResultIFrame_"
                             + Date.now();                 // 盡可能確保名稱是唯一的。(作為form submit response target。)
    this.resultIFrame.name = this.resultIFrame.id;
    this.theDocument.body.appendChild(this.resultIFrame);
                                                           // 產生用來傳送資料的form。
    this.form = this.theDocument.createElement("form");    // 每次傳送資料，都會重複使用這個(看不見的)form。(減少記憶體的重複配置與釋放。)
    this.theDocument.body.appendChild(this.form);          // To be sent, the form needs to be attached to the main document.

    this.requestId = 0; // 累計已經呼叫過多少次。(For debug.)
  }

  /**
   * 讓這個類別所有的實體都可以存取 Construct.net 的 runtime engine。
   */
  BackgroundFormSender.prototype.theRuntime = theRuntime;

  /**
   * 透過隱藏的form傳送資料。
   *
   * 透過form傳送，好處是可以cross domain進行傳送，避開ajax會遭遇的same origin policy限制。
   *
   * @param URL  傳入要接收資料的伺服器網路位址。
   * @param data 傳入要被傳送的資料，被視為是key/value pairs的物件。
   */
  BackgroundFormSender.prototype.sendByURL = function (URL, data) {

//  // Define what happens when the response loads
//  resultIFrame.addEventListener("load", function () {
//    alert("Yeah! Data sent.");
//  });

    this.form.action = URL;
    this.form.target = this.resultIFrame.name;  // 把伺服器回傳的網頁，顯示在看不見的iframe中。

    var inputElementCreatedCount = 0;
    var inputElementRemovedCount = 0;

    var inputElement = this.form.firstElementChild;  // 這裡假定表單中所有的欄位都是text input element。
    //var dataItemIndex = 0;
    for (var dataItemName in data)
    {
      if (!inputElement)
      {  // 表單中的欄位不夠用，需要產生新的欄位。
        inputElement = this.theDocument.createElement("input");
        this.form.appendChild(inputElement);
        inputElementCreatedCount++;
      }

      inputElement.name  = dataItemName;
      inputElement.value = data[dataItemName].toString();

      inputElement = inputElement.nextElementSibling;
      //dataItemIndex++;
    }

    // For debug.
    //if (inputElementCreatedCount > 0)
    //  alert("inputElement created. (" + inputElementCreatedCount + ")");

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


  if (!theGlobal.gBackgroundFormSender)
  { // 第一次執行時，產生用來在背景進行form submit的全域物件。
    theGlobal.gBackgroundFormSender = new BackgroundFormSender();
  }


// 因為是透過 Construct.net 的 Browser.ExecJS() 執行這整段程式碼，所以這裡的 this 就是 Browser plugin 自己。
})(window, this.runtime);
