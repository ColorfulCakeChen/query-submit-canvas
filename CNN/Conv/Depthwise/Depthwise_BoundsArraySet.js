export { HalfPartInfo, BoundsArraySet };

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


//!!! ...unfinished... (2022/01/07)
  /**
   *
   *
   */
  set_boundsArraySet_by_inChannelPartInfoArray( inChannelPartInfoArray, previous_ConvBiasActivation_BoundsArraySet ) {

    // 1. Determine .input
    //
    // Note: Even if avg/max pooling, input value bounds is the same as the previous ooutput value bounds
    this.boundsArraySet.input.set_all_byBoundsArray( previous_ConvBiasActivation_BoundsArraySet.output );

    // Because they are extracted from Weights which should have been regulated by Weights.Base.ValueBounds.Float32Array_RestrictedClone().
    const filtersValueBounds = Weights.Base.ValueBounds;
    const biasesValueBounds = Weights.Base.ValueBounds;

    let theActivationFunctionInfo = ValueDesc.ActivationFunction.Singleton.getInfoById( this.nActivationId );

    // ( inChannelPartIndex == 0 ), lower half channels. (or, all channels)
    // ( inChannelPartIndex == 1 ), higher half channels.
    for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
      let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];
      let inChannelBegin = inChannelPartInfo.inChannelBegin;
      let inChannelEnd = inChannelPartInfo.inChannelEnd;

      let outChannel = inChannelBegin * this.channelMultiplier;

      for ( let inChannel = inChannelBegin; inChannel < inChannelEnd; ++inChannel ) {

        let undoScale = previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales[ inChannel ];

        // 2. Determine .afterUndoPreviousActivationEscaping
        this.boundsArraySet.afterUndoPreviousActivationEscaping.set_one_byBoundsArray( inChannel, this.boundsArraySet.input, inChannel );
        this.boundsArraySet.afterUndoPreviousActivationEscaping.multiply_one_byN( inChannel, undoScale );

        for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {

          // 3. Determine .afterFilter
          this.boundsArraySet.afterFilter.set_one_byBoundsArray( outChannel, this.boundsArraySet.afterUndoPreviousActivationEscaping, inChannel );
          if ( this.filtersArray ) {

            if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
              // Do nothing. The value bounds does not change at all because it is just be past through.

            } else { // Non pass-through half channels.
              this.boundsArraySet.afterFilter
                .multiply_one_byBounds( outChannel, filtersValueBounds )
                .multiply_one_byN( outChannel, this.filterSize );
            }

          } else { // ( !this.filtersArray ). No filters array to be extracted. (i.e. avg/max pooling)
            // Do nothing. The value bounds does not change for avg/max pooling.
          }

          // 4. Determine .afterBias
          this.boundsArraySet.afterBias.set_one_byBoundsArray( outChannel, this.boundsArraySet.afterFilter, outChannel );
          if ( this.biasesArray ) {

            if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
              // Do nothing. The value bounds does not change at all because it is just be past through.

            } else { // Non pass-through half channels.
              this.boundsArraySet.afterBias.add_one_byBounds( outChannel, biasesValueBounds ); // Shift the value bounds by the bias bounds.
            }

          } else { // ( !this.biasesArray ). No biases array to be extracted.
            // Do nothing. The value bounds does not change since no bias.
          }

          // 6. Determine .afterActivationEscaping
          {
            // 6.1 Determine .activationEscaping_ScaleArraySet
            {
              // 6.1.1 Determine .do

              if ( this.nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {

                // Since no activation function, no need to escape. (i.e. scale = 1 for no scale)
                this.boundsArraySet.activationEscaping_ScaleArraySet.do.set_one_byN( outChannel, 1 );

              } else {

                if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.

                  // Calculate the scale for escaping bias result from activation function's non-linear domain into linear domain.
                  //
                  // Note: This does not work for avg/max pooling.
                  this.boundsArraySet.activationEscaping_ScaleArraySet.do.set_one_by_fromLowerUpper_toLowerUpper( outChannel,
                    this.boundsArraySet.afterBias.lowers[ outChannel ], this.boundsArraySet.afterBias.uppers[ outChannel ],
                    theActivationFunctionInfo.inputDomainLinear.lower, theActivationFunctionInfo.inputDomainLinear.upper
                  );

                  let doScale = this.boundsArraySet.activationEscaping_ScaleArraySet.do.scales[ outChannel ];
                  tf.util.assert( ( Number.isNaN( doScale ) == false ),
                    `Depthwise.FiltersArray_BiasesArray.set_boundsArraySet_by_inChannelPartInfoArray(): `
                      + `this.boundsArraySet.activationEscaping_ScaleArraySet.do.scales[ ${outChannel} ] ( ${doScale} ) `
                      + `should not be NaN. `
                      + `Please use activation function (e.g. tanh()) which has both negative and positive parts near origin point.`
                  );

                } else { // Non pass-through half channels.
                  // Since non-pass-through, no need to escape. (i.e. scale = 1 for no scale)
                  this.boundsArraySet.activationEscaping_ScaleArraySet.do.set_one_byN( outChannel, 1 );
                }
              }

              // 6.1.2 Determine .undo (Prepared for the next convolution-bias-activation. Not for this.)
              this.boundsArraySet.activationEscaping_ScaleArraySet.undo.set_one_byUndo_ScaleArray(
                outChannel, this.boundsArraySet.activationEscaping_ScaleArraySet.do, outChannel );
            }

            // 6.2 Determine .afterActivationEscaping
            this.boundsArraySet.afterActivationEscaping
              .set_one_byBoundsArray( outChannel, this.boundsArraySet.afterBias, outChannel )
              .multiply_one_byNs( outChannel, this.boundsArraySet.activationEscaping_ScaleArraySet.do.scales, outChannel );
          }

          // 7. Determine .afterActivation
          {
            // If no activation function, the output range is determined by .afterActivationEscaping.
            if ( this.nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
              this.boundsArraySet.afterActivation.set_one_byBoundsArray( outChannel, this.boundsArraySet.afterActivationEscaping, outChannel )

            // Otherwise, the activation function dominates the output range.
            } else {
              this.boundsArraySet.afterActivation.set_one_byBounds( outChannel, theActivationFunctionInfo.outputRange );
            }
          }

        } // outChannelSub, outChannel
      } // inChannel
    } // inChannelPartIndex

  }


//!!! ...unfinished... (2022/01/07) seems not used.
//!!! ...unfinished... (2021/12/27) should become BoundsArray_byChannelIndex.

  /**
   *
   * @param {ConvBiasActivation.BoundsArraySet} previous_ConvBiasActivation_BoundsArraySet
   *   The previous convolution-bias-activation value bounds set of this depthwise convolution.   
   *
   * @param {boolean} bDepthwise
   *   If true, the depthwise convolution (with/without bias, with/without activation) exists. 
   *
   * @param {number} filterHeight
   *   The filter height of the depthwise convolution. 
   *
   * @param {number} filterWidth
   *   The filter width of the depthwise convolution. 
   *
   * @param {boolean} bBias
   *   If true, the bias operation exists. 
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the bias operation.
   */
   set_by( previous_ConvBiasActivation_BoundsArraySet, bDepthwise, filterHeight, filterWidth, bBias, nActivationId ) {

    // 0. Default as BoundsArraySet.output of previous convolution-bias-activation.
    this.reset_byBounds( previous_ConvBiasActivation_BoundsArraySet.output );

    // 1. No operation at all.
    if ( !bDepthwise )
      return;

    // 2. Before activation function.
    {
      // Because they are extracted from Weights which should have been regulated by Weights.Base.ValueBounds.Float32Array_RestrictedClone().
      const filtersValueBounds = Weights.Base.ValueBounds;
      const biasesValueBounds = Weights.Base.ValueBounds;

      // Note: For maximum pooling, the multiply_Bounds is a little bit overestimated (but should be acceptable).
      let filterSize = filterHeight * filterWidth;
      this.beforeActivation.multiply_all_byBounds( filtersValueBounds ).multiply_all_byN( filterSize );

      if ( bBias )
        this.beforeActivation.add_all_byBounds( biasesValueBounds );


//!!! ...unfinished... (2021/12/26)
// The .undo should also be applied to the real filter value and bias value of this convolution-bias (i.e. not just applied here ScaleTranslate).
//
// Problem: What if this convolution-bias-activation could only undo partially (e.g. this convolution does not have bias)?
//   How should the .undo of this convolution-bias-activation be calculated?
      {
        this.beforeActivation.multiply_all_byN(
          previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet.undo.scale );

        if ( this.bBias )
          this.beforeActivation.add_all_byN(
            previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet.undo.translate );
      }

    }

    // 3. Output.
    this.set_output_by_beforeActivation_ActivationId( nActivationId );

    // 4. ActivationEscaping.ScaleTranslateArraySet.
    this.activationEscaping_ScaleTranslateArraySet.set_by_currentBoundsArraySet_previousActivationEscaping(
      this, previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet );
  }

}

