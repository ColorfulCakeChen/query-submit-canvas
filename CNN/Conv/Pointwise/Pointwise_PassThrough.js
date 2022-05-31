export { PassThrough_FiltersArray_BiasesArray };
export { PassThrough_FiltersArray_BiasesArray_Bag };
export { PassThrough };
export { AllZeros };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as TwoTensors from "../../util/TwoTensors.js";
import * as MultiLayerMap from "../../util/MultiLayerMap.js";

/**
 * A pointwise convolution and bias which just pass the input to output.
 *
 * It is usually used in the inferenced higher half channels of the output channel (for achieving ShuffleNetV2_ByMopbileNetV1).
 *
 * Note: Although depthwise (and pointwise) convolution could be past-through, the activation function will destroy the past-through
 * result. Using Pointwise_FiltersArray_BiasesArray may be better to handle this issue.
 *
 *
 * @member {number} inputChannelCount
 *   The channel count of input.
 *
 * @member {number} outputChannelCount
 *   The channel count of output.
 *
 * @member {number} inputChannelIndexStart
 *   The channel count index (included) to start to be copied to the output.
 *
 * @member {boolean} bBias
 *   Whether generate biases (although all zeros).
 *
 * @member {number} filterValue
 *   The value used as the pass-through pointwise convolution filter. Default is 1. If there will be no activation function after this
 * pass-through operation, value 1 is enough. However, if there wiil be an activation function, this past-through result might be
 * destroyed by the activation function. In order to alleviate this issue, a non-one filter value should be used. For example, if
 * every input value's range is [ 0,255 ] and RELU6 will be used as activation function, using 0.015625 (= 1 / 64 ) as filterValue is
 * appropriate because input values will be shrinked from [ 0, 255 ] into [ 0, 3.984375 ] which will still be kept linear by RELU6.
 *
 * @member {number} biasValue
 *   The value used as the pass-through bias (used only if ( bBias == true ) ). Default is 0. If there will be no activation function
 * after this pass-through operation, value 0 is enough. However, if there wiil be an activation function, this past-through result
 * might be destroyed by the activation function. In order to alleviate this issue, a non-zero bias value should be used. For example,
 * if every input value's range is [ -2, +2 ] and RELU6 will be used as activation function, using +2 as biasValue is appropriate
 * because input values will be shifted from [ -2, +2 ] into [ 0, 4 ] which will still be kept linear by RELU6.
 *
 * @member {number[]} filtersShape
 *   The shape of the pass-through filters array.
 *
 * @member {number[]} biasesShape
 *   The shape of the pass-through biases array.
 *
 * @member {number[]} filtersArray
 *   The pass-through filters array.
 *
 * @member {number[]} biasesArray
 *   The pass-through biases array.
 */
let PassThrough_FiltersArray_BiasesArray = ( ParentClass = Object ) => class extends ParentClass {

  /**
   */
  constructor( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue = 1, biasValue = 0 ) {
    super();
    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.inputChannelIndexStart = inputChannelIndexStart;
    this.bBias = bBias;
    this.filterValue = filterValue;
    this.biasValue = biasValue;

    if ( inputChannelCount <= 0 )
      throw `Pointwise.PassThrough.constructor(): inputChannelCount ( ${inputChannelCount} ) must be positive integer.`;

    if ( outputChannelCount <= 0 )
      throw `Pointwise.PassThrough.constructor(): outputChannelCount ( ${outputChannelCount} ) must be positive integer.`;

    // Restrict beginIndex between [ 0, inputChannelCount ).
    let beginIndexMax = ( inputChannelCount - 1 );
    let beginIndex = Math.max( 0, Math.min( inputChannelIndexStart, beginIndexMax ) );

    // Restrict endIndex between [ 0, inputChannelIndexStart + outputChannelCount ].
    //
    // Note: endIndexMax and endIndex need not be minus one, because they are not inclusive.
    let endIndexMax = inputChannelCount;
    let endIndex = Math.max( 0, Math.min( inputChannelIndexStart + outputChannelCount, endIndexMax ) );

    let extractedCount = endIndex - beginIndex; // So many channels will be past-through from input to output.
    let zerosCount = outputChannelCount - extractedCount; // The output channels which no extracted values could be used will be filled by zeros.


    this.filtersShape = [ 1, 1, inputChannelCount, outputChannelCount ];
    this.filtersArray = new Array( inputChannelCount * outputChannelCount );
    this.filtersArray.fill( 0 );

    for ( let i = 0; i < extractedCount; ++i ) {
      let inChannel = beginIndex + i;
      let outChannel = i;

      let filtersIndex = ( inChannel * outputChannelCount ) + outChannel;
      this.filtersArray[ filtersIndex ] = filterValue; // one-hot (or say, non-zero-hot).
    }

    if ( this.bBias ) {
      this.biasesShape =  [ 1, 1, outputChannelCount ];
      this.biasesArray = new Array( outputChannelCount );
      this.biasesArray.fill( biasValue, 0, extractedCount ); // non-zero-hot.
      this.biasesArray.fill( 0, extractedCount, outputChannelCount ); // Others are zero.
    }
  }

}


/**
 * A pool for PassThrough_FiltersArray_BiasesArray with various parameters. It could reduce re-creating them of same parameters again
 * and again to improve performance.
 *
 */
class PassThrough_FiltersArray_BiasesArray_Bag extends MultiLayerMap.Base {

  //constructor() {
  //  super();
  //}

  /**
   *
   */
  get_by_PassThroughStyleId( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, nPassThroughStyleId ) {
    const thePassThroughStyleInfo = ValueDesc.PassThroughStyle.Singleton.getInfoById( nPassThroughStyleId );
    return this.get_by_filterValue_biasValue( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias,
      thePassThroughStyleInfo.filterValue, thePassThroughStyleInfo.biasValue );
  }

  /**
   *
   */
  get_by_filterValue_biasValue( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue = 1, biasValue = 0 ) {
    return this.get_or_create_by_arguments1_etc( PassThrough_FiltersArray_BiasesArray_Bag.create_by,
      inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue, biasValue );
  }

  /** */
  static create_by( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue, biasValue ) {
    return new ( PassThrough_FiltersArray_BiasesArray() )(
      inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue, biasValue );
  }

}


/**
 * A pointwise convolution and bias which just pass the input to output.
 *
 * It is usually used in the inferenced higher half channels of the output channel (for achieving ShuffleNetV2_ByMopbileNetV1).
 *
 * @see PassThrough_FiltersArray_BiasesArray
 * @see TwoTensors.filtersTensor4d_biasesTensor3d
 */
class PassThrough extends PassThrough_FiltersArray_BiasesArray( TwoTensors.filtersTensor4d_biasesTensor3d() ) {

  constructor( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue = 1, biasValue = 0 ) {
    super( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue, biasValue );

    this.filtersTensor4d = tf.tensor4d( this.filtersArray, this.filtersShape );

    if ( this.bBias ) {
      this.biasesTensor3d = tf.tensor3d( this.biasesArray, this.biasShape );
    }

    this.bInitOk = true;
  }

}


/**
 * A pointwise convolution and bias which just output zeros.
 *
 * @member {boolean} bInitOk
 *   If true, this object initialized (i.e. constructor()) successfully.
 *
 * @see TwoTensors.filtersTensor4d_biasesTensor3d
 */
class AllZeros extends TwoTensors.filtersTensor4d_biasesTensor3d() {

  /**
   * @param {number}  inputChannelCount      The channel count of input.
   * @param {number}  outputChannelCount     The channel count of output.
   * @param {boolean} bBias                  Whether generate biases (although all zeros).
   */
  constructor( inputChannelCount, outputChannelCount, bBias ) {
    super();
    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.bBias = bBias;

    if ( inputChannelCount <= 0 )
      throw `Pointwise.AllZeros.constructor(): inputChannelCount ( ${inputChannelCount} ) must be positive integer.`;

    if ( outputChannelCount <= 0 )
      throw `Pointwise.AllZeros.constructor(): outputChannelCount ( ${outputChannelCount} ) must be positive integer.`;

    let filtersShape = [ 1, 1, inputChannelCount, outputChannelCount ];
    let biasesShape =  [ 1, 1, outputChannelCount ];

    this.filtersTensor4d = tf.zeros( filtersShape );

    if ( this.bBias ) {
      this.biasesTensor3d = tf.zero( biasesShape );    // Generate bias for just adding zero. (i.e. equals no bias).
    }

    this.bInitOk = true;
  }

}

