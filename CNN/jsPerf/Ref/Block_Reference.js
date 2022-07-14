export { Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ObjectPropertyAsserter from "../../util/ObjectPropertyAsserter.js";
import * as TensorTools from "../../util/TensorTools.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as Pool_Asserter from "../../util/Pool_Asserter.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ActivationEscaping from "../../Conv/ActivationEscaping.js";
import * as BoundsArraySet from "../../Conv/BoundsArraySet.js";
import * as Pointwise from "../../Conv/Pointwise.js";
import * as Depthwise from "../../Conv/Depthwise.js";
import * as ChannelShuffler from "../../Conv/ChannelShuffler.js";
import * as Block from "../../Conv/Block.js";
import * as Block_TestParams from "./Block_TestParams.js"; 
import * as NumberImage from "./NumberImage.js";
import * as ImageSourceBag from "./ImageSourceBag.js";
import * as BoundsArraySet_Asserter from "./BoundsArraySet_Asserter.js";


/**
 * Information used by Base.testCorrectness().
 */
class TestCorrectnessInfo extends Recyclable.Root {

  /**
   * Used as default Block_Reference.TestCorrectnessInfo provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Block_Reference.TestCorrectnessInfo.Pool", TestCorrectnessInfo, TestCorrectnessInfo.setAsConstructor );

  /**
   */
  constructor() {
    super();
    TestCorrectnessInfo.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    TestCorrectnessInfo.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // For reducing memory allocation.
    this.imageInArraySelected = Recyclable.Array.Pool.get_or_create_by( 2 ); // imageInArraySelected[ 0 ] is input0, imageInArraySelected[ 1 ] is input1.
    this.imageOutReferenceArray = Recyclable.Array.Pool.get_or_create_by( 2 );
    this.inputTensor3dArray = Recyclable.Array.Pool.get_or_create_by( 2 );
    this.outputTensor3dArray = Recyclable.Array.Pool.get_or_create_by( 2 );
  }

  /** @override */
  disposeResources() {
    this.outputTensor3dArray.disposeResources_and_recycleToPool();
    this.outputTensor3dArray = null;

    this.inputTensor3dArray.disposeResources_and_recycleToPool();
    this.inputTensor3dArray = null;

    this.imageOutReferenceArray.disposeResources_and_recycleToPool();
    this.imageOutReferenceArray = null;

    this.imageInArraySelected.disposeResources_and_recycleToPool();
    this.imageInArraySelected = null;

    super.disposeResources();
  }

  prepareBy( imageSourceBag, testParams, channelShufflerBag ) {

    let {
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      pointwise20ChannelCount,
      bKeepInputTensor,
      inferencedParams
    } = testParams.out;

    let imageInArraySelected = this.imageInArraySelected; // imageInArraySelected[ 0 ] is input0, imageInArraySelected[ 1 ] is input1.
    let imageOutReferenceArray = this.imageOutReferenceArray;
    let inputTensor3dArray = this.inputTensor3dArray;
    let outputTensor3dArray = this.outputTensor3dArray;

    let bTwoInputs, input1_channelCount;
    {
      bTwoInputs = ( inferencedParams.inputTensorCount == 2 );
      input1_channelCount = inferencedParams.input1_channelCount;
    }

    let channelShuffler_ConcatPointwiseConv, channelShuffler_concatenatedShape, channelShuffler_outputGroupCount;
    {
      imageInArraySelected.fill( undefined );
      imageInArraySelected[ 0 ] = imageSourceBag.getImage_by( input0_height, input0_width, input0_channelCount );

      // Although input1 is only needed when ( bTwoInputs == true ), it is always prepared for calculating the shape of channel shuffler.
      // 
      // The shape of input1 (not input0) determines the concatenatedShape of channel shuffler because the input0 might be shrinked
      // by depthwise convolution.
      //
      // Note: input1_channelCount may be zero.
      //
      let imageIn1 = imageSourceBag.getImage_by(
        input0_height, input0_width, input1_channelCount,
        depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );

      if ( bTwoInputs ) { // Pass two input images according to parameters.
        imageInArraySelected[ 1 ] = imageIn1;

        if ( !(    ( imageIn1.height == inferencedParams.input1_height )
                && ( imageIn1.width == inferencedParams.input1_width )
                && ( imageIn1.depth == inferencedParams.input1_channelCount ) ) )
          throw Error( `Block_Reference.TestCorrectnessInfo.prepareBy(): `
            + `input image1's ( height, width, depth ) = ( ${imageIn1.height}, ${imageIn1.width}, ${imageIn1.depth} ) should be `
            + `( ${inferencedParams.input1_height}, ${inferencedParams.input1_width}, ${inferencedParams.input1_channelCount} ). `
            + `( ${testParams} )`
          );
      } else {
        if ( !(   ( 0 == inferencedParams.input1_height )
               && ( 0 == inferencedParams.input1_width )
               && ( 0 == inferencedParams.input1_channelCount ) ) )
          throw Error( `Block_Reference.TestCorrectnessInfo.prepareBy(): `
            + `inferenced input1's ( height, width, depth ) = `
            + `( ${inferencedParams.input1_height}, ${inferencedParams.input1_width}, ${inferencedParams.input1_channelCount} ) `
            + `should be ( 0, 0, 0 ). ( ${testParams} )`
          );
      }

      if ( imageInArraySelected.length != 2 )
        throw Error( `Block_Reference.TestCorrectnessInfo.prepareBy(): `
          + `imageInArraySelected.length ( ${imageInArraySelected.length} ) should be 2. ( ${testParams} )` );

      // Prepare channel shuffler.
      const outputGroupCount = 2; // Only use two convolution groups.
      let concatenatedDepth;
      switch ( nConvBlockTypeId ) {
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD: // (2)
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY: // (3)
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL: // (4)
          concatenatedDepth = pointwise20ChannelCount * outputGroupCount;
          break;

          // Because Block_TestParams.generate_Filters_Biases() will double pointwise20ChannelCount, it must be an even number
          // which could be splitted (into two groups).
          //
          // Note: pointwise20ChannelCount is always positive (never zero or negative).
          //
          concatenatedDepth = pointwise20ChannelCount;
          break;
      }

      if ( concatenatedDepth == undefined ) {
        channelShuffler_ConcatPointwiseConv = null;

      } else {
        channelShuffler_ConcatPointwiseConv = channelShufflerBag.getChannelShuffler_by(
          imageIn1.height, imageIn1.width, concatenatedDepth, outputGroupCount );

        if( !(   ( channelShuffler_ConcatPointwiseConv.concatenatedShape[ 0 ] == imageIn1.height )
              && ( channelShuffler_ConcatPointwiseConv.concatenatedShape[ 1 ] == imageIn1.width )
              && ( channelShuffler_ConcatPointwiseConv.concatenatedShape[ 2 ] == concatenatedDepth ) ) )
          throw Error( `Block_Reference.TestCorrectnessInfo.prepareBy(): `
            + `ChannelShuffler concatenatedShape ( ${channelShuffler_ConcatPointwiseConv.concatenatedShape[ 0 ]}, `
            + `${channelShuffler_ConcatPointwiseConv.concatenatedShape[ 1 ]}, `
            + `${channelShuffler_ConcatPointwiseConv.concatenatedShape[ 2 ]} ) `
            + `should be the same as input image1's ( height, width, concatenatedDepth ) = ( `
            + `${imageIn1.height}, ${imageIn1.width}, ${concatenatedDepth} ). `
            + `( ${testParams} )` );

        if ( channelShuffler_ConcatPointwiseConv.outputGroupCount != outputGroupCount )
          throw Error( `Block_Reference.TestCorrectnessInfo.prepareBy(): `
            + `ChannelShuffler outputGroupCount ( ${channelShuffler_ConcatPointwiseConv.outputGroupCount} ) `
            + `should be the same as image outputGroupCount ( ${outputGroupCount} ). ( ${testParams} )` );

        channelShuffler_concatenatedShape = channelShuffler_ConcatPointwiseConv.concatenatedShape;
        channelShuffler_outputGroupCount = channelShuffler_ConcatPointwiseConv.outputGroupCount;
      }

    }

    imageOutReferenceArray.fill( undefined );
    outputTensor3dArray.fill( undefined );
    inputTensor3dArray.fill( undefined );

    inputTensor3dArray[ 0 ] = imageSourceBag.getTensor3d_by( input0_height, input0_width, input0_channelCount );
    if ( bTwoInputs ) { // Pass two input tensors according to parameters.
      inputTensor3dArray[ 1 ] = imageSourceBag.getTensor3d_by(
        input0_height, input0_width, input1_channelCount,
        depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );
    }

    let inputTensorDestroyCount; // How many input tensors will be destroyed by Block.apply().
    if ( bKeepInputTensor ) {
      inputTensorDestroyCount = 0; // Since keep-input, no input tensors will be destroyed.

    } else {
      inputTensor3dArray[ 0 ] = inputTensor3dArray[ 0 ].clone(); // Clone for being destroyed. 
      inputTensorDestroyCount = 1; // Since no keep-input, the input tensor destroyed count will be the same as input tensor count.

      if ( bTwoInputs ) { // Pass two input tensors according to parameters.
        inputTensor3dArray[ 1 ] = inputTensor3dArray[ 1 ].clone();
        inputTensorDestroyCount = 2; // Since no keep-input, the input tensor destroyed count will be the same as input tensor count.
      }
    }

    this.input1_channelCount = input1_channelCount;
    this.channelShuffler_ConcatPointwiseConv = channelShuffler_ConcatPointwiseConv;
    this.inputTensorDestroyCount = inputTensorDestroyCount;
  }

}


/**
 * Reference computation of class Block.Base.
 */
class Base extends Recyclable.Root {

  /**
   * Used as default Block_Reference.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Block_Reference.Base.Pool", Base, Base.setAsConstructor );

  /**
   *
   */
  constructor() {
    super();
    Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.channelShufflerBag = ChannelShuffler.Bag.Pool.get_or_create_by( ChannelShuffler.ShuffleInfo.Pool );

    // For reducing memory allocation.
    this.testCorrectnessInfo = TestCorrectnessInfo.Pool.get_or_create_by();
    this.imageInArray_Fake = Recyclable.Array.Pool.get_or_create_by( 2 );
    this.asserter_Equal = TensorTools.Asserter_Equal.Pool.get_or_create_by( 0.4, 0.001 );

    this.imageNeedDisposeUniqueStack = Recyclable.OwnerUniqueStack.Pool.get_or_create_by();
  }

  /** @override */
  disposeResources() {
    this.imageNeedDisposeUniqueStack?.disposeResources_and_recycleToPool();
    this.imageNeedDisposeUniqueStack= null;

    this.asserter_Equal?.disposeResources_and_recycleToPool();
    this.asserter_Equal = null;

    this.imageInArray_Fake?.disposeResources_and_recycleToPool();
    this.imageInArray_Fake = null;

    this.testCorrectnessInfo?.disposeResources_and_recycleToPool();
    this.testCorrectnessInfo = null;

    this.channelShufflerBag?.disposeResources_and_recycleToPool();
    this.channelShufflerBag = null;

    super.disposeResources();
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {ImageSourceBag.Base} imageSourceBag
   *   The provider of image and tensor of variable specification for testing.
   *
   * @param {Block_TestParams.Base} testParams
   *   The test parameters. It is the value of Block_TestParams.Base.ParamsGenerator()'s result.
   *
   * @param {ChannelShuffler.Bag} channelShufflerBag
   *   The channelShufflers provider. It must be initialized with ChannelShuffler.ConcatPointwiseConv as parameter channelShufflerClass.
   *
   *     - It is only used when:
   *         - ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD (2) )
   *         - ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY (3) )
   *         - ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL (4) )
   *
   */
  testCorrectness( imageSourceBag, testParams, channelShufflerBag ) {
    this.testParams = testParams;

//!!! (2022/06/10 Remarked) Moved to outter jsPerf_Block to also catch testParamsGenerator's exception.
//    try {
    {
      this.testCorrectnessInfo.prepareBy( imageSourceBag, testParams, channelShufflerBag );

//!!! (2022/07/05 Temp Remarked) For debug whether memory leak.
//       if (   ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) // (5)
//           || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) // (6 or 7)
//          ) {
//         // Because these conv-block-type will generate pass-through filters, Pool.All.issuedCount will not be the same.
//         // So here does not check that.
//         Base.testCorrectness_internal.call( this );
//
//       } else
      {
        Pool_Asserter.assert_Pool_issuedCount_same_after_as_before( "Block_Reference.Base.testCorrectness_internal()",
          Base.testCorrectness_internal, this );
      }

//!!! (2022/06/10 Remarked) Moved to outter jsPerf_Block to also catch testParamsGenerator's exception.
//     } catch ( e ) {
//       let backendName = tf.getBackend();
//       let msg = `Block_Reference.js: testCorrectness(): backendName=${backendName}, `
//         + `Block, (yieldCount == ${testParams.yieldCount}), testParams.id == ${testParams.id}`;
//
//       console.log( msg );
//       alert( `${msg}\n${e}` );
//
//       throw e;
    }
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {Block_Reference.Base} this
   *   The reference Block object for testing.
   */
  static testCorrectness_internal() {
    let testParams = this.testParams;

    let {
      imageInArraySelected, imageOutReferenceArray, outputTensor3dArray,
    } = this.testCorrectnessInfo;

    {
      this.calcResult( imageInArraySelected, imageOutReferenceArray ); // Output is an array with two elements.

      //!!! (2022/07/05 Temp Added) For debug whether memory leak.
      // When     ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) // (5)
      //       || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) // (6 or 7)
      {
        testParams.Depthwise_PassThrough_FiltersArray_BiasesArray_Bag.disposeResources();
        testParams.Pointwise_PassThrough_FiltersArray_BiasesArray_Bag.disposeResources();
      }

      if ( imageOutReferenceArray.length != 2 )
        throw Error(
          `Block_Reference.testCorrectness(): imageOutReferenceArray.length ( ${imageOutReferenceArray.length} ) should be 2. `
          + `( ${testParams} )`
        );
    }

    Pool_Asserter.assert_Pool_issuedCount_same_after_as_before( "Block_Reference.Base.block_create_apply_internal()",
      Base.block_create_apply_internal, this );

    tf.dispose( outputTensor3dArray );

    for ( let i = 0; i < imageOutReferenceArray.length; ++i ) { // Release output reference images.
      if ( imageOutReferenceArray[ i ] ) {
        imageOutReferenceArray[ i ].disposeResources_and_recycleToPool();
        imageOutReferenceArray[ i ] = null;
      }
    }
  }

  /**
   * @param {Block_Reference.Base} this
   *   The referenece object to do the calculate.
   *
   */
  static block_create_apply_internal() {
    let testParams = this.testParams;

    let {
      imageInArraySelected, imageOutReferenceArray, inputTensor3dArray, outputTensor3dArray,
      input1_channelCount, channelShuffler_ConcatPointwiseConv, inputTensorDestroyCount,
    } = this.testCorrectnessInfo;

    let memoryInfo_beforeCreate = tf.memory(); // Test memory leakage of block create/dispose.

//!!! ...unfinished... (2022/07/14) Create input TensorPlaceholder.

//     Block.Params.set_inputTensorCount_input1_height_width_channelCount_depthwise_inferenced_by.call( ???,
//       input0_height, input0_width, input0_channelCount,
//       nConvBlockTypeId,
//       pointwise1ChannelCount,
//       depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
//       depthwiseActivationId,
//       pointwise20ChannelCount,
//       nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
//     );

//     Block.Params.set_pointwise1_nHigherHalfDifferent_modify_pointwise1ChannelCount_pointwise1Bias_pointwise1ActivationId_by.call( ???,
//       input0_channelCount,
//       nConvBlockTypeId,
//       pointwise1ChannelCount
//     );

//     Block.Params.set_input0_input1_TensorPlaceholder.call( ???,
//       inputTensorCount,
//       input0_height, input0_width, input0_channelCount, inputScaleBoundsArray0,
//       input1_height, input1_width, input1_channelCount, inputScaleBoundsArray1,
//       pointwise1_inputChannelCount_lowerHalf, pointwise1_inputChannelCount_higherHalf,
//     );

    let block = Base.block_create( testParams,
      imageInArraySelected[ 0 ].boundsArraySet.output0,
      imageInArraySelected[ 1 ]?.boundsArraySet.output0,
      channelShuffler_ConcatPointwiseConv );

    // Note: Do not generate parameters description string in advance every time.
    //       Just generate them only if necessary by .toString() for reducing memory re-allocation.

    // Test input channel count.
    Base.AssertTwoEqualValues( "inChannels1", block.inChannels1, input1_channelCount, block );

    // The difference tensor count will be the generated tensor count (i.e. outputTensorCount) minus destroyed input
    // tensor count (i.e. inputTensorDestroyCount).
    let tensorNumDifference_apply_before_after = block.outputTensorCount - inputTensorDestroyCount;

    let memoryInfo_apply_before = tf.memory(); // Test memory leakage of block apply.
    block.apply( inputTensor3dArray, outputTensor3dArray );
    let memoryInfo_apply_after = tf.memory();

    if ( memoryInfo_apply_after.numTensors != ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) )
      throw Error( `Block.apply() memory leak. `
        + `result tensor count ( ${memoryInfo_apply_after.numTensors} ) `
        + `should be ( ${ ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) } ) `
        + `${block}` );

    if ( inputTensor3dArray.length != 2 )
      throw Error( `Block inputTensor3dArray.length ( ${inputTensor3dArray.length} ) should be 2. ${block}` );

    if ( outputTensor3dArray.length != 2 )
      throw Error( `Block outputTensor3dArray.length ( ${outputTensor3dArray.length} ) should be 2. ${block}` );

    { // Test output channel count.
      const CHANNEL_AXIS_ID = 2; // Axis id 2 is depth (i.e. channel) dimension.
      let outChannels0 = 0, outChannels1 = 0;

      if ( outputTensor3dArray[ 0 ] && ( outputTensor3dArray[ 0 ].shape.length > CHANNEL_AXIS_ID ) )
        outChannels0 = outputTensor3dArray[ 0 ].shape[ CHANNEL_AXIS_ID ];

      if ( outputTensor3dArray[ 1 ] && ( outputTensor3dArray[ 1 ].shape.length > CHANNEL_AXIS_ID ) )
        outChannels1 = outputTensor3dArray[ 1 ].shape[ CHANNEL_AXIS_ID ];

      let outChannelsAll = outChannels0 + outChannels1;

      Base.AssertTwoEqualValues( "outChannels0", block.outChannels0, outChannels0, block );
      Base.AssertTwoEqualValues( "outChannels1", block.outChannels1, outChannels1, block );
      Base.AssertTwoEqualValues( "outChannelsAll", block.outChannelsAll, outChannelsAll, block );
    }

    { // Test output tensor count.
      let outputTensorCount = 0;

      if ( outputTensor3dArray[ 0 ] )
        ++outputTensorCount;

      if ( outputTensor3dArray[ 1 ] )
        ++outputTensorCount;

      Base.AssertTwoEqualValues( "outputTensorCount", block.outputTensorCount, outputTensorCount, block );
    }

    // Test correctness of block BoundsArraySet.
    this.assert_imageOut_BoundsArraySet( block, imageOutReferenceArray, block );

    // Test correctness of block apply.
    this.assert_imageOut_Tensors_byNumberArrays( outputTensor3dArray, imageOutReferenceArray, block );

    block.disposeResources_and_recycleToPool();
    block = null;

    let memoryInfo_afterDispose = tf.memory();

    if ( memoryInfo_afterDispose.numTensors != ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) )
      throw Error( `Block create/dispose memory leak. `
        + `result tensor count (${memoryInfo_afterDispose.numTensors}) `
        + `should be (${ ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) } `
        + `${block}` );
  }

  /**
   * Check the Block's output's BoundsArraySet.
   *
   * @param {Block.Base} block                           The block to be checked.
   * @param {NumberImage.Base[]} imageOutReferenceArray  Refernece output Image data of the Block_Reference's calcResult().
   */
  assert_imageOut_BoundsArraySet( block, imageOutReferenceArray, parametersDescription ) {
    BoundsArraySet_Asserter.assert_ScaleBoundsArray_output0_output1( this.asserter_Equal,
      block.output0?.scaleBoundsArray, block.output1?.scaleBoundsArray, imageOutReferenceArray, `Block`, parametersDescription );
  }

  /**
   * Check the Block's output according to input (for correctness testing).
   *
   * @param {tf.tensor3d[]} outputTensors                The output array of the Block's apply_and_destroy_or_keep().
   * @param {NumberImage.Base[]} imageOutReferenceArray  Refernece output Image data of the Block_Reference's calcResult().
   */
  assert_imageOut_Tensors_byNumberArrays( outputTensors, imageOutReferenceArray, parametersDescription ) {
    let outputArrayRef;
    for ( let i = 0; i < imageOutReferenceArray.length; ++i ) {

      let imageOutReference = imageOutReferenceArray[ i ];
      if ( imageOutReference ) {
        outputArrayRef = imageOutReference.dataArray; // Get referenced result (as number array).
      } else {
        outputArrayRef = null;
      }

      let outputTensor = outputTensors[ i ];          // Get real (tested target) result (as typed-array).

      this.asserter_Equal.assert_Tensor_NumberArray(
        outputTensor, outputArrayRef,
        "Block", `output${i}`, `outputRef${i}`, parametersDescription
      );
    }
  }

  /**
   * @param {Block_TestParams.Base} testParams
   *   The test parameters. It is the value of Block_TestParams.Base.ParamsGenerator()'s result.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
   *   The element value bounds (per channel) of input0. Usually, it is The .output0 of the previous Block value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray1
   *   The element value bounds (per channel) of input1. Usually, it is The .output1 of the previous Block value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @return {Block.Base} The created block object.
   */
  static block_create(
    testParams, inputScaleBoundsArray0, inputScaleBoundsArray1, channelShuffler_ConcatPointwiseConv
  ) {

    let block = Block.Base.Pool.get_or_create_by();

    let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

    let bInitOk;
    {
      let extractedParams = Block.Params.Pool.get_or_create_by(
        testParams.in.input0_height, testParams.in.input0_width, testParams.in.input0_channelCount,
        testParams.in.nConvBlockTypeId,
        testParams.in.pointwise1ChannelCount,
        testParams.in.depthwise_AvgMax_Or_ChannelMultiplier, testParams.in.depthwiseFilterHeight, testParams.in.depthwiseFilterWidth,
        testParams.in.depthwiseStridesPad, testParams.in.depthwiseActivationId,
        testParams.in.pointwise20ChannelCount, testParams.in.pointwise20ActivationId,
        testParams.in.nSqueezeExcitationChannelCountDivisor, testParams.in.bSqueezeExcitationPrefix,
        testParams.in.nActivationId,
        testParams.in.bKeepInputTensor
      );

      bInitOk = block.init( progress, testParams.in.inputWeightArray, testParams.in.weightElementOffsetBegin, extractedParams,
        inputScaleBoundsArray0, inputScaleBoundsArray1,
        channelShuffler_ConcatPointwiseConv );
    }

    let inferencedParams = testParams.out.inferencedParams;

    // Initialize successfully or failed.
    if ( !bInitOk ) { //!!! For Debug.
      console.log( "testParams =", testParams );
      debugger;
    }

    // Note: Do not generate parameters description string in advance every time.
    //       Just generate them only if necessary by .toString() for reducing memory re-allocation.

    if ( block.bInitOk != bInitOk )
      throw Error( `Block validation state (${block.bInitOk}) mismatches initer's result (${bInitOk}). ${block}` );

    if ( false == bInitOk )
      throw Error( `Failed to initialize block object. ${block}` );

    if ( 100 != progress.valuePercentage )
      throw Error(
        `Progress (${progress.valuePercentage}) should be 100 when initializing block object successfully. ${block}`);

    progress.disposeResources_and_recycleToPool();
    progress = null;

    if ( block.weightElementOffsetEnd != testParams.in.inputWeightArray.length ) { //!!! For Debug. (parsing ending position)
      debugger;
    }

    let asserter = ObjectPropertyAsserter.Base.Pool.get_or_create_by( `Block`, block, block );

    Base.AssertTwoEqualValues( "parsing beginning position",
      block.weightElementOffsetBegin, testParams.in.weightElementOffsetBegin, block );

    Base.AssertTwoEqualValues( "parsing ending position",
      block.weightElementOffsetEnd, testParams.in.inputWeightArray.length, block );

    // Linearity
    let bNoSqueezeExcitation_between_depthwise_and_pointwise2;
    let bLinear_between_pointwise1_and_depthwise;
    let bLinear_between_pointwise1_and_pointwise2;
    let bLinear_between_depthwise_and_pointwise2;
    {
      bNoSqueezeExcitation_between_depthwise_and_pointwise2 = (
           ( testParams.out.nSqueezeExcitationChannelCountDivisor == ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) // (-2)
        || ( testParams.out.bSqueezeExcitationPrefix == false )
      );

      // Determine bLinear_between_depthwise_and_pointwise2
      if ( testParams.out.depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE )
        bLinear_between_depthwise_and_pointwise2 = bNoSqueezeExcitation_between_depthwise_and_pointwise2;
      else
        bLinear_between_depthwise_and_pointwise2 = (
             ( testParams.out.depthwiseActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) // depthwise has no activation function.
          && ( bNoSqueezeExcitation_between_depthwise_and_pointwise2 ) // no squeeze-and-excitation between depthwise and pointwise2.
        );

      // Determine bLinear_between_pointwise1_and_depthwise
      {
        if ( testParams.out.pointwise1ChannelCount <= 0 )
          bLinear_between_pointwise1_and_depthwise = true;
        else
          bLinear_between_pointwise1_and_depthwise =
            ( testParams.out.inferencedParams.pointwise1ActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE );
      }

      // Determine bLinear_between_pointwise1_and_pointwise2
      {
        if ( bLinear_between_pointwise1_and_depthwise ) {
          if ( testParams.out.inferencedParams.bDepthwiseRequestedAndNeeded ) {
            if ( testParams.out.inferencedParams.depthwisePadInfo.stridesPadInfo.pad_isValid() ) {
              bLinear_between_pointwise1_and_pointwise2 = true;
            } else {
              bLinear_between_pointwise1_and_pointwise2 = false;
            }
          } else {
            if ( bLinear_between_depthwise_and_pointwise2 ) {
              bLinear_between_pointwise1_and_pointwise2 = true;
            } else {
              bLinear_between_pointwise1_and_pointwise2 = false;
            }
          }
        } else {
          bLinear_between_pointwise1_and_pointwise2 = false;
        }

        //asserter.propertyValue( "???bLinear_between_depthwise_and_pointwise2", bLinear_between_depthwise_and_pointwise2 );
        //asserter.propertyValue( "???bLinear_between_pointwise1_and_depthwise", bLinear_between_pointwise1_and_depthwise );
        //asserter.propertyValue( "???bLinear_between_pointwise1_and_pointwise2", bLinear_between_pointwise1_and_pointwise2 );
      }
    }

    let bDepthwiseRequestedAndNeeded;
    {
      if ( testParams.out.depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) {
        bDepthwiseRequestedAndNeeded = false;

      } else {
        let stridesPadInfo = ValueDesc.StridesPad.Singleton.getInfoById( testParams.out.depthwiseStridesPad );

        let bChannelCountSame = Depthwise.PadInfoCalculatorRoot.output_channelCount_is_same_as_input(
          testParams.out.depthwise_AvgMax_Or_ChannelMultiplier );

        let bHeightWidthSame = Depthwise.PadInfoCalculatorRoot.output_height_width_is_same_as_input(
          testParams.out.input0_height, testParams.out.input0_width,
          testParams.out.depthwise_AvgMax_Or_ChannelMultiplier, testParams.out.depthwiseFilterHeight, testParams.out.depthwiseFilterWidth,
          stridesPadInfo );

        let bNoNeighborAnalysis = Depthwise.PadInfoCalculatorRoot.output_height_width_is_no_neighbor_analysis(
          testParams.out.input0_height, testParams.out.input0_width,
          testParams.out.depthwise_AvgMax_Or_ChannelMultiplier, testParams.out.depthwiseFilterHeight, testParams.out.depthwiseFilterWidth );

        if (   ( bChannelCountSame )
            && ( bHeightWidthSame )
            && ( bNoNeighborAnalysis )
            && ( bLinear_between_depthwise_and_pointwise2 )
           )
          bDepthwiseRequestedAndNeeded = false;
        else
          bDepthwiseRequestedAndNeeded = true;
      }
    }

    // input tensor parameters.
    asserter.propertyValue( "input0_height", testParams.out.input0_height );
    asserter.propertyValue( "input0_width", testParams.out.input0_width );
    asserter.propertyValue( "inChannels0", testParams.out.input0_channelCount );
    asserter.propertyValue( "nConvBlockId", testParams.out.nConvBlockId );

//!!! ...unfinished... (2022/06/16) input1_height, input1_width, input1_channelCount

    asserter.propertyValue( "inputTensorCount", inferencedParams.inputTensorCount );
    asserter.propertyValue( "outputTensorCount", inferencedParams.outputTensorCount );
    asserter.propertyValue( "bDepthwiseRequestedAndNeeded", bDepthwiseRequestedAndNeeded );
    asserter.propertyValue( "bDepthwise2Requested", inferencedParams.bDepthwise2Requested );
    asserter.propertyValue( "bConcat1Requested", inferencedParams.bConcat1Requested );
    asserter.propertyValue( "bAddInputToOutputRequested", inferencedParams.bAddInputToOutputRequested );
    asserter.propertyValue( "bConcat2ShuffleSplitRequested", inferencedParams.bConcat2ShuffleSplitRequested );
    asserter.propertyValue( "bHigherHalfDifferent", inferencedParams.bHigherHalfDifferent );
    asserter.propertyValue( "bHigherHalfDepthwise2", inferencedParams.bHigherHalfDepthwise2 );
    asserter.propertyValue( "channelShuffler_outputGroupCount", inferencedParams.channelShuffler_outputGroupCount );

    // The ( block.bConcat2ShuffleSplitRequested == true ) only if ShuffleNetV2.
    if ( block.bConcat2ShuffleSplitRequested ) {
      let bShuffleNetV2 =
           ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD ) // (2)
        || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY ) // (3)
        || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL ) // (4)
      ;
      asserter.propertyValue( "bConcat2ShuffleSplitRequested", bShuffleNetV2 );
    }

    // The channelShuffler must not null in these cases.
    if (   ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD ) // (2)
        || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY ) // (3)
        || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL ) // (4)
       ) {

      if ( channelShuffler_ConcatPointwiseConv == null )
        throw Error( `Block_Reference.Base.block_create(): `
          + `channelShuffler must NOT null when `
          + `nConvBlockTypeId=`
          + `${ValueDesc.ConvBlockType.Singleton.getStringOf( testParams.out.nConvBlockTypeId )}`
          + `(${testParams.out.nConvBlockTypeId}) `
          + `${block}`
      );

      asserter.propertyValue( "channelShuffler_ConcatPointwiseConv", channelShuffler_ConcatPointwiseConv );

    } else {
      asserter.propertyValue( "channelShuffler_ConcatPointwiseConv", null );
    }

    // pointwise1 parameters.

    let pointwise1Bias_shouldBe;
    let pointwise1ActivationId_shouldBe;
    {
      if ( testParams.out.pointwise1ChannelCount > 0 ) {
        if ( bLinear_between_pointwise1_and_pointwise2 )
          pointwise1Bias_shouldBe = false;
        else
          pointwise1Bias_shouldBe = true;

        pointwise1ActivationId_shouldBe = testParams.out.nActivationId;

      } else {
        pointwise1Bias_shouldBe = false;
        pointwise1ActivationId_shouldBe = ValueDesc.ActivationFunction.Singleton.Ids.NONE;
      }
    }

    let pointwise1ActivationName_shouldBe = ValueDesc.ActivationFunction.Singleton.getStringOf( pointwise1ActivationId_shouldBe );
    let depthwise_AvgMax_Or_ChannelMultiplier_shouldBe = testParams.out.depthwise_AvgMax_Or_ChannelMultiplier;
      
    // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD (5) )
    //
    if ( ( block.bHigherHalfDifferent == true ) && ( block.bHigherHalfDepthwise2 == true ) ) {

      // In this case (i.e. bHigherHalfCopyLowerHalf), enlarge pointwise1 to ( pointwise1_channel_count + input_channel_count )
      // so that depthwise1 could include depthwise2.
      //
      if ( testParams.out.pointwise1ChannelCount > 0 ) {
        let pointwise1ChannelCount = ( testParams.out.pointwise1ChannelCount + testParams.out.input0_channelCount );
        asserter.propertyValue( "pointwise1ChannelCount", pointwise1ChannelCount );

      // However, if ( pointwise1ChannelCount == 0 ), Pointwise.Base can not handle ( pointwise1ChannelCount == 0 ) because
      // ( inputChannelCount < outputChannelCount == pointwise1ChannelCount == 0 ) is not possible. It will be wrongly recognized
      // as ( inputChannelCount >= outputChannelCount == pointwise1ChannelCount == 0 ).
      //
      // It should be adjusted forcibly so that ( inputChannelCount < outputChannelCount == pointwise1ChannelCount ) and always
      // no biases. Not only bHigherHalfCopyLowerHalf, but also bLowerHalfPassThrough. (i.e. bHigherHalfCopyLowerHalf_LowerHalfPassThrough)
      //
      } else { // ( 0 == testParams.out.pointwise1ChannelCount )


//!!! (2022/07/13 Remarked) Does not work.
//         if (   ( bDepthwiseRequestedAndNeeded )
//             && ( testParams.out.depthwise_AvgMax_Or_ChannelMultiplier == 1 ) ) { // Use depthwise to double channels.
//
//           depthwise_AvgMax_Or_ChannelMultiplier_shouldBe = 2;
//
//         } else { // Use pointwise1 to double channels.

          let pointwise1ChannelCount = ( testParams.out.input0_channelCount * 2 ); // As doubled input channel count.
          asserter.propertyValue( "pointwise1ChannelCount", pointwise1ChannelCount );

          pointwise1Bias_shouldBe = false;
          pointwise1ActivationId_shouldBe = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

//!!! (2022/07/13 Remarked) Does not work.
//        }
      }

    } else {
      asserter.propertyValue( "pointwise1ChannelCount", testParams.out.pointwise1ChannelCount );
    }

    asserter.propertyValue( "pointwise1Bias", testParams.out.inferencedParams.pointwise1Bias );
    asserter.propertyValue( "pointwise1Bias", pointwise1Bias_shouldBe );
    asserter.propertyValue( "pointwise1ActivationId", pointwise1ActivationId_shouldBe );
    asserter.propertyValue( "pointwise1ActivationName", pointwise1ActivationName_shouldBe );

    // depthwise parameters.

    let depthwiseBias_shouldBe;
    {
      if ( testParams.out.depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) {
        depthwiseBias_shouldBe = false;
      } else {
        if ( bLinear_between_depthwise_and_pointwise2 )
          depthwiseBias_shouldBe = false;
        else
          depthwiseBias_shouldBe = true;
      }
    }

    asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", depthwise_AvgMax_Or_ChannelMultiplier_shouldBe );
    asserter.propertyValue( "depthwiseFilterHeight", testParams.out.depthwiseFilterHeight );
    asserter.propertyValue( "depthwiseFilterWidth", testParams.out.depthwiseFilterWidth );
    asserter.propertyValue( "depthwiseStridesPad", testParams.out.depthwiseStridesPad );
    asserter.propertyValue( "depthwiseBias", testParams.out.inferencedParams.depthwiseBias );
    asserter.propertyValue( "depthwiseBias", depthwiseBias_shouldBe );
    asserter.propertyValue( "bDepthwiseRequestedAndNeeded", bDepthwiseRequestedAndNeeded );
    asserter.propertyValue( "depthwiseActivationId", testParams.out.depthwiseActivationId );

    let depthwiseActivationName = ValueDesc.ActivationFunction.Singleton.getStringOf( testParams.out.depthwiseActivationId );
    asserter.propertyValue( "depthwiseActivationName", depthwiseActivationName );

    // pointwise20 parameters.
    asserter.propertyValue( "pointwise20ChannelCount", testParams.out.pointwise20ChannelCount );
    asserter.propertyValue( "pointwise20Bias", testParams.out.inferencedParams.pointwise20Bias );
    asserter.propertyValue( "pointwise20Bias", true ); // pointwise2 should always has bias.
    asserter.propertyValue( "pointwise20ActivationId", testParams.out.pointwise20ActivationId );

    let pointwise20ActivationName = ValueDesc.ActivationFunction.Singleton.getStringOf( testParams.out.pointwise20ActivationId );
    asserter.propertyValue( "pointwise20ActivationName", pointwise20ActivationName );

    // pointwise21 parameters.

    { // Test pointwise21ChannelCount.

      if (   ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD ) // (2)
          || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2 ) // (8)
          || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD ) // (9)
          || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY ) // (10)
         ) {
        asserter.propertyValue( "pointwise21ChannelCount", testParams.out.pointwise20ChannelCount ); // the same as pointwise20.

      } else { // Otherwise, should be 0.
        asserter.propertyValue( "pointwise21ChannelCount", 0 );
      }
    }

    asserter.propertyValue( "pointwise21Bias", testParams.out.inferencedParams.pointwise20Bias ); // Always same as pointwise20.
    asserter.propertyValue( "pointwise21ActivationId", testParams.out.pointwise20ActivationId ); // Always same as pointwise20.
    asserter.propertyValue( "pointwise21ActivationName", pointwise20ActivationName ); // Always same as pointwise20.

    // squeeze-and-excitation parameters.
    asserter.propertyValue( "nSqueezeExcitationChannelCountDivisor", testParams.out.nSqueezeExcitationChannelCountDivisor );
    asserter.propertyValue( "bSqueezeExcitationPrefix", testParams.out.bSqueezeExcitationPrefix );

    let squeezeExcitationActivationId_shouldBe = testParams.out.nActivationId;
    let squeezeExcitationActivationName_shouldBe
      = ValueDesc.ActivationFunction.Singleton.getStringOf( squeezeExcitationActivationId_shouldBe );

    asserter.propertyValue( "squeezeExcitationActivationId", squeezeExcitationActivationId_shouldBe );
    asserter.propertyValue( "squeezeExcitationActivationName", squeezeExcitationActivationName_shouldBe );

    // Default activation
    asserter.propertyValue( "nActivationId", testParams.out.nActivationId );

    let nActivationName = ValueDesc.ActivationFunction.Singleton.getStringOf( testParams.out.nActivationId );
    asserter.propertyValue( "nActivationName", nActivationName );

    // If depthwise does not exist, the output ( height, width ) should be the same as input.

    if ( !bDepthwiseRequestedAndNeeded ) {
      asserter.propertyValue( "outputHeight", testParams.out.input0_height );
      asserter.propertyValue( "outputWidth", testParams.out.input0_width );

    // Otherwise, depthwise determines output ( height, width ).
    } else {
      let depthwisePadInfo = inferencedParams.depthwisePadInfo;
      asserter.propertyValue( "outputHeight", depthwisePadInfo.outputHeight );
      asserter.propertyValue( "outputWidth", depthwisePadInfo.outputWidth );
    }

    // Other parameters.
    asserter.propertyValue( "bKeepInputTensor", testParams.out.bKeepInputTensor );

    {
      let tensorWeightCountTotal = 0;  // Not include channel shuffler.
      let operationArray = block.operationArray.operationArray;
      for ( let i = 0; i < operationArray.length; ++i ) {
        let operation = operationArray[ i ];
        if ( operation.filtersTensor4d )
           tensorWeightCountTotal += operation.filtersTensor4d.size;
        if ( operation.biasesTensor3d )
           tensorWeightCountTotal += operation.biasesTensor3d.size;
      }
      asserter.propertyValue( "tensorWeightCountTotal", tensorWeightCountTotal );

      // Exclude parameters weights, all the others should be the extracted weight count.
      //
      // (2022/07/04) Because Params will be release by Block.init(), it can not be used here. Use first operation which has beginning
      // position instead.
      //
      //let Params_weightElementOffsetEnd = extractedParams.weightElementOffsetEnd;
      let Params_weightElementOffsetEnd;
      for ( let i = 0; i < block.operationArray.operationArray.length; ++i ) {
        let operation = block.operationArray.operationArray[ i ];
        if ( operation.weightElementOffsetBegin != undefined ) {
          Params_weightElementOffsetEnd = operation.weightElementOffsetBegin;
          break;
        }
      }

      let tensorWeightCountExtracted = ( testParams.in.inputWeightArray.length - Params_weightElementOffsetEnd );

      asserter.propertyValue( "tensorWeightCountExtracted", tensorWeightCountExtracted );
      asserter.propertyValueLE( "tensorWeightCountExtracted", tensorWeightCountTotal );
    }

    asserter.disposeResources_and_recycleToPool();
    asserter = null;

    return block;
  }

  /**
   * @param {Object} parametersDesc  Its .toString() for debug message of this block.
   */
  static AssertTwoEqualValues( valueName, value1, value2, parametersDesc ) {
    if ( value1 != value2 )
      throw Error( `Block ${valueName} (${value1}) should be (${value2}). ${parametersDesc}` );
  }

  /** According to imageInArray and this.testParams.in.paramsNumberArrayObject, calculate imageOutArray.
   *
   * @param {Block_Reference.Base} this
   *   The referenece object to do the calculate.
   *
   * @param {NumberImage.Base[]} imageInArray
   *   The images to be tested.
   *     - imageInArray[ 0 ]: input0
   *     - imageInArray[ 1 ]: input1
   *
   * @param {NumberImage.Base[]} imageOutArray
   *   The images to be returned are placed here.
   *     - imageOutArray[ 0 ]: output0
   *     - imageOutArray[ 1 ]: output1
   *
   * @return {NumberImage.Base[]}
   *   Return imageOutArray.
   */ 
  calcResult( imageInArray, imageOutArray ) {

    let testParams = this.testParams;
    let inferencedParams = testParams.out.inferencedParams;
    let depthwisePadInfo = inferencedParams.depthwisePadInfo;

    // Note: Do not generate parameters description string in advance every time.
    //       Just generate them only if necessary by .toString() for reducing memory re-allocation.
    testParams.out.toString = Base.TestParams_Out_toString; // For Creating description for debug easily.


    // The following two (ValueDesc.ConvBlockType.Singleton.Ids.Xxx) use similar calculation logic:
    //    SHUFFLE_NET_V2_HEAD                    // (2) (ShuffleNetV2's head)
    //    SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD   // (5) (ShuffleNetV2_ByMobileNetV1's head)
    //
    // The following two (ValueDesc.ConvBlockType.Singleton.Ids.Xxx) use similar calculation logic:
    //    SHUFFLE_NET_V2_BODY                    // (3) (ShuffleNetV2's body)
    //    SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY   // (6) (ShuffleNetV2_ByMobileNetV1's body)
    //
    // The following two (ValueDesc.ConvBlockType.Singleton.Ids.Xxx) use similar calculation logic:
    //    SHUFFLE_NET_V2_TAIL                    // (4) (ShuffleNetV2's tail)
    //    SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL   // (7) (ShuffleNetV2_ByMobileNetV1's tail)

    // Collect images which may be necessary to be disposed in every computation operation.
    this.imageNeedDisposeUniqueStack.clear();

    let imageIn0, imageIn1;

    // 0.

    let pointwise1ChannelCount = testParams.out.pointwise1ChannelCount;
    let pointwise20ChannelCount;

    // Note: Block_TestParams.Base.generate_Filters_Biases() double pointwise20ChannelCount. So, halve them here.
    //
    if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)
      pointwise20ChannelCount = Math.ceil( testParams.out.pointwise20ChannelCount / 2 );

      imageIn0 = imageInArray[ 0 ];
      imageIn1 = imageInArray[ 1 ];

    // The imageInArray[ 0 ] should be splitted into imageIn0 and imageIn1, because we:
    //   - use the logic of SHUFFLE_NET_V2_BODY (3) to handle SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY (6)
    //   - use the logic of SHUFFLE_NET_V2_TAIL (4) to handle SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL (7)
    //
    // Note: Block_TestParams.Base.generate_Filters_Biases() double input0_channelCount,
    //       pointwise20ChannelCount. So, halve them here.
    //
    } else if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) { // (6 or 7)

      NumberImage.Base.calcSplitAlongAxisId2(
        imageInArray[ 0 ], this.imageInArray_Fake, testParams.out, "Split_imageIn_to_imageInArray_0_1" );

      imageIn0 = this.imageInArray_Fake[ 0 ];
      imageIn1 = this.imageInArray_Fake[ 1 ];

      if ( pointwise1ChannelCount <= 0 ) {
        // When no pointwise1, just keep it all-pass-through.

      } else { // Otherwise, only the lower half should be processed by pointwise1 convolution.
        let pointwise1_higherHalfPassThrough = Block.ChannelCountCalculator.HigherHalfPassThrough.Pool.get_or_create_by(
          testParams.out.input0_channelCount, testParams.out.pointwise1ChannelCount );

        pointwise1ChannelCount = pointwise1_higherHalfPassThrough.outputChannelCount_lowerHalf;

        pointwise1_higherHalfPassThrough.disposeResources_and_recycleToPool();
        pointwise1_higherHalfPassThrough = null;
      }

      pointwise20ChannelCount = Math.ceil( testParams.out.pointwise20ChannelCount / 2 );

    } else {
      imageIn0 = imageInArray[ 0 ];
      imageIn1 = imageInArray[ 1 ];
      pointwise20ChannelCount = testParams.out.pointwise20ChannelCount;
    }

    // 1. Pointwise1
    let imageIn0_beforePointwise1 = imageIn0;
    let imageIn1_beforePointwise1 = imageIn1;
    let pointwise1Result;
    if ( pointwise1ChannelCount > 0 ) {
      pointwise1Result = testParams.use_pointwise1(
        imageIn0, pointwise1ChannelCount, this.imageNeedDisposeUniqueStack, "Pointwise1", testParams.out );

      if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)
        imageIn1 = testParams.use_pointwise1_PassThrough( imageIn0_beforePointwise1, // copy input0 (not input1).
          imageIn0_beforePointwise1.depth,
          this.imageNeedDisposeUniqueStack, "Pointwise1_imageIn1_HigherHalfCopyLowerHalf_imageIn0", testParams.out );

      } else if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) { // (6 or 7)
        imageIn1 = testParams.use_pointwise1_PassThrough( imageIn1_beforePointwise1, // pass-through input1 (not input0).
          imageIn1_beforePointwise1.depth, // No need same as pointwise1ChannelCount because depthwise2 and pointwise21 just pass-through it.
          this.imageNeedDisposeUniqueStack, "Pointwise1_imageIn1_HigherHalfPassThrough", testParams.out );
      }

    } else {
      pointwise1Result = imageIn0;

      if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)

        if ( imageIn1 != null )
          throw Error( `Block_Reference.Base.calcResult(): `
            + `imageIn1 must be null when `
            + `nConvBlockTypeId=`
            + `${ValueDesc.ConvBlockType.Singleton.getStringOf( testParams.out.nConvBlockTypeId )}`
            + `(${testParams.out.nConvBlockTypeId}). `
            + `${testParams.out}` );

        imageIn1 = imageIn0; // Not input1 but input0.
      }
    }

    // 2. Depthwise

    // 2.1 Depthwise1
    let imageIn1_beforeDepthwise1 = imageIn1;
    let depthwise1Result;

    if ( testParams.out.inferencedParams.bDepthwiseRequestedAndNeeded ) {
      depthwise1Result = testParams.use_depthwise1( pointwise1Result, this.imageNeedDisposeUniqueStack, "Depthwise1", testParams.out );

      // imageIn1 should be shrinked by depthwise1. Otherwise, its size may be different from pointwise20Result
      // and can not be concatenated together.
      //
      if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) { // (6 or 7)
        imageIn1 = testParams.use_depthwise1_PassThrough( imageIn1_beforeDepthwise1, // pass-through input1 (not input0).
          this.imageNeedDisposeUniqueStack, "Depthwise1_imageIn1_HigherHalfPassThrough", testParams.out );
      }

    } else {
      depthwise1Result = pointwise1Result;
    }

    // 2.2 Depthwise2
    let depthwise2Result;

    if (   ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_HEAD() ) // (2)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD() ) // (9)
       ) {

      if ( testParams.out.inferencedParams.bDepthwiseRequestedAndNeeded ) {
        depthwise2Result = testParams.use_depthwise2(
          imageIn0, this.imageNeedDisposeUniqueStack, "Depthwise2_for_input0", testParams.out ); // depthwise2 apply to input0 (not input1).
      } else {
        depthwise2Result = imageIn0; // Since depthwise2 is just no-op, its result is just the same as its input (i.e. input0 (not input1)).
      }

    } else if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)

      if ( testParams.out.inferencedParams.bDepthwiseRequestedAndNeeded ) {

        // depthwise2 apply to input1 which higher-half-copy-lower-half from input0 (not original input0, not original input1).
        depthwise2Result = testParams.use_depthwise2( imageIn1, this.imageNeedDisposeUniqueStack, "Depthwise2_for_input1", testParams.out );

      } else {
        depthwise2Result = imageIn1; // Since depthwise2 is just no-op, its result is just the same as its input.
      }
    }

    // 3. Concat1 (along image depth)
    let concat1Result = depthwise1Result; // If no concat1, the same as depthwise1.

    if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD() ) { // (9)

      // Concatenate depthwise1's result and depthwise2's result.
      concat1Result = NumberImage.Base.calcConcatAlongAxisId2(
        depthwise1Result, depthwise2Result,
        testParams.out, "Concat1_depthwise1_depthwise2 (SHUFFLE_NET_V2_BY_POINTWISE21_HEAD)" );
      this.imageNeedDisposeUniqueStack.push( depthwise1Result, depthwise2Result );

    } else if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_BODY_or_TAIL() ) { // (10 or 11)

      // Concatenate depthwise1's result and input1.
      concat1Result = NumberImage.Base.calcConcatAlongAxisId2( depthwise1Result, imageIn1,
        testParams.out, "Concat1_depthwise1_input1 (SHUFFLE_NET_V2_BY_POINTWISE21_BODY_or_TAIL)" );
      this.imageNeedDisposeUniqueStack.push( depthwise1Result, imageIn1 );
    }

    // 4. Pointwise2

    // 4.0

    // 4.0.1 add-input-to-output is possible if same ( height, width ).
    let bAddInputToOutputRequested = false;
    if ( testParams.nConvBlockTypeId__is__MOBILE_NET_V2_BODY_TAIL() ) { // (1)
      if (   ( inferencedParams.bDepthwiseRequestedAndNeeded == false )  // Either no depthwise (so output is same ( height, width )).
          || ( depthwisePadInfo.output_height_width_is_same_as_input() ) // Or has depthwise and output is same ( height, width ).
         ) { 
        bAddInputToOutputRequested = true;
      }
    }

    // 4.0.2
    imageOutArray.length = 2;
    imageOutArray[ 0 ] = null;
    imageOutArray[ 1 ] = null;

    // 4.1 Pointwise20
    let imageIn1_beforePointwise20 = imageIn1;

    let pointwise20Result, pointwise202Result;
    {
      if ( pointwise20ChannelCount > 0 ) {
        pointwise20Result = imageOutArray[ 0 ] = testParams.use_pointwise20(
          concat1Result, pointwise20ChannelCount, this.imageNeedDisposeUniqueStack, "Pointwise20", testParams.out );

        if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)
          pointwise202Result = imageOutArray[ 1 ] = testParams.use_pointwise202(
            depthwise2Result, pointwise20ChannelCount, this.imageNeedDisposeUniqueStack, "Pointwise202", testParams.out );

        } else if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) { // (6 or 7)
          imageIn1 = imageOutArray[ 1 ] = testParams.use_pointwise20_PassThrough(
            imageIn1_beforePointwise20, // pass-through input1 (which is past-through by depthwise1).
            pointwise20ChannelCount, // So that it could be concatenated with pointwise20Result.
            this.imageNeedDisposeUniqueStack, "Pointwise20_imageIn1_HigherHalfPassThrough", testParams.out );
        }

      } else {
        pointwise20Result = imageOutArray[ 0 ] = concat1Result;
      }

      // Residual Connection.
      if ( bAddInputToOutputRequested )
        if ( pointwise20Result.depth == testParams.out.input0_channelCount ) { // add-input-to-output is possible if same channel count.
          let pointwise20ResultOld = pointwise20Result;
          pointwise20Result = imageOutArray[ 0 ] = pointwise20ResultOld.clone_byAdd(
            imageIn0, testParams.out, "Pointwise20_AddInputToOutput" );
          this.imageNeedDisposeUniqueStack.push( pointwise20ResultOld );
        }
    }

    // 4.2 Pointwise21

    let pointwise21Result;
    if (   ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_HEAD() ) // (2)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2() ) // (8)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD() ) // (9)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_BODY() )  // (10)
       ) {

      let pointwise21ChannelCount = pointwise20ChannelCount;

      let pointwise21_input;
      switch ( testParams.out.nConvBlockTypeId ) {
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD: // (2)
          pointwise21_input = depthwise2Result; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2: // (8)
          pointwise21_input = depthwise1Result; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD: // (9)
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY: // (10)
          pointwise21_input = concat1Result; break;
      }

      pointwise21Result = imageOutArray[ 1 ] = testParams.use_pointwise21(
        pointwise21_input, pointwise21ChannelCount, this.imageNeedDisposeUniqueStack, "Pointwise21", testParams.out );

      // Residual Connection.
      //
      // Always using input0 (i.e. imageInArray[ 0 ]). In fact, only if ( inputTensorCount <= 1 ), the residual connection is possible.
      if ( bAddInputToOutputRequested )
        if ( pointwise21Result.depth == testParams.out.input0_channelCount ) { // add-input-to-output is possible if same channel count.
          let pointwise21ResultOld = pointwise21Result;
          pointwise21Result = imageOutArray[ 1 ] = pointwise21ResultOld.clone_byAdd(
            imageIn0, testParams.out, "Pointwise21_AddInputToOutput" );
          this.imageNeedDisposeUniqueStack.push( pointwise21ResultOld );
        }

    } else if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BODY_or_TAIL() ) { // (3 or 4)
      imageOutArray[ 1 ] = imageIn1;
    }

    // 5. Concat2 (along image depth), shuffle, split.
    let concat2Name;

    if (   ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_HEAD() ) // (2)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BODY_or_TAIL() ) // (3 or 4)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) // (5)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) // (6 or 7)
       ) {  

      let bShuffle, bSplit;
      switch ( testParams.out.nConvBlockTypeId ) {
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD:                       // (2)
          concat2Name = "Concat2_pointwise20_pointwise21_ShuffleSplit";  bShuffle =  true; bSplit =  true; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY:                       // (3)
          concat2Name = "Concat2_pointwise20_input1_ShuffleSplit";       bShuffle =  true; bSplit =  true; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL:                       // (4)
          concat2Name = "Concat2_pointwise20_input1";                    bShuffle = false; bSplit = false; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD:      // (5)
          concat2Name = "Concat2_pointwise20_pointwise202_Shuffle";      bShuffle =  true; bSplit = false; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY:      // (6)
          concat2Name = "Concat2_pointwise20_input0_HigherHalf_Shuffle"; bShuffle =  true; bSplit = false; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL:      // (7)
          concat2Name = "Concat2_pointwise20_input0_HigherHalf";         bShuffle = false; bSplit = false; break;
        default:
          throw Error( `Block_Reference.Base.calcResult(): `
            + `Concat2ShuffleSplit: Unsupported `
            + `nConvBlockTypeId=`
            + `${ValueDesc.ConvBlockType.Singleton.getStringOf( testParams.out.nConvBlockTypeId )}`
            + `(${testParams.out.nConvBlockTypeId}). `
            + `${testParams.out}` );
          break;
      }

      if ( !imageOutArray[ 1 ] )
        throw Error( `Block_Reference.Base.calcResult(): `
          + `Concat2ShuffleSplit: imageOutArray[ 1 ] ( ${imageOutArray[ 1 ]} ) `
            + `should not be null. ${testParams.out}` );

      // Because the following operation uses the input array as output array, collect before the operation. Otherwise,
      // they will be lost to be disposed.
      this.imageNeedDisposeUniqueStack.push( ...imageOutArray );

      NumberImage.Base.calcConcatShuffleSplit(
        imageOutArray, imageOutArray, bShuffle, bSplit,
        testParams.out, concat2Name );
    }

    { // Release all intermediate images.
      for ( let i = 0; i < this.imageNeedDisposeUniqueStack.array.length; ++i ) { 
        let imageNeedDispose = this.imageNeedDisposeUniqueStack.array[ i ];
        if (   ( imageNeedDispose == imageInArray[ 0 ] ) || ( imageNeedDispose == imageInArray[ 1 ] )
            || ( imageNeedDispose == imageOutArray[ 0 ] ) || ( imageNeedDispose == imageOutArray[ 1 ] )
           ) {
          this.imageNeedDisposeUniqueStack.array[ i ] = null; // So that input/output images of this method will not be disposed.
        }
      }
      this.imageNeedDisposeUniqueStack.clear();
    }

    return imageOutArray;
  }

  /**
   * @param {Block_TestParams.out} this
   *   The testParams.outfor creating description.
   *
   * @return {string}
   *   The description of this.
   */
  static TestParams_Out_toString() {

    let inferencedParams = this.inferencedParams;

    let paramsOutDescription =
        `inputTensorCount=${inferencedParams.inputTensorCount}, `

      + `input0_height=${this.input0_height}, input0_width=${this.input0_width}, `
      + `inChannels0=${this.input0_channelCount}, `

      + `input1_height=${inferencedParams.input1_height}, input1_width=${inferencedParams.input1_width}, `
      + `inChannels1=${inferencedParams.input1_channelCount}, `

      + `nConvBlockTypeName=`
      + `${ValueDesc.ConvBlockType.Singleton.getStringOf( this.nConvBlockTypeId )}`
      + `(${this.nConvBlockTypeId}), `

      + `bHigherHalfDifferent=${inferencedParams.bHigherHalfDifferent}, `
      + `bHigherHalfDepthwise2=${inferencedParams.bHigherHalfDepthwise2}, `

      + `pointwise1ChannelCount=${this.inferencedParams.pointwise1ChannelCount}, `
      + `pointwise1Bias=${this.inferencedParams.pointwise1Bias}, `
      + `pointwise1ActivationName=`
        + `${ValueDesc.ActivationFunction.Singleton.getStringOf( inferencedParams.pointwise1ActivationId )}`
        + `(${inferencedParams.pointwise1ActivationId}), `

      + `bDepthwiseRequestedAndNeeded=${inferencedParams.bDepthwiseRequestedAndNeeded}, `
      + `bDepthwise2Requested=${inferencedParams.bDepthwise2Requested}, `

      + `depthwise_AvgMax_Or_ChannelMultiplier=`
        + `${ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.getStringOf( this.depthwise_AvgMax_Or_ChannelMultiplier )}`
        + `(${this.depthwise_AvgMax_Or_ChannelMultiplier}), `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, depthwiseFilterWidth=${this.depthwiseFilterWidth}, `
      + `depthwiseStridesPad=`
        + `${ValueDesc.StridesPad.Singleton.getStringOf( this.depthwiseStridesPad )}`
        + `(${this.depthwiseStridesPad}), `
      + `depthwiseBias=${this.inferencedParams.depthwiseBias}, `
      + `depthwiseActivationName=`
        + `${Block.Params.depthwiseActivationId.getStringOfValue( this.depthwiseActivationId )}`
        + `(${this.depthwiseActivationId}), `

      + `bConcat1Requested=${inferencedParams.bConcat1Requested}, `

      + `pointwise20ChannelCount=${this.pointwise20ChannelCount}, `
      + `pointwise20Bias=${this.inferencedParams.pointwise20Bias}, `
      + `pointwise20ActivationName=`
        + `${Block.Params.pointwise20ActivationId.getStringOfValue( this.pointwise20ActivationId )}`
        + `(${this.pointwise20ActivationId}), `

      + `nSqueezeExcitationChannelCountDivisorName=`
        + `${ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.getStringOf( this.nSqueezeExcitationChannelCountDivisor )}`
        + `(${this.nSqueezeExcitationChannelCountDivisor}), `

      + `squeezeExcitationActivationName=`
        + `${ValueDesc.ActivationFunction.Singleton.getStringOf( this.inferencedParams.squeezeExcitationActivationId )}`
        + `(${this.inferencedParams.squeezeExcitationActivationId}), `

      + `bAddInputToOutputRequested=${inferencedParams.bAddInputToOutputRequested}, `
      + `bConcat2ShuffleSplitRequested=${inferencedParams.bConcat2ShuffleSplitRequested}, `
      + `pointwise20_channelShuffler_outputGroupCount=${inferencedParams.pointwise20_channelShuffler_outputGroupCount}, `
      + `outputTensorCount=${inferencedParams.outputTensorCount}, `

      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;

    return paramsOutDescription;
  }

}
