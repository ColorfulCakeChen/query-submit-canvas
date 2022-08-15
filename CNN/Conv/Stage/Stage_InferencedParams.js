export { Stage_InferencedParams as InferencedParams };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
//import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as Depthwise from "../Depthwise.js";
import * as ChannelShuffler from "../ChannelShuffler.js";
import * as BlockParamsCreator from "./Stage_BlockParamsCreator.js";
//import { ParamsBase } from "./Stage_ParamsBase.js";

/**
 * All properties inferenced from Stage.ParamsBase.
 *
 *
 * @member {Block.ParamsBase[]} blockParamsArray
 *   The blocks parameters of this stage. It will be created only if
 * ( stageParamsBase.inferencedParams_blockParamsArray_needed() == true ).
 *
 * @member {number} output_height
 *   The height of output image. Usually, it is roughly half of the input height
 * (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
 *
 * @member {number} output_width
 *   The width of output image. Usually, it is roughly half of the input width
 * (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
 *
 * @member {number} output_channelCount
 *   The channel count of output image. Usually, it is double the input channel count.
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
   *   The stage parameters of this inferenced stage parameters.
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
    this.blockParamsArray_create( stageParamsBase );
  }

  /** @override */
  disposeResources() {
    this.output_channelCount = undefined;
    this.output_width = undefined;
    this.output_height = undefined;

    this.blockParamsLast = undefined;
    this.blockParams0 = undefined;

    this.blockParamsArray_dispose();
    this.channelShuffler_dispose();

    this.blockCount = undefined;

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

    this.channelShuffler_dispose(); // So that new channel shuffler (if has) could be owned.

    if ( !stageParamsBase.inferencedParams_blockParamsArray_needed() )
      return; // No need to create blockParamsArray.

    let blockParamsCreator;
    try {
      let BlockParamsClass = stageParamsBase.BlockParamsClass_get();

      // Create every block.
      blockParamsCreator = Stage_InferencedParams.create_BlockParamsCreator_byStageParams( stageParamsBase );
      blockParamsCreator.determine_blockCount_depthwiseFilterHeightWidth_Default_Last(); // Calculate the real block count.

      this.blockCount = blockParamsCreator.blockCount;
      this.blockParamsArray.length = this.blockCount;

      let blockParams;
      let next_input_height, next_input_width;
      for ( let i = 0; i < this.blockCount; ++i ) { // Block0, 1, 2, 3, ..., BlockLast.

        if ( 0 == i ) { // Block0.
          blockParamsCreator.configTo_beforeBlock0();
        } else { // (i.e. block1, 2, 3, ...)
          blockParamsCreator.configTo_beforeBlockN_exceptBlock0( i, next_input_height, next_input_width );
        }

        // BlockLast. (Note: Block0 may also be BlockLast.) 
        //
        // If this is the last block of this stage (i.e. at-stage-end)
        //   - a different depthwise filter size may be used.
        //   - a different activation function may be used after pointwise2 convolution.
        if ( ( this.blockParamsArray.length - 1 ) == i ) {
          blockParamsCreator.configTo_beforeBlockLast();
        }

        blockParams = this.blockParamsArray[ i ]
          = blockParamsCreator.create_BlockParams( BlockParamsClass ); // Create current block.

        if ( !this.channelShuffler ) { // If channelShuffler is got first time, keep it.

          // If channelShuffler is not null, keep it so that its tensors could be released.
          let channelShuffler = blockParamsCreator.channelShuffler;
          if ( channelShuffler ) {

            if ( ( this.channelShuffler ) && ( this.channelShuffler != channelShuffler ) )
              throw Error( `Stage.ParamsBase.blockParamsArray_create(): `
                + `At most, only one (and same) channel shuffler could be used (and shared by all blocks of a stage).` );

            this.channelShuffler = channelShuffler;
            blockParamsCreator.channelShuffler = null; // (Ownership transferred.)

          // If channelShuffler is null, do not use it. Otherwise, the this.channelShuffler
          // will be cleared and could not be used for releasing tensors.
          }

        // If channelShuffler has ever got, never change it.
        }

        blockParams.channelShuffler = this.channelShuffler; // Block.Params needs channel shuffler info (but does not own it).

        blockParams.inferencedParams_create();

        next_input_height = blockParams.output_height;
        next_input_width = blockParams.output_width;
      }

      this.blockParams0 = this.blockParamsArray[ 0 ]; // Shortcut to the first block.
      this.blockParamsLast = this.blockParamsArray[ this.blockParamsArray.length - 1 ]; // Shortcut to the last block.

      this.output_height = this.blockParamsLast.output_height;
      this.output_width = this.blockParamsLast.output_width;
      this.output_channelCount = this.blockParamsLast.output_channelCount;

    } finally {
      if ( blockParamsCreator ) {
        blockParamsCreator.channelShuffler = null; // (Because ownership has been transferred to this Stage object.)
        blockParamsCreator.disposeResources_and_recycleToPool();
        blockParamsCreator = null;
      }
    }
  }

  /**
   * @param {Stage.ParamsBase} stageParams
   *   The Stage.ParamsBase object to be referenced.
   *
   * @return {Stage.BlockParamsCreator.Base}
   *   Return newly created Stage.BlockParamsCreator.Xxx object according to stageParams.nConvStageTypeId.
   */
   static create_BlockParamsCreator_byStageParams( stageParams ) {

    if ( stageParams.blockCountRequested < 2 )
      throw Error( `Stage.InferencedParams.Base.create_BlockParamsCreator_byStageParams(): `
        + `stageParams.blockCountRequested ( ${stageParams.blockCountRequested} ) must be >= 2.` );

    if ( !(   ( stageParams.nConvStageTypeId >= 0 )
           && ( stageParams.nConvStageTypeId < Stage_InferencedParams.nConvStageTypeId_to_BlockParamsCreator_ClassArray.length )
          ) 
       )
      throw Error( `Stage.InferencedParams.create_BlockParamsCreator_byStageParams(): `
        + `unknown stageParams.nConvStageTypeId ( ${stageParams.nConvStageTypeId} ) value.`
      );

    let classBlockParamsCreator = Stage_InferencedParams.nConvStageTypeId_to_BlockParamsCreator_ClassArray[ stageParams.nConvStageTypeId ];
    let aBlockParamsCreator = classBlockParamsCreator.Pool.get_or_create_by( stageParams );

    return aBlockParamsCreator;
  }

  /** @override */
  toString() {
    let str = ``
      + `blockCount=${this.blockCount}, `
      + `output_height=${this.output_height}, `
      + `output_width=${this.output_width}, `
      + `output_channelCount=${this.output_channelCount}`
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
