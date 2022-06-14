export { Same, Bool, Int } from "./ValueDesc/ValueDesc_Base.js";

//!!! (2022/06/14 Remarked) Replaced by ConvBlockType
//export { channelCount1_pointwise1Before } from "./ValueDesc/ValueDesc_Other.js";
export { ConvBlockType } from "./ValueDesc/ValueDesc_ConvBlockType.js";

export { Pointwise_HigherHalfDifferent } from "./ValueDesc/ValueDesc_Other.js";
export { Depthwise_HigherHalfDifferent } from "./ValueDesc/ValueDesc_Other.js";
export { AvgMax_Or_ChannelMultiplier } from "./ValueDesc/ValueDesc_Other.js";
export { SqueezeExcitationChannelCountDivisor } from "./ValueDesc/ValueDesc_SqueezeExcitationChannelCountDivisor.js";
export { StridesPad } from "./ValueDesc/ValueDesc_StridesPad.js";
export { ActivationFunction } from "./ValueDesc/ValueDesc_ActivationFunction.js";
export { PassThroughStyle } from "./ValueDesc/ValueDesc_PassThroughStyle.js";
export { ConvStageType } from "./ValueDesc/ValueDesc_ConvStageType.js";
