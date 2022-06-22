export { Base } from "./Operation/Operation_Base.js";
export { Root } from "./Operation/Operation_Base.js";
export { RootPool } from "./Operation/Operation_Base.js";

export { TwinArray } from "./Operation/Operation_TwinArray.js";

export { AddTwoTensors } from "./Operation/Operation_AddTwoTensors.js";
export { MultiplyTwoTensors } from "./Operation/Operation_MultiplyTwoTensors.js";
export { ConcatShuffleSplit } from "./Operation/Operation_ConcatShuffleSplit.js";
export { ConcatAlongAxisId2 } from "./Operation/Operation_ConcatAlongAxisId2.js";

export { Depthwise } from "./Operation/Operation_Depthwise.js";
export { Depthwise_SameWhenPassThrough } from "./Operation/Operation_Depthwise_SameWhenPassThrough.js";
export { Depthwise_ConstantWhenPassThrough } from "./Operation/Operation_Depthwise_ConstantWhenPassThrough.js";

export { Pointwise } from "./Operation/Operation_Pointwise.js";
export { Pointwise_SameWhenPassThrough } from "./Operation/Operation_Pointwise_SameWhenPassThrough.js";

//!!! (2022/06/07 Remarked) seems no longer needed.
// export { Pointwise_SameWhenPassThrough_PrefixSqueezeExcitation }
//   from "./Operation/Operation_Pointwise_SameWhenPassThrough_PrefixSqueezeExcitation.js";

export { Pointwise_ConstantWhenPassThrough } from "./Operation/Operation_Pointwise_ConstantWhenPassThrough.js";

//!!! (2022/06/07 Remarked) seems part of Block.Base.
//export { SqueezeExcitation } from "./Operation/Operation_SqueezeExcitation.js";

