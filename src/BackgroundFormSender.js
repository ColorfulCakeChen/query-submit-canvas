/**
 * 請在 Construct.net 的 On start of layout 中，使用 Browser.ExexJS() 執行這個檔案的內容。
 */
(function (theGlobal, theRuntime) {

  function BackgroundFormSender()
  {
    this.resultIFrame = document.createElement("iframe");   // 產生一個看不見的iframe，作為接收form submit response的目的地。
    this.resultIFrame.id = "resultIFrame_" + Date.now();    // 盡可能確保名稱是唯一的。(作為form submit response target。)
    this.resultIFrame.name = this.resultIFrame.id;
    this.resultIFrame.style.display = "none";               // 這個iframe永不顯示。
    document.body.appendChild(this.resultIFrame);

    this.form = document.createElement("form");             // 每次傳送資料，都會重複使用這個(看不見的)form。(減少記憶體的重複配置與釋放。)
    this.form.style.display = "none";                       // 這個form永不顯示。
    document.body.appendChild(this.form);                   // To be sent, the form needs to be attached to the main document.

    this.requestId = 0; // 累計已經呼叫過多少次。(For debug.)
  }

  /**
   * 透過隱藏的form傳送資料。
   *
   * 透過form傳送的好處，是可以cross domain進行傳送，避開ajax會遭遇的same origin policy限制。
   *
   * @param URL  傳入要接收資料的伺服器網路位址。
   * @param data 傳入要被傳送的資料，被視為是key/value pairs的物件。
   */
  BackgroundFormSender.prototype.sendData = function (URL, data) {

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
        inputElement = document.createElement("input");
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


  if (!theGlobal.gBackgroundFormSender)
  { // 第一次執行時，產生用來在背景進行form submit的全域物件。
    theGlobal.gBackgroundFormSender = new BackgroundFormSender();
  }

  var URL="https://docs.google.com/forms/d/e/1FAIpQLScwkiFQAGMgt9nWthrJuIjVjPmUcQP-cW3EAM4ojGkE-QiW3g/formResponse";
  //entry.1504146089
  //entry.1756834287
  var data={ "entry.1504146089": gBackgroundFormSender.requestId + "yy" + Date.now() };
  //alert("send data = " + JSON.stringify(data));
  gBackgroundFormSender.sendData(URL, data);

//  setTimeout(function () {
//    var data2={ "entry.1504146089": gBackgroundFormSender.requestId + "zz" + Date.now(), "entry.1756834287": "abc", "extra2": "123" };
//    gBackgroundFormSender.sendData(URL, data2);
//  }, 500);

// 因為是透過 Construct.net 的 Browser.ExecJS() 執行這整段程式碼，所以這裡的 this 就是 Browser plugin 自己。
})(window, this.runtime);













