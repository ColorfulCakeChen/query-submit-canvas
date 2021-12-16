export { PassThrough_FiltersArray_BiasesArray, PassThrough, AllZeros };

import * as TwoTensors from "../../util/TwoTensors.js";


//!!! ...unfinished... (2021/12/07)
// Problem: Although depthwise (and pointwise) convolution could be past-through, the activation function will destroy the past-through result.

/**
 * A pointwise convolution and bias which just pass the input to output.
 *
 * It is usually used in the inferenced higher half channels of the output channel (for achieving ShuffleNetV2_ByMopbileNetV1).
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
 *
 * @member {boolean} bInitOk
 *   If true, this object initialized (i.e. constructor()) successfully.
 */
 */
class PassThrough_FiltersArray_BiasesArray {

  /**
   */
  constructor( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue = 1, biasValue = 0 ) {
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

    //!!! (2021/11/23 Remarked) Instead by restricting their value range.
    //
    //if ( inputChannelIndexStart < 0 )
    //  throw `Pointwise.PassThrough.constructor(): inputChannelIndexStart ( ${inputChannelIndexStart} ) can not be negative.`;
    //
    //if ( inputChannelIndexStart >= inputChannelCount )
    //  throw `Pointwise.PassThrough.constructor(): inputChannelIndexStart ( ${inputChannelIndexStart} ) `
    //   + ` must be less than inputChannelCount ( ${inputChannelCount} ).`;

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
    this.biasesShape =  [ 1, 1, outputChannelCount ];

    this.filtersArray = new Array( inputChannelCount * outputChannelCount );
    this.biasesArray = new Array( outputChannelCount );

    this.filtersArray.fill( 0 );
    this.biasesArray.fill( 0 );

    for ( let i = 0; i < extractedCount; ++i ) {
      let inChannel = beginIndex + i;
      let outChannel = i;

      let filtersIndex = ( inChannel * outputChannelCount ) + outChannel;
      this.filtersArray[ filtersIndex ] = filterValue; // one-hot (or say, non-zero-hot).

      this.biasesArray[ outChannel ] = biasValue;
    }

    this.bInitOk = true;
  }

}


/**
 * A pointwise convolution and bias which just pass the input to output.
 *
 * It is usually used in the inferenced higher half channels of the output channel (for achieving ShuffleNetV2_ByMopbileNetV1).
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
 * @member {boolean} bInitOk
 *   If true, this object initialized (i.e. constructor()) successfully.
 */
class PassThrough extends TwoTensors.filtersTensor4d_biasesTensor3d {

//!!! ...unfinished... (2021/12/16) Use PassThrough_FiltersArray_BiasesArray instead.

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

    //!!! (2021/11/23 Remarked) Instead by restricting their value range.
    //
    //if ( inputChannelIndexStart < 0 )
    //  throw `Pointwise.PassThrough.constructor(): inputChannelIndexStart ( ${inputChannelIndexStart} ) can not be negative.`;
    //
    //if ( inputChannelIndexStart >= inputChannelCount )
    //  throw `Pointwise.PassThrough.constructor(): inputChannelIndexStart ( ${inputChannelIndexStart} ) `
    //   + ` must be less than inputChannelCount ( ${inputChannelCount} ).`;

    let filtersShape = [ 1, 1, inputChannelCount, outputChannelCount ];
    let biasesShape =  [ 1, 1, outputChannelCount ];

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

    if ( inputChannelCount <= 1 ) { // Because tf.oneHot() can not accept ( depth == 1 ), handle it separately.
      let oneZerosArray = ( new Array( outputChannelCount ) ).fill( 0 );
//!!! (2021/12/07 Remarked)
//      oneZerosArray[ 0 ] = 1; // Only the first element is one.
      oneZerosArray[ 0 ] = filterValue; // Only the first element is non-zero.
      this.filtersTensor4d = tf.tensor4d( oneZerosArray, filtersShape );

    } else {

      { // These tensors represents input channel indexes.

        let oneHotTransposedTensor2d;
        {
          let oneHotExpandedTensor2d;
          {
            let oneHotScaledTensor2d;
            {
              let oneHotFloat32Tensor2d;
              {
                let oneHotInt32Tensor2d;
                {
                  let int32Tensor1d = tf.range( beginIndex, endIndex, 1, "int32" ); // tf.oneHot() accepts int32. (int32Tensor1d)

                  try {
                    oneHotInt32Tensor2d = int32Tensor1d.oneHot( inputChannelCount );  // tf.oneHot() generates int32. (oneHotInt32Tensor2d)
                  } finally {
                    int32Tensor1d.dispose();
                  }
                }

                try {
                  oneHotFloat32Tensor2d = oneHotInt32Tensor2d.cast( "float32" );    // tf.conv2d() accepts float32. (oneHotFloat32Tensor2d)
                } finally {
                  oneHotInt32Tensor2d.dispose();
                }
              }

              let scaleFactor;
              try {
                scaleFactor = tf.scalar( filterValue );
                oneHotScaledTensor2d = oneHotFloat32Tensor2d.mul( scaleFactor );    // Not just one-hot, but non-zero-hot.
              } finally {
                oneHotFloat32Tensor2d.dispose();
                scaleFactor.dispose();
              }
            }

            if ( zerosCount <= 0 ) { // No need to append zeros.
              oneHotExpandedTensor2d = oneHotScaledTensor2d;
              oneHotScaledTensor2d = null; // So that it will not be disposed now.

            } else { // ( zerosCount > 0 ) Uses zeros for the last several channels.

              try {
                let zerosFloat32Tensor2d = tf.zeros( [ zerosCount, inputChannelCount ] );
                try {
                  oneHotExpandedTensor2d = tf.concat( oneHotScaledTensor2d, zerosFloat32Tensor2d );
                } finally {
                  zerosFloat32Tensor2d.dispose();
                }
              } finally {
                oneHotScaledTensor2d.dispose();
              }
            }
          }

          try {
            oneHotTransposedTensor2d = oneHotExpandedTensor2d.transpose(); // looks like tf.conv2d()'s filter.
          } finally {
            oneHotExpandedTensor2d.dispose();
          }
        }

        // tf.conv2d()'s filter is tensor4d. (oneHotFloat32Tensor4d)
        try {
          this.filtersTensor4d = oneHotTransposedTensor2d.reshape( filtersShape );
        } finally {
          oneHotTransposedTensor2d.dispose();
        }
      }
    }

    // Generate bias for just adding zero. (i.e. equals no bias).
    if ( this.bBias ) {
//!!! (2021/12/07 Remarked)
//      this.biasesTensor3d = tf.zero( biasesShape );
      this.biasesTensor3d = tf.fill( biasesShape, biasValue );
    }

    this.bInitOk = true;
  }

}


/**
 * A pointwise convolution and bias which just output zeros.
 *
 * @member {boolean} bInitOk
 *   If true, this object initialized (i.e. constructor()) successfully.
 */
class AllZeros extends TwoTensors.filtersTensor4d_biasesTensor3d {

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

