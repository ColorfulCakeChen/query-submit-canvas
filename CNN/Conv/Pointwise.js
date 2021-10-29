export { PassThrough, Base };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ReturnOrClone_Activation from "./ReturnOrClone_Activation.js";
import * as ChannelShuffler from "./ChannelShuffler.js";


/**
 * A pointwise convolution and bias which just pass the input to output.
 *
 * It is usually used in the inferenced higher half channels of the output channel (for achieving ShuffleNetV2_ByMopbileNetV1).
 *
 *
 */
class PassThrough {

  /**
   * @param {number} inputChannelCount      The channel count of input.
   * @param {number} outputChannelCount     The channel count of output.
   * @param {number} inputChannelIndexStart The channel count index (included) to start to be copied to the output.
   * @param {number} inputChannelIndexStop  The channel count index (not included) to stop to be copied to the output.
   */
  constructor( inputChannelCount, outputChannelCount, inputChannelIndexStart, inputChannelIndexStop ) {
    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.inputChannelIndexStart = inputChannelIndexStart;
    this.inputChannelIndexStop = inputChannelIndexStop;

    let filtersShape = [ 1, 1, inputChannelCount, outputChannelCount ];
    let biasesShape =  [ 1, 1, outputChannelCount ];

    // Generate pointwise filters for just copying the input (from inputChannelIndexStart to inputChannelIndexStop).
    this.filtersTensor4d = tf.tidy( () =>
      tf.range( inputChannelIndexStart, inputChannelIndexStop, 1, "int32" ) // tf.oneHot() accepts int32. (channelIndexesInt32Tensor1d)
        .oneHot( inputChannelCount )  // tf.oneHot() generates int32. (channelIndexesOneHotInt32Tensor2d)
        .cast( "float32" )            // tf.conv2d() accepts float32. (channelIndexesOneHotFloat32Tensor2d)
        .transpose()                  // looks like tf.conv2d()'s filter. (channelIndexesOneHotFloat32TransposedTensor2d)
        .reshape( filtersShape )      // tf.conv2d()'s filter is tensor4d. (channelIndexesOneHotFloat32Tensor4d)
    );

    // Generate bias for just adding zero. (i.e. equals no bias).
    if ( this.bBias ) {
      this.biasesTensor3d = tf.zero( biasesShape );
    }
  }

  disposeTensors() {
    if ( this.filtersTensor4d ) {
      this.filtersTensor4d.dispose();
      this.filtersTensor4d = null;
    }

    if ( this.biasesTensor3d ) {
      this.biasesTensor3d.dispose();
      this.biasesTensor3d = null;
    }
  }
}


/**
 * Handle pointwise convolution (1x1 conv2d), bias and activation.
 *
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by init().
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by init(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ).
 *
 * @member {boolean} bHigherHalfDifferent
 *   - If false, it is just a normal poitwise convolution.
 *
 *   - If true:
 *
 *     - If ( inputChannelCount < outputChannelCount ), the filters for the output channels between ( inputChannelCount ) and
 *         ( outputChannelCount - 1 ) will just copy the input channels between 0 and ( inputChannelCount - 1 ). (i.e.
 *         bHigherHalfCopyLowerHalf, for pointwise1 of ShuffleNetV2_ByMopbileNetV1's head)
 *
 *     - If ( inputChannelCount >= outputChannelCount ):
 *
 *       - If ( channelShuffler_outputGroupCount < 0 ), the filters for the input channels between 0 and ( Math.ceil( inputChannelCount / 2 ) - 1 )
 *           are pointwise21, between Math.ceil( inputChannelCount / 2 ) and ( inputChannelCount - 1 ) are pointwise22. These
 *           two filters (and biases) will be extracted in sequence, but they will be combined into one larger filters (and biases).
 *           This makes these filters' (and biases') weights are arranged the same as pointwise2 of ShuffleNetV2_ByPointwise22's
 *           head. So that the same filters weights could be used in these two architectures for comparing performance and correctness.
 *           (i.e. bHigherHalfPointwise22, for pointwise2 of ShuffleNetV2_ByMopbileNetV1's head)
 *
 *       - If ( channelShuffler_outputGroupCount == 0 ), the filters for the output channels between Math.ceil( outputChannelCount / 2 )
 *           and ( outputChannelCount - 1 ) will just pass through the input to output. (i.e. bHigherHalfPassThrough, for
 *           pointwise1 of ShuffleNetV2_ByMopbileNetV1's body/tail)
 *
 *       - If ( channelShuffler_outputGroupCount > 0 ), the filters for the output channels between Math.ceil( outputChannelCount / 2 )
 *           and ( outputChannelCount - 1 ) will just pass through the input to output. But they will be arranged just like applying
 *           channel shuffler on the output. (i.e. bHigherHalfPassThroughShuffle, for pointwise2 of ShuffleNetV2_ByMopbileNetV1's
 *           body/tail)
 *

//!!! ...unfinished... (2021/10/28 Remarked) Old
//  *     - If ( inputChannelCount >= outputChannelCount ), the filters for the output channels between Math.ceil( outputChannelCount / 2 )
//  *         and ( outputChannelCount - 1 ) will just pass through the input to output. (i.e. bHigherHalfPassThrough, for
//  *         pointwise1 of ShuffleNetV2_ByMopbileNetV1's body/tail, and pointwise2 of ShuffleNetV2_ByMopbileNetV1's head/body/tail)
 *

 * @member {number} channelShuffler_outputGroupCount
 *   Only if ( bHigherHalfDifferent == true ) and ( inputChannelCount >= outputChannelCount ), it is meaningful. If positive, it will
 * be used to (pre-)shuffle the filters and biases. The total effect will be the same as applying a channel shuffler (without
 * concatenation and splitting) after pointwise convolution. (for pointwise2 of ShuffleNetV2_ByMopbileNetV1's body/tail)
 *
 * @member {boolean} bHigherHalfCopyLowerHalf
 *   If ( bHigherHalfDifferent == true ) and ( inputChannelCount < outputChannelCount ), this will be true.
 *
 * @member {boolean} bHigherHalfPassThrough
 *   If ( bHigherHalfDifferent == true ) and ( inputChannelCount >= outputChannelCount ), this will be true.
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
 *
 * @member {boolean} bExisted
 *   If true, this pointwise convolution exists. The same as this.bPointwise.
 *
 * @member {boolean} bPointwise
 *   If true, this pointwise convolution exists. The same as this.bExisted.
 *
 * @member {boolean} bInitOk
 *   If true, the init() is successful.
 *
 * @member {function} pfnConv
 *   This is a method. It has one parameter inputTensor and return a outputTensor. The inputTensor (tf.tensor3d) represents the image
 * ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d) represents the result.
 * All intermediate tensors will be disposed. The inputTensor may or may not be disposed. In fact, this method calls one of
 * Base.return_input_directly(), Base.keep_input_return_copy(), Conv_and_destroy(), Conv_and_keep() according to the parameters.
 *
 * @member {function} pfnConvBiasActivation
 *   This is a method. It has one parameter inputTensor and return a outputTensor. The inputTensor (tf.tensor3d) represents the image
 * ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d) represents the result.
 * All intermediate tensors will be disposed. The inputTensors may or may not be disposed. In fact, this method calls one of
 * Base.return_input_directly(), Base.keep_input_return_copy(), Conv_and_destroy_or_keep(), ConvBias_and_destroy_or_keep(),
 * ConvActivation_and_destroy_or_keep(), ConvBiasActivation_and_destroy_or_keep() according to the parameters.
 */
class Base extends ReturnOrClone_Activation.Base {

  constructor( inputChannelCount, outputChannelCount, bBias, nActivationId, bHigherHalfDifferent, channelShuffler_outputGroupCount ) {
    super();
    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.bHigherHalfDifferent = bHigherHalfDifferent;
    this.channelShuffler_outputGroupCount = channelShuffler_outputGroupCount;
  }

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputFloat32Array, byteOffsetBegin ) {

    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why not keep filtersWeights and biasesWeights in data members of this?
    // A2: Their underlying ArrayBuffer is inputFloat32Array.buffer. If this.filtersWeights and this.biasesWeights are kept,
    //     the inputFloat32Array.buffer could not be released by memory garbage collector.

    this.disposeTensors();

    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

    Base.Setup_bPointwise_pfn.call( this );

    if ( !this.bPointwise ) {
      this.bInitOk = true;
      return true; // no operation at all.
    }

    if ( this.bHigherHalfDifferent ) { // 1. Normal pointwise convolution and bias.
      this.filtersTensor4d = Base.extractFilters.call( this, inputFloat32Array, this.inputChannelCount, this.outputChannelCount );

      if ( this.bBias ) {
        this.biasesTensor3d = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount );
      }

      this.bInitOk = true;
      return true;
    }

//!!! ...unfinished... (2021/10/28) channelShuffler_outputGroupCount

    let higherHalfPassThrough;

    try {

      if ( this.inputChannelCount < this.outputChannelCount ) { // 2. i.e. bHigherHalfCopyLowerHalf
        this.bHigherHalfCopyLowerHalf = true;

        this.outputChannelCount_lowerHalf
          = this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted
          = this.inputChannelCount; // The lower half filters have the same output channel count as input.

        this.outputChannelCount_higherHalf = this.outputChannelCount - this.inputChannelCount_lowerHalf;

        higherHalfPassThrough = new PaseThrough(
          this.inputChannelCount, this.outputChannelCount_higherHalf,
          0, this.outputChannelCount_higherHalf // Pass through the lower channels to higher channels (i.e. copy them to higher channels).
        );

        {
          let filtersTensor4d_lowerHalf = Base.extractFilters.call( this,
            inputFloat32Array, this.inputChannelCount, this.outputChannelCount_lowerHalf );

          let allFiltersArray = [ filtersTensor4d_lowerHalf, higherHalfPassThrough.filtersTensor4d ];
          this.filtersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. channel axis; axis id 3).
          filtersTensor4d_lowerHalf.dispose();
        }

        if ( this.bBias ) {
          let biasesTensor3d_lowerHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_lowerHalf );

          let allBiasesArray = [ biasesTensor3d_lowerHalf, higherHalfPassThrough.biasesTensor3d ];
          this.biasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).
          biasesTensor3d_lowerHalf.dispose();
        }

      } else { // ( inputChannelCount >= outputChannelCount )

//!!! ...unfinished... (2021/10/29)

        if ( this.channelShuffler_outputGroupCount < 0 ) { // 2. i.e. bHigherHalfPointwise22
          this.bHigherHalfPointwise22 = true;

//!!! ...unfinished... (2021/10/29)

        } else if ( this.channelShuffler_outputGroupCount == 0 ) { // 3. i.e. bHigherHalfPassThrough
          this.bHigherHalfPassThrough = true;

          this.inputChannelCount_lowerHalf = this.outputChannelCount_lowerHalf
            = this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted
            = Math.ceil( this.outputChannelCount / 2 ); // The lower half filters have half the output channel count as input and output.

          this.inputChannelCount_higherHalf = this.outputChannelCount_higherHalf = this.outputChannelCount - this.inputChannelCount_lowerHalf;
          if ( this.outputChannelCount_higherHalf > 0 ) { // 3.1

            higherHalfPassThrough = new PaseThrough(
              this.inputChannelCount, this.outputChannelCount_higherHalf,
              this.outputChannelCount_higherHalf, this.outputChannelCount // Pass through the higher channels.
            );

            {
              // The extracted filters should be expanded to accept a larger input channel count (i.e. this.inputChannelCount,
              // not Math.ceil( this.outputChannelCount / 2 ) ). The extra channel's filters are just zero.
              let filtersTensor4d_lowerHalf_expanded;
              {
                let filtersTensor4d_lowerHalf = Base.extractFilters.call( this,
                  inputFloat32Array, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf );

                let filtersTensor4d_zeros;
                {
                  let zeroShape = filtersTensor4d_lowerHalf.shape.slice(); // Clone filters' shape array.

                  // The second last axis (i.e. inDepth axis; axis id 2) should be just fill the difference between real inputChanneCount
                  // and the extracted filters.
                  zeroShape[ 2 ] = this.inputChannelCount - filtersTensor4d_lowerHalf.shape[ 2 ];

                  filtersTensor4d_zeros = tf.zeros( zeroShape );
                }

                let expandedFiltersArray = [ filtersTensor4d_lowerHalf, filtersTensor4d_zeros ];
                filtersTensor4d_lowerHalf_expanded = tf.concat( expandedFiltersArray, 2 ); // Along the second last axis (i.e. inDepth axis; axis id 2).
                filtersTensor4d_zeros.dispose();
                filtersTensor4d_lowerHalf.dispose();
              }

              let allFiltersArray = [ filtersTensor4d_lowerHalf_expanded, higherHalfPassThrough.filtersTensor4d ];
              this.filtersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. outDepth axis; axis id 3).
              filtersTensor4d_lowerHalf_expanded.dispose();
            }

            if ( this.bBias ) {
              let biasesTensor3d_lowerHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_lowerHalf );

              let allBiasesArray = [ biasesTensor3d_lowerHalf, higherHalfPassThrough.biasesTensor3d ];
              this.biasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).
              biasesTensor3d_lowerHalf.dispose();
            }

          } else { // 3.2 ( outputChannelCount_higherHalf <= 0 )
            // e.g. ( outputChannelCount == 1 ). The lower-half of it will be also 1. The higher-half will be 0.
            // Do nothing, because the lower-half is all.
          }

        } else { // 4. ( channelShuffler_outputGroupCount > 0 ), i.e. bHigherHalfPassThroughShuffle
          this.bHigherHalfPassThroughShuffle = true;

//!!! ...unfinished... (2021/10/29)

        }


//!!! ...unfinished... (2021/10/29)







//!!! ...unfinished... (2021/10/29) Old Codes

//!!! (2021/10/29 Remarked) Old Codes
//       // 1. Determine lower half filters dimension.
//
//       if ( this.bHigherHalfDifferent ) {
//
//         if ( this.inputChannelCount < this.outputChannelCount ) { // 1.1 i.e. bHigherHalfCopyLowerHalf
//           this.bHigherHalfCopyLowerHalf = true;
//           this.inputChannelCount_lowerHalf = this.outputChannelCount_lowerHalf
//             = this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted
//             = this.inputChannelCount; // The lower half filters have the same output channel count as input.
//
//         } else { // 1.2 ( inputChannelCount >= outputChannelCount ), i.e. bHigherHalfPassThrough
//           this.bHigherHalfPassThrough = true;
//           this.inputChannelCount_lowerHalf = this.outputChannelCount_lowerHalf
//             = this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted
//             = Math.ceil( this.outputChannelCount / 2 ); // The lower half filters have half the output channel count as input and output.
//         }
//
//       } else { // 1.3 Normal pointwise convolution. Use specified input and output channel count.
//         this.inputChannelCount_toBeExtracted = this.inputChannelCount;
//         this.outputChannelCount_toBeExtracted = this.outputChannelCount;
//       }
//
//       // 2. Extract lower half filters and biases.
//       if ( !Base.init_by_inputChannelCount_outputChannelCount.call( this,
//               inputFloat32Array, byteOffsetBegin, this.inputChannelCount_toBeExtracted, this.outputChannelCount_toBeExtracted ) ) {
//         this.bInitOk = false;
//         return false; // Initialization failed.
//       }
//
//       if ( !this.bPointwise ) {
//         this.bInitOk = true;
//         return true; // Since there is no pointwise convolution, initialization was done successfully.
//       }
//
      // 3. Generate higher half filters and biases. Combine lower half and higher half.

      if ( this.bHigherHalfCopyLowerHalf ) { // 3.1

//!!! (2021/10/29 Remarked) Old Codes
//         this.inputChannelCount_higherHalf = this.outputChannelCount_higherHalf = this.outputChannelCount - this.inputChannelCount_lowerHalf;
//         higherHalfPassThrough = new PaseThrough(
//           this.inputChannelCount, this.outputChannelCount_higherHalf,
//           0, this.outputChannelCount_higherHalf // Pass through the lower channels to higher channels (i.e. copy them to higher channels).
//         );
//
//         this.tensorWeightCountTotal = 0; // Since the filters and biases will be changed, the total weights count should be re-calculated.
//
//         {
//           let allFiltersArray = [ this.filtersTensor4d, higherHalfPassThrough.filtersTensor4d ];
//           let allFiltersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. channel axis; axis id 3).
//
//           this.filtersTensor4d.dispose();
//           this.filtersTensor4d = allFiltersTensor4d;
//
//           this.tensorWeightCountTotal += tf.util.sizeFromShape( this.filtersTensor4d.shape );
//         }
//
//         if ( this.biasesTensor3d ) {
//           let allBiasesArray = [ this.biasesTensor3d, higherHalfPassThrough.biasesTensor3d ];
//           let allBiasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).
//
//           this.biasesTensor3d.dispose();
//           this.biasesTensor3d = allBiasesTensor3d;
//
//           this.tensorWeightCountTotal += tf.util.sizeFromShape( this.biasesTensor3d.shape );
//         }

      } else if ( this.bHigherHalfPassThrough ) { // 3.2

        this.inputChannelCount_higherHalf = this.outputChannelCount_higherHalf = this.outputChannelCount - this.inputChannelCount_lowerHalf;
        if ( this.outputChannelCount_higherHalf > 0 ) {

          higherHalfPassThrough = new PaseThrough(
            this.inputChannelCount, this.outputChannelCount_higherHalf,
            this.outputChannelCount_higherHalf, this.outputChannelCount // Pass through the higher channels.
          );

          this.tensorWeightCountTotal = 0; // Since the filters and biases will be changed, the total weights count should be re-calculated.

          {
            // The extracted filters should be expanded to accepts a larger input channel count (i.e. this.inputChannelCount,
            // not Math.ceil( this.outputChannelCount / 2 ) ). The extra channel's filters are just zero.
            let expandedFiltersTensor4d;
            {
              let filtersZeroShape = this.filtersTensor4d.shape.slice(); // Clone filters' shape array.

              // The second last axis (i.e. inDepth axis; axis id 2) should be just fill the difference between real inputChanneCount the
              // the extracted filters.
              filtersZeroShape[ 2 ] = this.inputChannelCount - this.filtersTensor4d.shape[ 2 ];

              let filtersZeroTensor4d = tf.zeros( filtersZeroShape );

              let expandedFiltersArray = [ this.filtersTensor4d, filtersZeroTensor4d ];
              expandedFiltersTensor4d = tf.concat( expandedFiltersArray, 2 ); // Along the second last axis (i.e. inDepth axis; axis id 2).

              filtersZeroTensor4d.dispose();
            }

            let allFiltersArray = [ expandedFiltersTensor4d, higherHalfPassThrough.filtersTensor4d ];
            let allFiltersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. outDepth axis; axis id 3).

            this.filtersTensor4d.dispose();
            this.filtersTensor4d = allFiltersTensor4d;

            this.tensorWeightCountTotal += tf.util.sizeFromShape( this.filtersTensor4d.shape );
          }

          if ( this.biasesTensor3d ) {
            let allBiasesArray = [ this.biasesTensor3d, higherHalfPassThrough.biasesTensor3d ];
            let allBiasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).

            this.biasesTensor3d.dispose();
            this.biasesTensor3d = allBiasesTensor3d;

            this.tensorWeightCountTotal += tf.util.sizeFromShape( this.biasesTensor3d.shape );
          }
        }

      } else { // 3.3 Normal pointwise convolution.
        // Nothing needs be combined.
      }

      // 4. Pre-shuffle channels by shuffling the filters and biases.
      if ( this.channelShuffler ) {
        let outputGroupCount = this.channelShuffler.outputGroupCount; // Uses the output group count of the specified channel shuffler.

        { // Shuffle the filters along the last (i.e. channel) axis.
          let filtersChannelShuffler = new ChannelShuffler.ShuffleInfo( this.filtersTensor4d.shape, outputGroupCount );
          let filtersTensor4d_shuffled = filtersChannelShuffler.reshapeTransposeReshape( this.filtersTensor4d );

          this.filtersTensor4d.dispose();
          this.filtersTensor4d = filtersTensor4d_shuffled;
        }

        { // Shuffle the biases along the last (i.e. channel) axis.
          let biasesChannelShuffler = new ChannelShuffler.ShuffleInfo( this.biasesTensor3d.shape, outputGroupCount );
          let biasesTensor3d_shuffled = biasesChannelShuffler.reshapeTransposeReshape( this.biasesTensor3d );

          this.biasesTensor3d.dispose();
          this.biasesTensor3d = biasesTensor3d_shuffled;
        }
      }

    } finally {

      if ( higherHalfPassThrough ) {

        // Include the weights count of the higher-half-pass-through filters and biases.
        this.tensorWeightCountTotal += tf.util.sizeFromShape( higherHalfPassThrough.filtersTensor4d.shape );
        if ( higherHalfPassThrough.biasesTensor3d ) {
          this.tensorWeightCountTotal += tf.util.sizeFromShape( higherHalfPassThrough.biasesTensor3d.shape );
        }

        higherHalfPassThrough.disposeTensors();
      }
    }

    this.bInitOk = true;
    return true;
  }

  disposeTensors() {
    if ( this.filtersTensor4d ) {
      this.filtersTensor4d.dispose();
      this.filtersTensor4d = null;
    }

    if ( this.biasesTensor3d ) {
      this.biasesTensor3d.dispose();
      this.biasesTensor3d = null;
    }

//!!! (2021/10/28 Remarked)
//     if ( this.channelShuffler ) {
//       this.channelShuffler = null; // Do not dispose channel shuffler here. Just set to null.
//     }

    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;

    // (2021/10/27 Remarked) If these properties does not exist, assigning value (even undefined) to them will create them. This is un-wanted.
    //this.bHigherHalfCopyLowerHalf = this.bHigherHalfPointwise22 = this.bHigherHalfPassThrough = this.bHigherHalfPassThroughShuffle
    //  = this.inputChannelCount_lowerHalf = this.outputChannelCount_lowerHalf
    //  = this.inputChannelCount_higherHalf = this.outputChannelCount_higherHalf
    //  = this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted = undefined;

//!!! (2021/10/19 Remarked)
//    this.filtersShape = this.biasesShape
//!!! (2021/10/19 Remarked) So that inputFloat32Array could be released.
//      = this.filtersWeights = this.biasesWeights
    this.pfnConvBiasActivation = this.pfnConv = this.pfnActivation = null;

    this.bPointwise = false;
    this.byteOffsetEnd = -1;
    this.bKeepInputTensor = false;  // Default will dispose input tensor.
    this.bInitOk = false;
  }

  /**
   * Adjust this.pfnConv (and this.pfnConvBiasActivation if need) so that this.pfnConv() and this.pfnConvBiasActivation() will or will not
   * dispose its inputTensor.
   */
  setKeepInputTensor( bKeepInputTensor ) {
    this.bKeepInputTensor = bKeepInputTensor;

    if ( this.bExisted ) {
      if ( bKeepInputTensor ) {
        this.pfnConv = Base.Conv_and_keep;
      } else {
        this.pfnConv = Base.Conv_and_destroy;
      }
    } else {
      // Since there is no operation at all, let pfnConvBiasActivation ignore pfnConv completely.
      if ( bKeepInputTensor ) {
        this.pfnConvBiasActivation = this.pfnConv = Base.keep_input_return_copy;
      } else {
        this.pfnConvBiasActivation = this.pfnConv = Base.return_input_directly;
      }
    }
  }

  get bExisted() {
    return this.bPointwise;
  }

  /**
   * This method uses almost all properties of Pointwise.Base (i.e. this) except inputChannelCount and outputChannelCount.
   * They should be specified by method parameters explicitly. This method will record the result inside this object directly
   * (except this.bInitOk).
   *
   * @param {Base} this
   *   It should be an object of class Pointwise.Base.
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {number} byteOffsetBegin
   *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by this method.
   *
   * @param {number} inputChannelCount
   *   The channel count of the pointwise convolution's input.
   *
   * @param {number} outputChannelCount
   *   The channel count of the pointwise convolution's output.
   *
   * @return {boolean} Return true, if succeeded.
   */
  static init_by_inputChannelCount_outputChannelCount( inputFloat32Array, byteOffsetBegin, inputChannelCount, outputChannelCount ) {

//!!! ...unfinished... (2021/10/29)

    // Q: Why not keep filtersWeights and biasesWeights in data members of this?
    // A: Their underlying ArrayBuffer is inputFloat32Array.buffer. If this.filtersWeights and this.biasesWeights are kept,
    //    the inputFloat32Array.buffer could not be released by memory garbage collector.

    this.disposeTensors();

    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

    Base.Setup_bPointwise_pfn.call( this );

    if ( !this.bPointwise ) {
      return true; // no operation at all.
    }

    //let filterHeightWidth = [ 1, 1 ];
    let filtersShape = [ 1, 1, inputChannelCount, outputChannelCount ];
    let biasesShape =  [ 1, 1, outputChannelCount ];

    let filtersWeights = new Weights.Base( inputFloat32Array, this.byteOffsetEnd, filtersShape );
    if ( !filtersWeights.extract() )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = filtersWeights.defaultByteOffsetEnd;

    this.filtersTensor4d = tf.tensor4d( filtersWeights.weights, filtersShape );

    this.tensorWeightCountTotal // By default, same as extracted weights count.
      = ( this.tensorWeightCountExtracted += tf.util.sizeFromShape( this.filtersTensor4d.shape ) );

    if ( this.bBias ) {
      let biasesWeights = new Weights.Base( inputFloat32Array, this.byteOffsetEnd, biasesShape );
      if ( !biasesWeights.extract() )
        return false;  // e.g. input array does not have enough data.
      this.byteOffsetEnd = biasesWeights.defaultByteOffsetEnd;

      this.biasesTensor3d = tf.tensor3d( biasesWeights.weights, biasesShape );

      this.tensorWeightCountTotal // By default, same as extracted weights count.
        = ( this.tensorWeightCountExtracted += tf.util.sizeFromShape( this.biasesTensor3d.shape ) );
    }

    return true;
  }

  /** Determine this.bPointwiseXxx and this.pfnXxx data members.
   *
   * @param {Base} this
   *   The Base object to be determined and modified.
   */
  static Setup_bPointwise_pfn() {

    this.bPointwise = ( this.outputChannelCount > 0 );
    this.pfnActivation = Base.getActivationFunctionById( this.nActivationId );

    if ( !this.bPointwise ) {
      // Since there is no operation at all, let pfnConvBiasActivation ignore pfnConv completely.
      this.pfnConvBiasActivation = this.pfnConv = Base.return_input_directly;
      return true;
    }

    this.pfnConv = Base.Conv_and_destroy; // will dispose inputTensor.

    if ( this.bBias ) {
      if ( this.pfnActivation )
        this.pfnConvBiasActivation = Base.ConvBiasActivation_and_destroy_or_keep;
      else
        this.pfnConvBiasActivation = Base.ConvBias_and_destroy_or_keep;
    } else {
      if ( this.pfnActivation )
        this.pfnConvBiasActivation = Base.ConvActivation_and_destroy_or_keep;
       else
        this.pfnConvBiasActivation = Base.Conv_and_destroy_or_keep;
    }
  }

  /**
   * Extract pointwise convolution filters from inputFloat32Array (at this.byteOffsetEnd). The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   * @param {number} inputChannelCount        The input channel count of the pointwise convolution filters.
   * @param {number} outputChannelCount       The output channel count of the pointwise convolution filters.
   *
   * @return {tf.tensor4d}                    The extracted depthwise filters. Return null, if failed.
   */
  static extractFilters( inputFloat32Array, inputChannelCount, outputChannelCount ) {
    let filtersShape = [ 1, 1, inputChannelCount, outputChannelCount ];
    return Base.extractTensor.call( inputFloat32Array, filtersShape );
  }

  /** Pointwise Convolution (1x1). (The inputTensor will not be disposed so that it can be used for achieving skip connection.) */
  static Conv_and_keep( inputTensor ) {
    return tf.conv2d( inputTensor, this.filtersTensor4d, 1, "valid" ); // 1x1, Stride = 1
  }

  static Conv_and_destroy( inputTensor ) {
    let t = tf.conv2d( inputTensor, this.filtersTensor4d, 1, "valid" );
    inputTensor.dispose();
    return t;
  }

  /** Pointwise Convolution, Bias and Activation. */
  static Conv_and_destroy_or_keep( inputTensor ) {
    return this.pfnConv( inputTensor );
  }

  static ConvBias_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    return t1;
  }

  static ConvActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = this.pfnActivation( t0 );
    t0.dispose();

    return t1;
  }

  static ConvBiasActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    t0 = this.pfnActivation( t1 );
    t1.dispose();

    return t0;
  }

}
