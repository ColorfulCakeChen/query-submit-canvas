export { PassThrough_FiltersArray_BiasesArray };
export { PassThrough_FiltersArray_BiasesArray_Root };
export { PassThrough_FiltersArray_BiasesArray_Bag };
export { PassThrough };
export { AllZeros };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
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
let PassThrough_FiltersArray_BiasesArray
  = ( ParentClass = Object ) => class PassThrough_FiltersArray_BiasesArray extends Recyclable.Base( ParentClass ) {

  /**
   * Used as default Pointwise.PassThrough_FiltersArray_BiasesArray provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Pointwise.PassThrough_FiltersArray_BiasesArray.Pool",
    PassThrough_FiltersArray_BiasesArray, PassThrough_FiltersArray_BiasesArray.setAsConstructor );

  /**
   */
  constructor( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue = 1, biasValue = 0 ) {
    super();
    PassThrough_FiltersArray_BiasesArray.setAsConstructor_self.call( this,
      inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue, biasValue );
  }

  /** @override */
  static setAsConstructor( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue = 1, biasValue = 0 ) {
    super.setAsConstructor();
    PassThrough_FiltersArray_BiasesArray.setAsConstructor_self.call( this,
      inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue, biasValue );
    return this;
  }

  /** @override */
  static setAsConstructor_self( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue = 1, biasValue = 0 ) {
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

    this.filtersShape = Recyclable.Array.Pool.get_or_create_by( 4 );
    this.filtersShape[ 0 ] = 1;
    this.filtersShape[ 1 ] = 1;
    this.filtersShape[ 2 ] = inputChannelCount;
    this.filtersShape[ 3 ] = outputChannelCount;

    this.filtersArray = Recyclable.Array.Pool.get_or_create_by( inputChannelCount * outputChannelCount );
    this.filtersArray.fill( 0 );

    for ( let i = 0; i < extractedCount; ++i ) {
      let inChannel = beginIndex + i;
      let outChannel = i;

      let filtersIndex = ( inChannel * outputChannelCount ) + outChannel;
      this.filtersArray[ filtersIndex ] = filterValue; // one-hot (or say, non-zero-hot).
    }

    if ( this.bBias ) {
      this.biasesShape = Recyclable.Array.Pool.get_or_create_by( 3 );
      this.biasesShape[ 0 ] = 1;
      this.biasesShape[ 1 ] = 1;
      this.biasesShape[ 2 ] = outputChannelCount;

      this.biasesArray = Recyclable.Array.Pool.get_or_create_by( outputChannelCount );
      this.biasesArray.fill( biasValue, 0, extractedCount ); // non-zero-hot.
      this.biasesArray.fill( 0, extractedCount, outputChannelCount ); // Others are zero.
    }
  }

  /** @override */
  disposeResources() {
    if ( this.biasesArray ) {
      this.biasesArray.disposeResources_and_recycleToPool();
      this.biasesArray = null;
    }

    if ( this.biasesShape ) {
      this.biasesShape.disposeResources_and_recycleToPool();
      this.biasesShape = null;
    }

    if ( this.filtersArray ) {
      this.filtersArray.disposeResources_and_recycleToPool();
      this.filtersArray = null;
    }

    if ( this.filtersShape ) {
      this.filtersShape.disposeResources_and_recycleToPool();
      this.filtersShape = null;
    }

    super.disposeResources();
  }

}


/**
 * Almost the same as Pointwise.PassThrough_FiltersArray_BiasesArray class except its parent class is fixed to Object. In other words,
 * caller can not specify the parent class of Pointwise.PassThrough_FiltersArray_BiasesArray_Root (so it is named "Root" which can not
 * have parent class).
 */
class PassThrough_FiltersArray_BiasesArray_Root extends PassThrough_FiltersArray_BiasesArray() {
}


/**
 * A pool for PassThrough_FiltersArray_BiasesArray with various parameters. It could reduce re-creating them of same parameters again
 * and again to improve performance.
 *
 */
class PassThrough_FiltersArray_BiasesArray_Bag extends Recyclable.Base( MultiLayerMap.Base ) {

  /**
   * Used as default Pointwise.PassThrough_FiltersArray_BiasesArray_Bag provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Pointwise.PassThrough_FiltersArray_BiasesArray_Bag.Pool",
    PassThrough_FiltersArray_BiasesArray_Bag, PassThrough_FiltersArray_BiasesArray_Bag.setAsConstructor );

  /**
   */
  constructor() {
    super();
    PassThrough_FiltersArray_BiasesArray_Bag.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    PassThrough_FiltersArray_BiasesArray_Bag.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {
    this.clear();
    super.disposeResources();
  }

  /** @override */
  clear() {
    for ( let aPassThrough_FiltersArray_BiasesArray of this.values() ) {
      aPassThrough_FiltersArray_BiasesArray.disposeResources_and_recycleToPool();
    }
    super.clear();
  }

  /**
   *
   */
  get_by_PassThroughStyleId( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, nPassThroughStyleId ) {
    const thePassThroughStyleInfo = ValueDesc.PassThroughStyle.Singleton.getInfo_byId( nPassThroughStyleId );
    return this.get_by_filterValue_biasValue( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias,
      thePassThroughStyleInfo.filterValue, thePassThroughStyleInfo.biasValue );
  }

  /**
   *
   */
  get_by_filterValue_biasValue( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue = 1, biasValue = 0 ) {
    return this.get_or_create_by_arguments1_etc( PassThrough_FiltersArray_BiasesArray_Bag.create_by, this,
      inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue, biasValue );
  }

  /** */
  static create_by( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue, biasValue ) {
    return PassThrough_FiltersArray_BiasesArray_Root.Pool.get_or_create_by(
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

  /**
   * Used as default Pointwise.PassThrough provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Pointwise.PassThrough.Pool", PassThrough, PassThrough.setAsConstructor );

  /**
   */
  constructor( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue = 1, biasValue = 0 ) {
    super( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue, biasValue );
    PassThrough.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue = 1, biasValue = 0 ) {
    super.setAsConstructor( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue, biasValue );
    PassThrough.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.filtersTensor4d = tf.tensor4d( this.filtersArray, this.filtersShape );
    if ( this.bBias ) {
      this.biasesTensor3d = tf.tensor3d( this.biasesArray, this.biasesShape );
    }
    this.bInitOk = true;
  }

  /** @override */
  disposeResources() {
    this.bInitOk = false;
    super.disposeResources(); // Release .filtersTensor4d and biasesTensor3d.
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
class AllZeros extends Recyclable.Base( TwoTensors.filtersTensor4d_biasesTensor3d() ) {

  /**
   * Used as default Pointwise.AllZeros provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Pointwise.AllZeros.Pool", AllZeros, AllZeros.setAsConstructor );

  /**
   * @param {number}  inputChannelCount      The channel count of input.
   * @param {number}  outputChannelCount     The channel count of output.
   * @param {boolean} bBias                  Whether generate biases (although all zeros).
   */
  constructor( inputChannelCount, outputChannelCount, bBias ) {
    super();
    AllZeros.setAsConstructor_self.call( this, inputChannelCount, outputChannelCount, bBias );
  }

  /** @override */
  static setAsConstructor( inputChannelCount, outputChannelCount, bBias ) {
    super.setAsConstructor();
    AllZeros.setAsConstructor_self.call( this, inputChannelCount, outputChannelCount, bBias );
    return this;
  }

  /** @override */
  static setAsConstructor_self( inputChannelCount, outputChannelCount, bBias ) {
    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.bBias = bBias;

    if ( inputChannelCount <= 0 )
      throw `Pointwise.AllZeros.setAsConstructor_self(): inputChannelCount ( ${inputChannelCount} ) must be positive integer.`;

    if ( outputChannelCount <= 0 )
      throw `Pointwise.AllZeros.setAsConstructor_self(): outputChannelCount ( ${outputChannelCount} ) must be positive integer.`;

    let filtersShape;
    let biasesShape;
    try {
      filtersShape = Recyclable.Array.Pool.get_or_create_by( 4 );
      filtersShape[ 0 ] = 1;
      filtersShape[ 1 ] = 1;
      filtersShape[ 2 ] = inputChannelCount;
      filtersShape[ 3 ] = outputChannelCount;

      biasesShape = Recyclable.Array.Pool.get_or_create_by( 3 );
      biasesShape[ 0 ] = 1;
      biasesShape[ 1 ] = 1;
      biasesShape[ 2 ] = outputChannelCount;

      this.filtersTensor4d = tf.zeros( filtersShape );

      if ( this.bBias ) {
        this.biasesTensor3d = tf.zero( biasesShape );    // Generate bias for just adding zero. (i.e. equals no bias).
      }

      this.bInitOk = true;

    } catch ( e ) {
      throw e;

    } finally {
      if ( filtersShape ) {
        filtersShape.disposeResources_and_recycleToPool();
        filtersShape = null;
      }
      if ( biasesShape ) {
        biasesShape.disposeResources_and_recycleToPool();
        biasesShape = null;
      }
    }

  }

  /** @override */
  disposeResources() {
    this.bInitOk = false;
    super.disposeResources(); // Release .filtersTensor4d and biasesTensor3d.
  }

}

