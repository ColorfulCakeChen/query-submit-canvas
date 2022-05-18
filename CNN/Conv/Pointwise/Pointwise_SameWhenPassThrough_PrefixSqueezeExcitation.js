export { SameWhenPassThrough_PrefixSqueezeExcitation };

import * as BoundsArraySet from "../BoundsArraySet.js";
import * as SqueezeExcitation from "../SqueezeExcitation.js";
import { SameWhenPassThrough } from "./Pointwise_SameWhenPassThrough.js";


//!!! ...unfinished... (2022/05/14)
// Q: Perhaps, let pointwise1 become squeeze and excitation before depthwise.
// A: It may not be possible because input and output channel count may be different.

//!!! ...unfinished... (2022/05/08) Add squeeze and excitation before pointwise.
// globale avg pooling - pointwise - pointwise - multiplyToInput
// And the, the original pointwise


//!!! ...unfinished... (2022/05/09) What if:
// pointwise1 ( bias, activation )
// depthwise ( channelMultipler > 1, bias / no bias, activation / no activation )
// pointwiseSE ( bias, activation )
// pointwise2 ( bias, activation )
//
// pointwise1 - depthwise - pointwiseSE - multiply - pointwise2
//                        \-------------/
//
// No global average pooloing.
//
//
//
//




/**
 * A Pointwise_SameWhenPassThrough with a SqueezeExcitation in front of it.
 *
 */
class SameWhenPassThrough_PrefixSqueezeExcitation extends SameWhenPassThrough {

//!!! ...unfinished... (2022/05/17)

//!!! new SqueezeExcitation.Base()

}
