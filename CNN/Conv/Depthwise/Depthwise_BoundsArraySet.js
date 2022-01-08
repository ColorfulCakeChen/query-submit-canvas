export { BoundsArraySet };

import * as ConvBiasActivation from "../ConvBiasActivation.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import { ChannelPartInfo } from  "./Depthwise_ChannelPartInfo.js";

/**
 * The element value bounds set for depthwise convolution-bias-activation.
 *
 */
class BoundsArraySet extends ConvBiasActivation.BoundsArraySet {

  /**
   */
  constructor( inputChannelCount, outputChannelCount ) {
    super( inputChannelCount, outputChannelCount );
  }


//!!! ...unfinished... (2022/01/07) What about ( bDepthwise == false )?

  /**
   *
   * @param {ConvBiasActivation.BoundsArraySet} previous_ConvBiasActivation_BoundsArraySet
   *   The value bounds set of the previous convolution-bias-activation.
   *
   * @param {Depthwise.ChannelPartInfo[]} inChannelPartInfoArray
   *   The input channel range array which describe lower/higher half channels index range.
   *
   * @param {number} channelMultiplier
   *   The channel multiplier of this depthwise operation.
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) of this depthwise convolution.
   *
   * @param {number[]} filtersArray
   *   The weights of the depthwise convolution. Its content will not be used. Only be tested against null. If ( filtersArray != null ),
   * this is a depthwise convolution. If ( filtersArray == null ), this is an avg/max pooling (i.e. no filters weights).
   *
   * @param {number[]} biasesArray
   *   The weights of the bias. Its content will not be used. Only be tested against null. If ( biasesArray != null ),
   * there is bias operation. If ( biasesArray == null ), there is no bias operation.
   */
  set_all_by_inChannelPartInfoArray(
    previous_ConvBiasActivation_BoundsArraySet, inChannelPartInfoArray, 
    channelMultiplier, nActivationId, filtersArray, biasesArray
  ) {

    // Because they are extracted from Weights which should have been regulated by Weights.Base.ValueBounds.Float32Array_RestrictedClone().
    const filtersValueBounds = Weights.Base.ValueBounds;
    const biasesValueBounds = Weights.Base.ValueBounds;

    let theActivationFunctionInfo = ValueDesc.ActivationFunction.Singleton.getInfoById( nActivationId );

    // 1. Determine .input
    //
    // Note: Even if avg/max pooling, input value bounds is the same as the previous ooutput value bounds
    this.input.set_all_byBoundsArray( previous_ConvBiasActivation_BoundsArraySet.output );

    // ( inChannelPartIndex == 0 ), lower half channels. (or, all channels)
    // ( inChannelPartIndex == 1 ), higher half channels.
    for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
      let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];
      let inChannelBegin = inChannelPartInfo.beginIndex;
      let inChannelEnd = inChannelPartInfo.endIndex;

      let outChannel = inChannelBegin * channelMultiplier;

      for ( let inChannel = inChannelBegin; inChannel < inChannelEnd; ++inChannel ) {

        let undoScale = previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales[ inChannel ];

        // 2. Determine .afterUndoPreviousActivationEscaping
        this.afterUndoPreviousActivationEscaping.set_one_byBoundsArray( inChannel, this.input, inChannel );
        this.afterUndoPreviousActivationEscaping.multiply_one_byN( inChannel, undoScale );

        for ( let outChannelSub = 0; outChannelSub < channelMultiplier; ++outChannelSub, ++outChannel ) {

          // 3. Determine .afterFilter
          this.afterFilter.set_one_byBoundsArray( outChannel, this.afterUndoPreviousActivationEscaping, inChannel );
          if ( filtersArray ) {

            if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
              // Do nothing. The value bounds does not change at all because it is just be past through.

            } else { // Non pass-through half channels.
              this.afterFilter
                .multiply_one_byBounds( outChannel, filtersValueBounds )
                .multiply_one_byN( outChannel, this.filterSize );
            }

          } else { // ( !filtersArray ). No filters array to be extracted. (i.e. avg/max pooling)
            // Do nothing. The value bounds does not change for avg/max pooling.
          }

          // 4. Determine .afterBias
          this.afterBias.set_one_byBoundsArray( outChannel, this.afterFilter, outChannel );
          if ( biasesArray ) {

            if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
              // Do nothing. The value bounds does not change at all because it is just be past through.

            } else { // Non pass-through half channels.
              this.afterBias.add_one_byBounds( outChannel, biasesValueBounds ); // Shift the value bounds by the bias bounds.
            }

          } else { // ( !biasesArray ). No biases array to be extracted.
            // Do nothing. The value bounds does not change since no bias.
          }

          // 6. Determine .afterActivationEscaping
          {
            // 6.1 Determine .activationEscaping_ScaleArraySet
            {
              // 6.1.1 Determine .do

              if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {

                // Since no activation function, no need to escape. (i.e. scale = 1 for no scale)
                this.activationEscaping_ScaleArraySet.do.set_one_byN( outChannel, 1 );

              } else {

                if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.

                  // Calculate the scale for escaping bias result from activation function's non-linear domain into linear domain.
                  //
                  // Note: This does not work for avg/max pooling.
                  this.activationEscaping_ScaleArraySet.do.set_one_by_fromLowerUpper_toLowerUpper( outChannel,
                    this.afterBias.lowers[ outChannel ], this.afterBias.uppers[ outChannel ],
                    theActivationFunctionInfo.inputDomainLinear.lower, theActivationFunctionInfo.inputDomainLinear.upper
                  );

                  let doScale = this.activationEscaping_ScaleArraySet.do.scales[ outChannel ];
                  tf.util.assert( ( Number.isNaN( doScale ) == false ),
                    `Depthwise.FiltersArray_BiasesArray.set_boundsArraySet_by_inChannelPartInfoArray(): `
                      + `this.activationEscaping_ScaleArraySet.do.scales[ ${outChannel} ] ( ${doScale} ) `
                      + `should not be NaN. `
                      + `Please use activation function (e.g. tanh()) which has both negative and positive parts near origin point.`
                  );

                } else { // Non pass-through half channels.
                  // Since non-pass-through, no need to escape. (i.e. scale = 1 for no scale)
                  this.activationEscaping_ScaleArraySet.do.set_one_byN( outChannel, 1 );
                }
              }

              // 6.1.2 Determine .undo (Prepared for the next convolution-bias-activation. Not for this.)
              this.activationEscaping_ScaleArraySet.undo.set_one_byUndo_ScaleArray(
                outChannel, this.activationEscaping_ScaleArraySet.do, outChannel );
            }

            // 6.2 Determine .afterActivationEscaping
            this.afterActivationEscaping
              .set_one_byBoundsArray( outChannel, this.afterBias, outChannel )
              .multiply_one_byNs( outChannel, this.activationEscaping_ScaleArraySet.do.scales, outChannel );
          }

          // 7. Determine .afterActivation
          {
            // If no activation function, the output range is determined by .afterActivationEscaping.
            if ( this.nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
              this.afterActivation.set_one_byBoundsArray( outChannel, this.afterActivationEscaping, outChannel )

            // Otherwise, the activation function dominates the output range.
            } else {
              this.afterActivation.set_one_byBounds( outChannel, theActivationFunctionInfo.outputRange );
            }
          }

        } // outChannelSub, outChannel
      } // inChannel
    } // inChannelPartIndex

  }


//!!! (2022/01/07 Remarked) seems not used. because should be channel by channel.
//
// //!!! ...unfinished... (2021/12/27) should become BoundsArray_byChannelIndex.
//
//   /**
//    *
//    * @param {ConvBiasActivation.BoundsArraySet} previous_ConvBiasActivation_BoundsArraySet
//    *   The previous convolution-bias-activation value bounds set of this depthwise convolution.   
//    *
//    * @param {boolean} bDepthwise
//    *   If true, the depthwise convolution (with/without bias, with/without activation) exists. 
//    *
//    * @param {number} filterHeight
//    *   The filter height of the depthwise convolution. 
//    *
//    * @param {number} filterWidth
//    *   The filter width of the depthwise convolution. 
//    *
//    * @param {boolean} bBias
//    *   If true, the bias operation exists. 
//    *
//    * @param {number} nActivationId
//    *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the bias operation.
//    */
//    set_by( previous_ConvBiasActivation_BoundsArraySet, bDepthwise, filterHeight, filterWidth, bBias, nActivationId ) {
//
//     // 0. Default as BoundsArraySet.output of previous convolution-bias-activation.
//     this.reset_byBounds( previous_ConvBiasActivation_BoundsArraySet.output );
//
//     // 1. No operation at all.
//     if ( !bDepthwise )
//       return;
//
//     // 2. Before activation function.
//     {
//       // Because they are extracted from Weights which should have been regulated by Weights.Base.ValueBounds.Float32Array_RestrictedClone().
//       const filtersValueBounds = Weights.Base.ValueBounds;
//       const biasesValueBounds = Weights.Base.ValueBounds;
//
//       // Note: For maximum pooling, the multiply_Bounds is a little bit overestimated (but should be acceptable).
//       let filterSize = filterHeight * filterWidth;
//       this.beforeActivation.multiply_all_byBounds( filtersValueBounds ).multiply_all_byN( filterSize );
//
//       if ( bBias )
//         this.beforeActivation.add_all_byBounds( biasesValueBounds );
//
//
// //!!! ...unfinished... (2021/12/26)
// // The .undo should also be applied to the real filter value and bias value of this convolution-bias (i.e. not just applied here ScaleTranslate).
// //
// // Problem: What if this convolution-bias-activation could only undo partially (e.g. this convolution does not have bias)?
// //   How should the .undo of this convolution-bias-activation be calculated?
//       {
//         this.beforeActivation.multiply_all_byN(
//           previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet.undo.scale );
//
//         if ( this.bBias )
//           this.beforeActivation.add_all_byN(
//             previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet.undo.translate );
//       }
//
//     }
//
//     // 3. Output.
//     this.set_output_by_beforeActivation_ActivationId( nActivationId );
//
//     // 4. ActivationEscaping.ScaleTranslateArraySet.
//     this.activationEscaping_ScaleTranslateArraySet.set_by_currentBoundsArraySet_previousActivationEscaping(
//       this, previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet );
//   }

}

