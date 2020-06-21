import * as HeightWidthDepth from "./HeightWidthDepth.js";
//import * as TensorTools from "../util/TensorTools.js";

/**
 * Test different resize implementation for CNN.
 *
 * @see {@link https://jsperf.com/colorfulcakechen-cnn-height-width-resize}
 */

globalThis.testSet_101x101x24 = new HeightWidthDepth.Base( 101, 101, 24 ); // height, width, depth
