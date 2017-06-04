/**
 * @param theGlobal 傳入記載全域變數的地方。(在Browser中，通常就是window。)
 *
 * @param theRuntime
 *   傳入Consrruct.net的Runtime引擎物件。
 *
 * @param inoutArrayUID
 *   傳入存放有查詢相關參數的 Construct.net Array plugin 的 instance 的 UID。
 *   inoutArray(0,0,0) = sheetDocKey (要被查詢的Google Sheet檔案的編號)
 *   inoutArray(0,0,1) = signalTag   (查詢結束時(不論成功或失敗)要通知 Construct.net 的哪個 Wait for signal。) 
 *   inoutArray(0,0,2) = 查詢成功時，從這個陣列傳回查詢的結果。
 */
function queryData(theGlobal, theRuntime, inputArrayUID)
{
  if (!theGlobal.gDataTableRequests)  // 必須已經建立暫存這些查詢請求的全域物件。
  {
    alert("Please DataTableRequests_Initialize() first.");
    return;
  }

  theGlobal.gDataTableRequests.sendQuery(theRuntime, inputArrayUID);
}







//queryData(window, "1QzhY3yJGRBil30z6b99Ao0meVGNfw_T9A6mup4wZ3zw");
queryData(window, this.runtime, inputArrayUID);
