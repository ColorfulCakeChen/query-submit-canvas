export { BoundsArraySet };

import * as ConvBiasActivation from "../ConvBiasActivation.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import { ChannelPartInfo } from  "./Pointwise_ChannelPartInfo.js";

/**
 * The element value bounds for pointwise convolution-bias-activation.
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

    for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {
      let outChannel = 0;

      InChannelPartIndexLoop:
      for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
        let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];
        let inChannelToBegin = inChannel - inChannelPartInfo.inChannelBegin;

        for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outputChannelCount; ++outChannelSub, ++outChannel ) {
          if ( outChannel >= this.outputChannelCount )
            break InChannelPartIndexLoop; // Never exceeds the total output channel count.

          if ( ( inChannelToBegin >= 0 ) && ( inChannel < inChannelPartInfo.inChannelEnd ) ) {

            if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
              this.bPassThrough[ outChannel ] = true;

            } else { // Non-pass-through half channels. (i.e. input multiply filter weight.)
              this.bPassThrough[ outChannel ] = false;
            }

          } else {
            // Do nothing. The value bounds does not change for all input channels which is not in range (since these inputs are ignored).
            // (i.e. input multiply 0.)
            this.bPassThrough[ outChannel ] = ???;
          }

        } // outChannelSub, outChannel
      } // inChannelPartIndex
    } // inChannel

  }


//!!! ...unfinished... (2022/01/09)
// Even if ( this.outputChannelCount <= 0 ),
// this function should work correctly and BoundsArraySet should result in pass-through input to output.

  /**
   *
   * @param {ConvBiasActivation.BoundsArraySet} previous_ConvBiasActivation_BoundsArraySet
   *   The value bounds set of the previous convolution-bias-activation.
   *
   * @param {Pointwise.ChannelPartInfo[]} inChannelPartInfoArray
   *   The input channel range array which describe lower/higher half channels index range.
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) of this pointwise convolution.
   *
   * @param {boolean} bBias
   *   Whether this pointwise convolution has bias operation.
   */
  set_all_by_inChannelPartInfoArray(
    previous_ConvBiasActivation_BoundsArraySet, inChannelPartInfoArray, 
    nActivationId, bBias
  ) {

//!!! ...unfinished... (2022/01/10)
// It should be better to use real filter and bias to calculate per channel value bounds. This is especially important for ActivationEscaping.
// Because activation function inputDomainLinear is not wide, using looser value bounds estimation has higher possibility to lost information.
//
// Perhaps, using two-passes in Pointwise.FiltersArray_BiasesArray.init():
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

    let theActivationFunctionInfo = ValueDesc.ActivationFunction.Singleton.getInfoById( nActivationId );

    // 1. Determine .input
    this.input.set_all_byBoundsArray( previous_ConvBiasActivation_BoundsArraySet.output );


//!!! ...unfinished... (2022/01/09)
    { // filtersArray
      let tBounds = new FloatValue.Bounds( 0, 0 );

      this.afterFilter.set_all_byN( 0 ); // Initialize .afterFilter for accumulating every output channel by every input channel.

      for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {
        let undoPreviousEscapingScale = previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales[ inChannel ];
        
        // 2. Determine .afterUndoPreviousActivationEscaping
        this.afterUndoPreviousActivationEscaping.set_one_byBoundsArray( inChannel, this.input, inChannel );
        this.afterUndoPreviousActivationEscaping.multiply_one_byN( inChannel, undoPreviousEscapingScale );

        let outChannel = 0;

        InChannelPartIndexLoop:
        for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
          let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];
          let inChannelToBegin = inChannel - inChannelPartInfo.inChannelBegin;

          for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outputChannelCount; ++outChannelSub, ++outChannel ) {
            if ( outChannel >= this.outputChannelCount )
              break InChannelPartIndexLoop; // Never exceeds the total output channel count.

            if ( ( inChannelToBegin >= 0 ) && ( inChannel < inChannelPartInfo.inChannelEnd ) ) {

              if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.

                if ( inChannelToBegin == outChannelSub ) {

                  // The only one filter position (in the pass-through part) has non-zero value. (i.e. input multiply 1.)
                  this.afterFilter.add_one_byBoundsArray( outChannel, this.afterUndoPreviousActivationEscaping, inChannel );

                } else {
                  // Do nothing. All other filter positions (in the pass-through part) are zero. (i.e. input multiply 0.)
                }

              } else { // Non-pass-through half channels. (i.e. input multiply filter weight.)
                tBounds.set_byBoundsArray( this.afterUndoPreviousActivationEscaping, inChannel ).multiply_byBounds( filtersValueBounds );
                this.afterFilter.add_one_byBounds( outChannel, tBounds )
              }

            } else {
              // Do nothing. The value bounds does not change for all input channels which is not in range (since these inputs are ignored).
              // (i.e. input multiply 0.)
            }

            ++filterIndex;

          } // outChannelSub, outChannel
        } // inChannelPartIndex
      } // inChannel
    } // filtersArray

    // 4. Determine .afterBias
    this.afterBias.set_all_byBoundsArray( this.afterFilter );
    if ( bBias ) {
      let outChannel = 0;

      InChannelPartIndexLoop:
      for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
        let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

        for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outputChannelCount; ++outChannelSub, ++outChannel ) {
          if ( outChannel >= this.outputChannelCount )
            break InChannelPartIndexLoop; // Never exceeds the total output channel count.

          if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
            // Do nothing. The value bounds does not change at all because it is just be past through.

          } else { // Non-pass-through half channels.
            this.afterBias.add_one_byBounds( outChannel, biasesValueBounds ); // Shift the value bounds by the bias bounds.
          }

        } // outChannelSub, outChannel
      } // inChannelPartIndex

    } else { // ( !bBias )
      // Do nothing. The value bounds does not change since no bias.
    }

//!!! ...unfinished... (2022/01/09)

        
  }

}

