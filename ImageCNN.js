/**
 * @param sourceCanvas          傳入要被分析的原始畫布。
 * @param preferredCanvasWidth  傳入要以多寬的尺寸來分析該影像。
 * @param preferredCanvasHeight 傳入要以多高的尺寸來分析該影像。
 */
function copyExtractImage(sourceCanvas, preferredCanvasWidth, preferredCanvasHeight)
{
  // 建立與專案期待的可視區相同尺寸的緩衝區。
  var bufferCanvas = document.createElement("canvas");
  bufferCanvas.width = preferredCanvasWidth;
  bufferCanvas.height = preferredCanvasHeight;

  var ctx = bufferCanvas.getContext('2d');

  // 實際執行時，可視區的尺寸往往與預期值不同(例如：全螢幕執行)。為了穩定這個變量，同時
  // 也為了接下來可以取得其中的畫素，所以把實際畫面內容複製出來，同時縮放成預期尺寸。
  ctx.globalCompositeOperation="copy";
  ctx.drawImage(sourceCanvas, 0, 0, preferredCanvasWidth, preferredCanvasHeight);
  //ctx.globalCompositeOperation="source-over";

  //alert(ctx.globalAlpha);
  //alert(theC3Runtime.canvas);
  //var ctx = theC3Runtime.canvas.getContext('2d');
  //alert(ctx);
  //alert(ctx.globalAlpha);
  //return 
  return "Temp Canvas (Width, Height) = (" + bufferCanvas.width + ", " + bufferCanvas.height + ")";
  //var ctx = theC3Runtime.canvas.getContext("webgl2"); ctx.clearRect(0,0,300,300);
  //"ctx = " + ctx;
}

/**
 * @param theC3Runtime 傳入Construct 3的執行時期引擎。
 */
function processRuntimeCanvas(theC3Runtime)
{
  // 專案期待的可視區尺寸。
  var preferredCanvasWidth = theC3Runtime.original_width;
  var preferredCanvasHeight = theC3Runtime.original_height;
  return copyExtractImage(theC3Runtime.canvas, preferredCanvasWidth, preferredCanvasHeight);
}

processRuntimeCanvas(this.runtime);
