/**
 * @param theGlobal 傳入記載全域變數的地方。(在Browser中，通常就是window。)
 */
function DataTableRequests_Deinitialize(theGlobal)
{
  if (!theGlobal.gDataTableRequests)  // 原本就不存在，不需要清除。
    return;

  delete theGlobal.gDataTableRequests;
}

/**
 * @param theGlobal 傳入記載全域變數的地方，以便能夠檢查某些全域物件是否存在，以及建立全域物件。(在Browser中，通常就是傳入window。)
 */
function DataTableRequests_Initialize(theGlobal)
{
  if (theGlobal.gDataTableRequests)  // 已經初始化過了，不需要重新建立。
    return;

  /**
   * class RequestState
   * 記載單一筆請求的資料。
   */
  function RequestState(theDataTableRequests, requestId, theRuntime, inoutArrayUID)
  {
    this.theDataTableRequests = theDataTableRequests;  // 以便在查詢結束後，能夠把這筆記錄從容器中移除。

    this.requestId = requestId;
    this.isFailed = false;
    this.response = null;

    this.theRuntime =     theRuntime;
    this.inoutArrayUID =  inoutArrayUID;
    this.inoutArray =     theRuntime.getObjectByUID(inoutArrayUID);
    this.sheetDocKey =    this.inoutArray.at(0, 0, 0);
    this.signalTag   =    this.inoutArray.at(0, 0, 1);
  }

  RequestState.prototype.toString = function ()
  {
    return JSON.stringify(this);
  }

  // 把這筆紀錄，從所屬列表中移除。
  RequestState.prototype.removeThisFromContainer = function ()
  {
    this.theDataTableRequests.requestStateMap.delete(this.requestId);
  }

  // 把結果字串存入陣列中用來回傳資料的地方，並且喚醒 Construct.net EventSheet 中的 Wait for signal。
  RequestState.prototype.signalResult = function (resultString)
  {
    this.inoutArray.setSize(1, 1, 3);
    this.inoutArray.set(0, 0, 2, resultString);
    this.theRuntime.system.acts.Signal.call(this.theRuntime.system, this.signalTag);
  }

  /**
   * class DataTableRequests
   * 記載所有請求的資料。
   */
  function DataTableRequests() {
    this.nextRequestId = 0;
    this.requestStateMap = new Map();  // 使用nextRequestId產生的數值，作為索引鍵值。
  }

  /**
   * @param theRuntime
   *   傳入Consrruct.net的Runtime引擎物件。
   *
   * @param inoutArrayUID
   *   傳入存放有查詢相關參數的 Construct.net Array plugin 的 instance 的 UID。
   *   inoutArray(0,0,0) = sheetDocKey (要被查詢的Google Sheet檔案的編號)
   *   inoutArray(0,0,1) = signalTag   (查詢結束時(不論成功或失敗)要通知 Construct.net 的哪個 Wait for signal。) 
   *   inoutArray(0,0,2) = 查詢成功時，從這個陣列傳回查詢的結果。
!!!???
   *   inoutArray(1,y,z) = 查詢成功時，從這個陣列傳回查詢的結果。
   */
  DataTableRequests.prototype.sendQuery = function (theRuntime, inoutArrayUID)
  {
//    //var self = this;
//
//    if (!theGlobal.gDataTableRequests)  // 必須已經建立暫存這些查詢請求的全域物件。
//    {
//      alert("Please DataTableRequests_Initialize() first.");
//      return;
//    }

    var theRequestState = this.createRequestState(theRuntime, inoutArrayUID);  // 產生這次查詢請求的編號與狀態記錄。

    new Promise(function (resolve, reject)
    {
      // 成功載入Google Charts API後，在Global Context中會有google與google.charts等物件可用。    
      if (theGlobal.google && theGlobal.google.charts)
      {
        resolve(theGlobal.google);                           // 已經載入過了，直接使用即可不需要重複載入。
        //alert("Already load Chart API.");
        return;
      }

      // 尚未載入Google Charts API，那就先非同步載入Google Charts API的Loader。
      var scriptElement = document.createElement("script");
      scriptElement.src = "https://www.gstatic.com/charts/loader.js";
      document.head.appendChild(scriptElement);

      scriptElement.onerror = function (errorEvent) {
        reject(errorEvent);
        //alert("load Chart API failed.");
      }

      // 成功載入Google Charts API的Loader後，再用它來載入Google Charts API。
      scriptElement.onload = function () {
        // Load the Visualization API and the corechart package.
        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(function () {
          resolve(google);
          //alert("load Chart API done.");
        });
      }
    })
    .then(function (google)  // After Google Charts API is loaded.
    {
      //var sheetDocKey = "1QzhY3yJGRBil30z6b99Ao0meVGNfw_T9A6mup4wZ3zw";
      var sheetId = 0;
      var headerLineCount = 1;
      //var URL = "https://docs.google.com/spreadsheets/d/1QzhY3yJGRBil30z6b99Ao0meVGNfw_T9A6mup4wZ3zw/gviz/tq?gid=0&headers=1";
      var URL = "https://docs.google.com/spreadsheets/d/"
                  + theRequestState.sheetDocKey + "/gviz/tq?gid=" + sheetId + "&headers=" + headerLineCount;

      var querySQL = "SELECT *";

      return new Promise(function (resolve, reject)
      {
        var query = new google.visualization.Query(URL);
        query.setQuery(querySQL);
        query.send(function (response) {
          theRequestState.removeThisFromContainer();  // 從列表中移除已經完成的查詢，釋放記憶體。
          if (response.isError())
          {
            //alert("Query failed.");
            google.visualization.errors.addError(theRequestState.theRuntime.canvasdiv, response);
            var message = response.getMessage();
            var detailedMessage = response.getDetailedMessage();
            reject(message + ' ' + detailedMessage);
          }
          else
          {
            theRequestState.response = response;
            var dataTable = response.getDataTable();
            //alert("Query Successful." + dataTable);
            resolve(dataTable);
          }
        });
      });
    })
    .then(function (dataTable)  // After got data table.
    {
      theRequestState.signalResult(JSON.stringify(dataTable));
      //alert("Query Successful. " + JSON.stringify(dataTable));
    })
    .then(null, function (err)    // Promise catch
    {
      theRequestState.signalResult(err.toString());
      alert("Query failed. " + err);
    });

//    // 
//    var retDictionary =
//    {
//      "c2dictionary":true,
//      "data":
//      {
//        "shouldWait": "gDataTableRequests.shouldWait(" + theRequestState.requestId + ");",
//        "isFailed": "gDataTableRequests.isFailed(" + theRequestState.requestId + ");",
//        "getFailedMessage": "gDataTableRequests.getFailedMessage(" + theRequestState.requestId + ");",
//        "getDataTable": "gDataTableRequests.getDataTable(" + theRequestState.requestId + ");"
//      }
//    };
//
//    return JSON.stringify(retDictionary);
  }

  // 產生、記載、傳回新的請求狀態記錄。
  DataTableRequests.prototype.createRequestState = function (theRuntime, inoutArrayUID) {
    var requestId = this.nextRequestId;  // 產生這次查詢請求的編號。
    this.nextRequestId++;

    var theRequestState = new RequestState(this, requestId, theRuntime, inoutArrayUID);
    this.requestStateMap.set(requestId, theRequestState);
    return theRequestState;
  }

  // 如果還需要等待指定編號的請求的執行結果，傳回true。否則，表示該請求已經完成(不論成功或失敗，或甚至無此請求)，傳回false。
  DataTableRequests.prototype.shouldWait = function (requestId) {
    var theRequestState = this.requestStateMap.get(requestId);
    //alert("theRequestState=" + theRequestState);
    if (!theRequestState)
      return false;  // 無此請求資料，不需要等待，因為不可能完成。  
    if (theRequestState.isFailed)
      return false;  // 已經執行失敗，不需要再等待。
    if (!theRequestState.response)
      return false;  // 已經執行成功，不需要再等待。
    return true;     // 繼續等待執行結果的到來。
  };

  // 傳回指定編號的請求，是否已經執行失敗。
  DataTableRequests.prototype.isFailed = function (requestId) {
    var theRequestState = this.requestStateMap.get(requestId);
    if (!theRequestState)
      return true;  // 無此請求資料，視為執行失敗，因為也沒有資料可以使用。  
    return theRequestState.isFailed;
  };

  /**
   * 如果傳回指定編號的請求，已經執行失敗，傳回失敗原因的描述字串。
   * @param clear  如果傳入true，會順便把該請求記錄，從這個表中移除。(釋出記憶體。)
   */
  DataTableRequests.prototype.getFailedMessage = function (requestId, clear) {
    var theRequestState = this.requestStateMap.get(requestId);
    if (clear)
      this.requestStateMap["delete"](requestId);            // 清除此紀錄。
    if (!theRequestState)
      return "Request(" + requestId + ") does not exist.";  // 無此請求資料。
    if (!theRequestState.isFailed)
      return "Request(" + requestId + ") not yet failed.";  // 此請求尚未失敗(結果還不知道)。
    if (!theRequestState.response)
      return "Request(" + requestId + ") failed with unknown reason.";  // 此請求已經失敗，但原因未知。

    var message = theRequestState.response.getMessage();
    var detailedMessage = theRequestState.response.getDetailedMessage();
    return ("Request(" + requestId + ") " + message + " " + detailedMessage);
  };

  /**
   * 如果(shouldWait() == false) && (isFailed() == false))，傳回查詢的資料。
   * @param clear  如果傳入true，會順便把該請求記錄，從這個表中移除。(釋出記憶體。)
   */
  DataTableRequests.prototype.getDataTable = function (requestId, clear) {
    var theRequestState = this.requestStateMap.get(requestId);
    if (clear)
      this.requestStateMap["delete"](requestId);            // 清除此紀錄。
    if (!theRequestState)
      return "Request(" + requestId + ") does not exist.";    // 無此請求資料。
    if (!theRequestState.response)
      return "Request(" + requestId + ") not yet response.";  // 此請求還在進行中，結果還不知道。
    return JSON.stringify(theRequestState.response.getDataTable());
  };

  theGlobal.gDataTableRequests = new DataTableRequests();
}










DataTableRequests_Initialize(window);
