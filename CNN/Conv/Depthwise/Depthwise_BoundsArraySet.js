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

  /**
   * Set this.bPassThrough[] according to inChannelPartInfoArray.
   *
   * @param {Depthwise.ChannelPartInfo[]} inChannelPartInfoArray
   *   The input channel range array which describe lower/higher half channels index range.
   */
  set_all_bPassThrough( inChannelPartInfoArray ) {
    for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
      let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];
      let inChannelBegin = inChannelPartInfo.beginIndex;
      let inChannelEnd = inChannelPartInfo.endIndex;

      let outChannel = inChannelBegin * this.channelMultiplier;
      for ( let inChannel = inChannelBegin; inChannel < inChannelEnd; ++inChannel ) {
        for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {
          if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
            this.bPassThrough[ outChannel ] = true;

          } else { // Non pass-through half channels.
            this.bPassThrough[ outChannel ] = false;
          }
        }
      }
    }
  }


//!!! ...unfinished... (2022/01/07) What about ( bDepthwise == false )?

//!!! ...unfinished... (2022/01/09)
// Even if ( this.AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ),
// this function should work correctly and BoundsArraySet should result in pass-through input to output.


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
   * @param {boolean} bFilter
   *   Whether this depthwise convolution has bias operation. If ( bFilter == true ), this is a depthwise convolution.
   * If ( bFilter == false ), this is an avg/max pooling (i.e. no filters weights).
   *
   * @param {boolean} bBias
   *   Whether this depthwise convolution has bias operation.
   */
  set_all_by_inChannelPartInfoArray(
    previous_ConvBiasActivation_BoundsArraySet, inChannelPartInfoArray, 
    channelMultiplier, nActivationId, bFilter, bBias
  ) {

//!!! ...unfinished... (2022/01/10)
// It should be better to use real filter and bias to calculate per channel value bounds. This is especially important for ActivationEscaping.
// Because activation function inputDomainLinear is not wide, using looser value bounds estimation has higher possibility to lost information.
//
// Perhaps, using two-passes in Depthwise.FiltersArray_BiasesArray.init():
//
//   - In the 1st pass, extracting real filter and bias value. At the same time, calculating .afterFilter and .afterBias
//       by these extracted value combined with undoPreviousEscapingScale
//       (i.e. previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales[ inChannel ]). Find out
//       .activationEscaping_ScaleArraySet, .afterActivationEscaping, .afterActivation.
//
//   - In the 2nd pass, apply doEscapingScale (i.e. .activationEscaping_ScaleArraySet.do.scales[ outChannel ] )
//       to filter and bias value (and also .afterFilter and .afterBias).
//

    // Because they are extracted from Weights which should have been regulated by Weights.Base.ValueBounds.Float32Array_RestrictedClone().
    //
    // Q: Why not use the real filter and bias value (i.e. not the supposed bounds range) directly.
    // A: Their values are unknown when determine value bounds. Even if they are known, their values are pre-scaled (i.e. altered; not original) value.
    const filtersValueBounds = Weights.Base.ValueBounds;
    const biasesValueBounds = Weights.Base.ValueBounds;

//!!! (2022/01/11 Remarked) Moved to parent class.
//    let theActivationFunctionInfo = ValueDesc.ActivationFunction.Singleton.getInfoById( nActivationId );

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

        let undoPreviousEscapingScale = previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales[ inChannel ];

        // 2. Determine .afterUndoPreviousActivationEscaping
        this.afterUndoPreviousActivationEscaping.set_one_byBoundsArray( inChannel, this.input, inChannel );
        this.afterUndoPreviousActivationEscaping.multiply_one_byN( inChannel, undoPreviousEscapingScale );

        for ( let outChannelSub = 0; outChannelSub < channelMultiplier; ++outChannelSub, ++outChannel ) {

          if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
            this.bPassThrough[ outChannel ] = true;

            // Do nothing. The value bounds does not change at all because it is just be past through.

          } else { // Non pass-through half channels.
            this.bPassThrough[ outChannel ] = false;

            // 3. Determine .afterFilter
            this.afterFilter.set_one_byBoundsArray( outChannel, this.afterUndoPreviousActivationEscaping, inChannel );
            if ( bFilter ) {
              this.afterFilter
                .multiply_one_byBounds( outChannel, filtersValueBounds )
                .multiply_one_byN( outChannel, this.filterSize );

            } else { // ( !bFilter ). No filters array to be extracted. (i.e. avg/max pooling)
              // Do nothing. The value bounds does not change for avg/max pooling.
            }

            // 4. Determine .afterBias
            this.afterBias.set_one_byBoundsArray( outChannel, this.afterFilter, outChannel );
            if ( bBias ) {
                this.afterBias.add_one_byBounds( outChannel, biasesValueBounds ); // Shift the value bounds by the bias bounds.

            } else { // ( !bBias ). No biases array to be extracted.
              // Do nothing. The value bounds does not change since no bias.
            }
          }


//!!! (2022/01/11 Remarked) Check bPassThrough first.
//           // 3. Determine .afterFilter
//           this.afterFilter.set_one_byBoundsArray( outChannel, this.afterUndoPreviousActivationEscaping, inChannel );
//           if ( bFilter ) {
//
//             if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
//               // Do nothing. The value bounds does not change at all because it is just be past through.
//               this.bPassThrough[ outChannel ] = true;
//
//             } else { // Non pass-through half channels.
//               this.afterFilter
//                 .multiply_one_byBounds( outChannel, filtersValueBounds )
//                 .multiply_one_byN( outChannel, this.filterSize );
//             }
//
//           } else { // ( !bFilter ). No filters array to be extracted. (i.e. avg/max pooling)
//             // Do nothing. The value bounds does not change for avg/max pooling.
//           }
//
//           // 4. Determine .afterBias
//           this.afterBias.set_one_byBoundsArray( outChannel, this.afterFilter, outChannel );
//           if ( bBias ) {
//
//             if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
//               // Do nothing. The value bounds does not change at all because it is just be past through.
//
//             } else { // Non pass-through half channels.
//               this.afterBias.add_one_byBounds( outChannel, biasesValueBounds ); // Shift the value bounds by the bias bounds.
//             }
//
//           } else { // ( !bBias ). No biases array to be extracted.
//             // Do nothing. The value bounds does not change since no bias.
//           }

//!!! (2022/01/11 Remarked) Moved to parent class. 
//
// //!!! ...unfinished... (2022/01/10)
// // Determine .activationEscaping_ScaleArraySet, .afterActivationEscaping, .afterActivation, should be moved to parent class.
// // They should be shared with pointwise and depthwise BoundsArraySet.
//
//           {
//             // 5. Determine .activationEscaping_ScaleArraySet
//             {
//               // 5.1 Determine .do
//
//               if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
//
//                 // Since no activation function, no need to escape. (i.e. scale = 1 for no scale)
//                 this.activationEscaping_ScaleArraySet.do.set_one_byN( outChannel, 1 );
//
//               } else {
//
//                 if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
//
//                   // Calculate the scale for escaping bias result from activation function's non-linear domain into linear domain.
//                   //
//                   // Note: This does not work for avg/max pooling.
//                   this.activationEscaping_ScaleArraySet.do.set_one_by_fromLowerUpper_toLowerUpper( outChannel,
//                     this.afterBias.lowers[ outChannel ], this.afterBias.uppers[ outChannel ],
//                     theActivationFunctionInfo.inputDomainLinear.lower, theActivationFunctionInfo.inputDomainLinear.upper
//                   );
//
//                   let doEscapingScale = this.activationEscaping_ScaleArraySet.do.scales[ outChannel ];
//                   tf.util.assert( ( Number.isNaN( doEscapingScale ) == false ),
//                     `Depthwise.FiltersArray_BiasesArray.set_boundsArraySet_by_inChannelPartInfoArray(): `
//                       + `this.activationEscaping_ScaleArraySet.do.scales[ ${outChannel} ] ( ${doEscapingScale} ) `
//                       + `should not be NaN. `
//                       + `Please use activation function (e.g. tanh()) which has both negative and positive parts near origin point.`
//                   );
//
//                 } else { // Non pass-through half channels.
//                   // Since non-pass-through, no need to escape. (i.e. scale = 1 for no scale)
//                   this.activationEscaping_ScaleArraySet.do.set_one_byN( outChannel, 1 );
//                 }
//               }
//
//               // 5.2 Determine .undo (Prepared for the next convolution-bias-activation. Not for this.)
//               this.activationEscaping_ScaleArraySet.undo.set_one_byUndo_ScaleArray(
//                 outChannel, this.activationEscaping_ScaleArraySet.do, outChannel );
//             }
//
//             // 6. Determine .afterActivationEscaping
//             this.afterActivationEscaping
//               .set_one_byBoundsArray( outChannel, this.afterBias, outChannel )
//               .multiply_one_byNs( outChannel, this.activationEscaping_ScaleArraySet.do.scales, outChannel );
//           }
//
//           // 7. Determine .afterActivation
//           {
//             // If no activation function, the output range is determined by .afterActivationEscaping.
//             if ( this.nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
//               this.afterActivation.set_one_byBoundsArray( outChannel, this.afterActivationEscaping, outChannel )
//
////!!! ...unfinished... (2022/01/11)
//// Consider the implementation of .activationEscaping_ScaleArraySet.do.set_one_by_fromLowerUpper_toLowerUpper(),
//// it is not so good no matter using set_one_byXxx() or clamp_one_byXxx() of this.afterActivation.
//
//             // Otherwise, the activation function dominates the output range.
//             } else {
//               if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels, it is clamped by the output range for linearDomainLinear.
//                 this.afterActivation.clamp_one_byBounds( outChannel, theActivationFunctionInfo.outputRangeLinear );
//
//               } else { // Non pass-through half channels, it is clamped by the output range for the whole input domain.
//                 this.afterActivation.clamp_one_byBounds( outChannel, theActivationFunctionInfo.outputRange );
//               }
//             }
//           }

        } // outChannelSub, outChannel
      } // inChannel
    } // inChannelPartIndex

    // 5. Determine .activationEscaping_ScaleArraySet, .afterActivationEscaping, .afterActivation
    this.set_activationEscaping_afterActivationEscaping_afterActivation_by_afterBias_nActivationId( nActivationId );
  }

}

