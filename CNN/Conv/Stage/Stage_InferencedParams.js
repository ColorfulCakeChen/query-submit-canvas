export { Stage_InferencedParams as InferencedParams };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as Depthwise from "../Depthwise.js";
import * as ChannelShuffler from "../ChannelShuffler.js";
import * as BlockParamsCreator from "./Stage_BlockParamsCreator.js";
//import { ParamsBase } from "./Stage_ParamsBase.js";

/**
 * All properties inferenced from Stage.ParamsBase.
 *

//!!! (2022/07/30 Remarked) use Stage_BlockParamsCreator to create them.
//  * @member {number[]} inputHeightArray
//  *   The height of input image of every block.
//  *
//  * @member {number[]} inputWidthArray
//  *   The width of input image of every block.
//  *
//  * @member {number[]} outputHeightArray
//  *   The height of output image of every block.
//  *
//  * @member {number[]} outputWidthArray
//  *   The width of output image of every block.

 *
 * @member {number} outputHeight
 *   The height of output image. Usually, it is roughly half of the input height
 * (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
 *
 * @member {number} outputWidth
 *   The width of output image. Usually, it is roughly half of the input width
 * (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
 *
 * @member {number} outputChannelCount
 *   The channel count of output image. Usually, it is double the input channel count.
 *

//!!! (2022/07/30 Remarked) use Stage_BlockParamsCreator to create them.
//  * @member {number[]} depthwiseFilterHeightArray
//  *   The depthwise filter height of input image of every block.
//  *
//  * @member {number[]} depthwiseFilterWidthArray
//  *   The depthwise filter width of input image of every block.

 *
 */
class Stage_InferencedParams extends Recyclable.Root {

  /**
   * Used as default Stage.InferencedParams provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage.InferencedParams.Pool",
    Stage_InferencedParams, Stage_InferencedParams.setAsConstructor );

  /**
   * @param {Stage.ParamsBase} stageParamsBase
   */
  constructor( stageParamsBase ) {
    super();
    Stage_InferencedParams.setAsConstructor_self.call( this, stageParamsBase );
  }

  /** @override */
  static setAsConstructor( stageParamsBase ) {
    super.setAsConstructor();
    Stage_InferencedParams.setAsConstructor_self.call( this, stageParamsBase );
    return this;
  }

  /** @override */
  static setAsConstructor_self( stageParamsBase ) {
//!!! (2022/07/30 Remarked) should use Stage_BlockParamsCreator to create them.
//    Stage_InferencedParams.set_inferencedParams_by.call( this, stageParamsBase );

    this.blockParamsArray_create( stageParamsBase );
  }

  /** @override */
  disposeResources() {
    this.channelShuffler_dispose();
    this.blockParamsArray_dispose();

//!!! ...unfinished... (2022/07/31) should use Stage_BlockParamsCreator to create them.

//!!! (2022/07/30 Remarked) should use Stage_BlockParamsCreator to create them.
//    this.height_width_array_dispose();

    this.outputChannelCount = undefined;
    this.outputWidth = undefined;
    this.outputHeight = undefined;

    super.disposeResources();
  }

  /**
   *
   */
  channelShuffler_dispose() {
    if ( this.channelShuffler ) {
      this.channelShuffler.disposeResources_and_recycleToPool();
      this.channelShuffler = null;
    }
  }

  /**
   * 
   */
  blockParamsArray_dispose() {
    if ( this.blockParamsArray ) {
      this.blockParamsArray.disposeResources_and_recycleToPool();
      this.blockParamsArray = null;
    }
  }

  /**
   * 
   */
  blockParamsArray_create( stageParamsBase ) {
    if ( this.blockParamsArray ) {
      this.blockParamsArray.clear(); // (Re-used if exists.)
    } else {
      this.blockParamsArray = Recyclable.OwnerArray.Pool.get_or_create_by(); // Note: OwnerArray can not accept length as parameter.
    }

//!!! (2022/07/31 Remarked) Use BlockParamsClass_get() instead.
    // let BlockParamsClass;
    // if ( stageParamsBase instanceof Stage.Params )
    //   BlockParamsClass = Block.Params;
    // else // Stage.ParamsBase
    //   BlockParamsClass = Block.ParamsBase;

    let BlockParamsClass = stageParamsBase.BlockParamsClass_get();

    let blockParamsCreator;
    try {
      // 2. Create every blocks.
      blockParamsCreator = Stage_InferencedParams.create_BlockParamsCreator_byStageParams( stageParamsBase );
      blockParamsCreator.determine_blockCount_depthwiseFilterHeightWidth_Default_Last(); // Calculate the real block count.

      let blockCount = blockParamsCreator.blockCount;

      this.blockParamsArray.length = blockCount;

      let blockParams;
      for ( let i = 0; i < blockCount; ++i ) { // Block0, 1, 2, 3, ..., BlockLast.

        if ( 0 == i ) { // Block0.
          blockParamsCreator.configTo_beforeBlock0();
        } else { // (i.e. block1, 2, 3, ...)
          blockParamsCreator.configTo_beforeBlockN_exceptBlock0( i );
        }

        // BlockLast. (Note: Block0 may also be BlockLast.) 
        //
        // If this is the last block of this stage (i.e. at-stage-end)
        //   - a different depthwise filter size may be used.
        //   - a different activation function may be used after pointwise2 convolution.
        if ( ( this.blockParamsArray.length - 1 ) == i ) {
          blockParamsCreator.configTo_beforeBlockLast();
        }

//!!! (2022/07/30 Remarked) Stage.Base should do it.
//        this.assert_ImageSize_BetweenBlock( i, blockParamsCreator ); // Assert image size.

        blockParams = blockParamsCreator.create_BlockParams( BlockParamsClass ); // Create current block.

        if ( !this.channelShuffler ) { // If channelShuffler is got first time, keep it.

          // If channelShuffler is not null, keep it so that its tensors could be released.
          let channelShuffler = blockParamsCreator.channelShuffler;
          if ( channelShuffler ) {

            if ( ( this.channelShuffler ) && ( this.channelShuffler != channelShuffler ) )
              throw Error( `Stage.ParamsBase.blockParamsArray_create(): `
                + `At most, only one (and same) channel shuffler could be used (and shared by all blocks of a stage).` );

            this.channelShuffler = channelShuffler;
            blockParamsCreator.channelShuffler = null; // (Ownership transferred.)

//!!! (2022/07/30 Remarked) Stage.Base should do it.
//            this.tensorWeightCountExtracted += channelShuffler.tensorWeightCountExtracted;
//            this.tensorWeightCountTotal += channelShuffler.tensorWeightCountTotal;

          // If channelShuffler is null, do not use it. Otherwise, the this.channelShuffler
          // will be cleared and could not be used for releasing tensors.
          }

        // If channelShuffler has ever got, never change it.
        }

        blockParams.channelShuffler = this.channelShuffler; // Block.Params needs channel shuffler info (but does not own it).

        this.blockParamsArray[ i ] = blockParams;
      }

      this.blockParams0 = this.blockParamsArray[ 0 ]; // Shortcut to the first block.
      this.blockParamsLast = this.blockParamsArray[ this.blockParamsArray.length - 1 ]; // Shortcut to the last block.

      this.outputHeight = this.blockLast.output_height;
      this.outputWidth = this.blockLast.output_width;
      this.outputChannelCount = this.blockLast.output0_channelCount;

    } finally {
      if ( blockParamsCreator ) {
        blockParamsCreator.channelShuffler = null; // (Because ownership has been transferred to this Stage object.)
        blockParamsCreator.disposeResources_and_recycleToPool();
        blockParamsCreator = null;
      }
    }
  }

//!!! (2022/07/30 Remarked) should use Stage_BlockParamsCreator to create them.
//   /** Release .xxxHeightArray and .xxxWidthArray */
//   height_width_array_dispose() {

//     if ( this.depthwiseFilterWidthArray ) {
//       this.depthwiseFilterWidthArray.disposeResources_and_recycleToPool();
//       this.depthwiseFilterWidthArray = null;
//     }

//     if ( this.depthwiseFilterHeightArray ) {
//       this.depthwiseFilterHeightArray.disposeResources_and_recycleToPool();
//       this.depthwiseFilterHeightArray = null;
//     }

//     if ( this.outputWidthArray ) {
//       this.outputWidthArray.disposeResources_and_recycleToPool();
//       this.outputWidthArray = null;
//     }

//     if ( this.outputHeightArray ) {
//       this.outputHeightArray.disposeResources_and_recycleToPool();
//       this.outputHeightArray = null;
//     }

//     if ( this.inputWidthArray ) {
//       this.inputWidthArray.disposeResources_and_recycleToPool();
//       this.inputWidthArray = null;
//     }

//     if ( this.inputHeightArray ) {
//       this.inputHeightArray.disposeResources_and_recycleToPool();
//       this.inputHeightArray = null;
//     }
//   }

//   /**
//    * Determine the following properties:
//    *   - this.inputHeightArray
//    *   - this.inputWidthArray
//    *   - this.outputHeightArray
//    *   - this.outputWidthArray
//    *   - this.outputHeight
//    *   - this.outputWidth
//    *   - this.depthwiseFilterWidthArray
//    *   - this.depthwiseFilterHeightArray
//    *
//    * @param {number} sourceHeight  The height of source image.
//    * @param {number} sourceWidth   The width of source image.
//    */
//   static set_outputHeight_outputWidth_by(
//     sourceHeight, sourceWidth,
//     nConvStageTypeId,
//     blockCountRequested,
//     depthwiseFilterHeight, depthwiseFilterWidth
//   ) {


// //!!! ...unfinished... (2022/07/31) should use Stage_BlockParamsCreator to create them.

//     this.height_width_array_dispose();
//     this.inputHeightArray = Recyclable.Array.Pool.get_or_create_by( blockCountRequested );
//     this.inputWidthArray = Recyclable.Array.Pool.get_or_create_by( blockCountRequested );
//     this.outputHeightArray = Recyclable.Array.Pool.get_or_create_by( blockCountRequested );
//     this.outputWidthArray = Recyclable.Array.Pool.get_or_create_by( blockCountRequested );
//     this.depthwiseFilterWidthArray = Recyclable.Array.Pool.get_or_create_by( blockCountRequested );
//     this.depthwiseFilterHeightArray = Recyclable.Array.Pool.get_or_create_by( blockCountRequested );

//     // These two parameters are not important for calculating output height and width. Fixing them as constant 1 should be enough.
//     const inputChannelCount = 1;
//     const AvgMax_Or_ChannelMultiplier = 1;

//     let inputHeight, inputWidth, depthwiseFilterHeight_adjusted, depthwiseFilterWidth_adjusted, stridesPad;
//     let depthwisePadInfo;

//     // block0
//     {
//       this.inputHeightArray[ 0 ] = inputHeight = sourceHeight;
//       this.inputWidthArray[ 0 ] = inputWidth = sourceWidth;

//       if ( ValueDesc.ConvStageType.isPadValid( nConvStageTypeId ) ) {

//         // When pad is "valid", depthwise conv filter size can not larger than input image size.
//         if ( depthwiseFilterHeight > inputHeight )
//           this.depthwiseFilterHeightArray[ 0 ] = depthwiseFilterHeight_adjusted = inputHeight;
//         else
//           this.depthwiseFilterHeightArray[ 0 ] = depthwiseFilterHeight_adjusted = depthwiseFilterHeight;

//         if ( depthwiseFilterWidth > inputWidth )
//           this.depthwiseFilterWidthArray[ 0 ] = depthwiseFilterWidth_adjusted = inputWidth;
//         else
//           this.depthwiseFilterWidthArray[ 0 ] = depthwiseFilterWidth_adjusted = depthwiseFilterWidth;

//         stridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID;

//       } else {
//         this.depthwiseFilterHeightArray[ 0 ] = depthwiseFilterHeight_adjusted = depthwiseFilterHeight;
//         this.depthwiseFilterWidthArray[ 0 ] = depthwiseFilterWidth_adjusted = depthwiseFilterWidth;
//         stridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME;
//       }

//       depthwisePadInfo = Depthwise.PadInfoCalculatorRoot.Pool.get_or_create_by(
//         inputHeight, inputWidth, inputChannelCount,
//         AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight_adjusted, depthwiseFilterWidth_adjusted, stridesPad );

//       this.outputHeightArray[ 0 ] = depthwisePadInfo.outputHeight;
//       this.outputWidthArray[ 0 ] = depthwisePadInfo.outputWidth;
//     }

//     // block1, 2, 3, ..., blockLast
//     for ( let i = 1; i < blockCountRequested; ++i ) {
//       this.inputHeightArray[ i ] = inputHeight = depthwisePadInfo.outputHeight;
//       this.inputWidthArray[ i ] = inputWidth = depthwisePadInfo.outputWidth;

//       if ( ValueDesc.ConvStageType.isPadValid( nConvStageTypeId ) ) {

//         // When pad is "valid", depthwise conv filter size can not larger than input image size.
//         if ( depthwiseFilterHeight_adjusted > inputHeight )
//           this.depthwiseFilterHeightArray[ i ] = depthwiseFilterHeight_adjusted = inputHeight;
//         else
//           this.depthwiseFilterHeightArray[ i ] = depthwiseFilterHeight_adjusted;

//         if ( depthwiseFilterWidth_adjusted > inputWidth )
//           this.depthwiseFilterWidthArray[ i ] = depthwiseFilterWidth_adjusted = inputWidth;
//         else
//           this.depthwiseFilterWidthArray[ i ] = depthwiseFilterWidth_adjusted;

//         stridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID;

//       } else {
//         this.depthwiseFilterHeightArray[ i ] = depthwiseFilterHeight_adjusted = depthwiseFilterHeight;
//         this.depthwiseFilterWidthArray[ i ] = depthwiseFilterWidth_adjusted = depthwiseFilterWidth;
//         stridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;
//       }

//       depthwisePadInfo.set(
//         inputHeight, inputWidth, inputChannelCount,
//         AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight_adjusted, depthwiseFilterWidth_adjusted, stridesPad );

//       this.outputHeightArray[ i ] = depthwisePadInfo.outputHeight;
//       this.outputWidthArray[ i ] = depthwisePadInfo.outputWidth;
//     }

//     this.outputHeight = depthwisePadInfo.outputHeight;
//     this.outputWidth = depthwisePadInfo.outputWidth;

//     if ( depthwisePadInfo ) {
//       depthwisePadInfo.disposeResources_and_recycleToPool();
//       depthwisePadInfo = null;
//     }

//     // In current Stage's design, the output channel always is twice as input.
//     this.outputChannelCount = sourceChannelCount * 2;
//   }

//   /**
//    *
//    */
//   static set_inferencedParams_by(
//     sourceHeight, sourceWidth, sourceChannelCount,
//     nConvStageTypeId,
//     blockCountRequested,
//     depthwiseFilterHeight, depthwiseFilterWidth
//   ) {
//     Stage_InferencedParams.set_outputHeight_outputWidth_by.call( this,
//       sourceHeight, sourceWidth, sourceChannelCount,
//       nConvStageTypeId,
//       blockCountRequested,
//       depthwiseFilterHeight, depthwiseFilterWidth
//     );
//   }

  /**
   * @param {Stage.ParamsBase} stageParams
   *   The Stage.ParamsBase object to be referenced.
   *
   * @return {Base}
   *   Return newly created Stage.BlockParamsCreator.Xxx object according to stageParams.nConvStageTypeId.
   */
   static create_BlockParamsCreator_byStageParams( stageParams ) {

    if ( stageParams.blockCountRequested < 2 )
      throw Error( `Stage.InferencedParams.Base.create_BlockParamsCreator_byStageParams(): `
        + `stageParams.blockCountRequested ( ${stageParams.blockCountRequested} ) must be >= 2.` );

    if ( !(   ( stageParams.nConvStageTypeId >= 0 )
           && ( stageParams.nConvStageTypeId < Stage_Base.nConvStageTypeId_to_BlockParamsCreator_ClassArray.length )
          ) 
       )
      throw Error( `Stage.InferencedParams.create_BlockParamsCreator_byStageParams(): `
        + `unknown stageParams.nConvStageTypeId ( ${stageParams.nConvStageTypeId} ) value.`
      );

    let classBlockParamsCreator = Stage_InferencedParams.nConvStageTypeId_to_BlockParamsCreator_ClassArray[ stageParams.nConvStageTypeId ];
    let aBlockParamsCreator = classBlockParamsCreator.Pool.get_or_create_by( stageParams );

    return aBlockParamsCreator;
  }

  get blockCount() {
    if ( this.blockParamsArray )
      return this.blockParamsArray.length;
    return 0;
  }

  /** @override */
  toString() {
    let str = ``
      + `blockCount=${this.blockCount}, `
      + `outputHeight=${this.outputHeight}, `
      + `outputWidth=${this.outputWidth}, `
      + `outputChannelCount=${this.outputChannelCount}`
    ;
    return str;
  }

}

/**
 * Mapping nConvStageTypeId (number as array index) to BlockParamsCreator class object.
 */
Stage_InferencedParams.nConvStageTypeId_to_BlockParamsCreator_ClassArray = [
  BlockParamsCreator.MobileNetV1,                         // ValueDesc.ConvStageType.Ids.MOBILE_NET_V1 (0)
  BlockParamsCreator.MobileNetV1_padValid,                // ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID (1)
  BlockParamsCreator.MobileNetV2_Thin,                    // ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN (2)
  BlockParamsCreator.MobileNetV2,                         // ValueDesc.ConvStageType.Ids.MOBILE_NET_V2 (3)
  BlockParamsCreator.ShuffleNetV2,                        // ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2 (4)
  BlockParamsCreator.ShuffleNetV2_ByMobileNetV1,          // ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (5)
  BlockParamsCreator.ShuffleNetV2_ByMobileNetV1_padValid, // ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID (6)
  BlockParamsCreator.ShuffleNetV2_ByPointwise21,          // ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21 (7)
];
