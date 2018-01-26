/**
 * 更新指定部落格網域中指定文章的內容。
 *
 * @param {string} bloggerURL 傳入部落格網域。e.g. "https://cakeliving.blogspot.tw/"
 * @param {string} postPath   傳入要更新的部落格文章的路徑。e.g. "/2017/07/chess.html"
 * @param {string} newContent 傳入部落格文章的新內容。
 */
function updatePost(bloggerURL, postPath, newContent) {
  var theOAuthToken = ScriptApp.getOAuthToken();
  var requestOptions;
  var theHTTPResponse;

  requestOptions = {
    headers : {
      Authorization : "Bearer " + theOAuthToken
    }
    //,
    //muteHttpExceptions : true
  };

  // 1. 查詢部落格的編號。
  var queryBloggerId_fetchURL
   = "https://www.googleapis.com/blogger/v3/blogs/byurl"
       + "?url=" + bloggerURL
       + "&fields=kind,id,name";

  theHTTPResponse = UrlFetchApp.fetch(queryBloggerId_fetchURL, requestOptions);
  var bloggerInfo = JSON.parse(theHTTPResponse.getContentText());
  //Logger.log(bloggerInfo);
  var bloggerId = bloggerInfo.id;

  // 2. 查詢部落格文章的編號。
  var queryPostId_fetchURL
    = "https://www.googleapis.com/blogger/v3/blogs/" + bloggerId + "/posts/bypath"
        + "?path=" + postPath
        + "&fields=kind,id,title";

  theHTTPResponse = UrlFetchApp.fetch(queryPostId_fetchURL, requestOptions);
  var postInfo = JSON.parse(theHTTPResponse.getContentText());
  //Logger.log(postInfo);
  var postId = postInfo.id;

  // 3. 更新部落格文章的內容。
  requestOptions.contentType = "application/json";
  requestOptions.method = "patch";
  requestOptions.payload = JSON.stringify({
    content : newContent
  });
  var patchPostContent_fetchURL
    = "https://www.googleapis.com/blogger/v3/blogs/" + bloggerId + "/posts/" + postId
        + "?"
        + "&fields=kind,id,title";

  theHTTPResponse = UrlFetchApp.fetch(patchPostContent_fetchURL, requestOptions);
  var patchPostResponse = JSON.parse(theHTTPResponse.getContentText());
  //Logger.log(patchPostResponse);

}

//"oauthScopes": ["https://www.googleapis.com/auth/script.external_request", "https://www.googleapis.com/auth/blogger"]



















