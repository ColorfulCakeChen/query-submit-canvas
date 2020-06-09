import * as HeightWidthDepth from "./HeightWidthDepth.js";
//import * as TensorTools from "../util/TensorTools.js";

/**
 * Test different resize implementation for CNN.
 *
 * @see {@link https://jsperf.com/colorfulcakechen-cnn-height-width-resize}
 */

globalThis.testSet_110x110x24 = new HeightWidthDepth.Base( 110, 110, 24 ); // height, width, depth
