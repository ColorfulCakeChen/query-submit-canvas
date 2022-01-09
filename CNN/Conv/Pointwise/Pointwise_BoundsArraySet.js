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
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) of this depthwise convolution.
   *
   * @param {number[]} biasesArray
   *   The weights of the bias. Its content will not be used. Only be tested against null. If ( biasesArray != null ),
   * there is bias operation. If ( biasesArray == null ), there is no bias operation.
   */
  set_all_by_inChannelPartInfoArray(
    previous_ConvBiasActivation_BoundsArraySet, inChannelPartInfoArray, 
    nActivationId, biasesArray
  ) {

    // Because they are extracted from Weights which should have been regulated by Weights.Base.ValueBounds.Float32Array_RestrictedClone().
    const filtersValueBounds = Weights.Base.ValueBounds;
    const biasesValueBounds = Weights.Base.ValueBounds;

    let theActivationFunctionInfo = ValueDesc.ActivationFunction.Singleton.getInfoById( nActivationId );

    // 1. Determine .input
    this.input.set_all_byBoundsArray( previous_ConvBiasActivation_BoundsArraySet.output );


//!!! ...unfinished... (2022/01/09)
    {
      let tBounds = new FloatValue.Bounds( 0, 0 );

//!!! ...unfinished... (2022/01/09)
      this.afterFilter.set_all_byN( 0 ); // Initialize .afterFilter

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

//!!! ...unfinished... (2022/01/09) Where to initialize this.afterFilter?
          // 3. Determine .afterFilter
//          this.afterFilter.set_one_byBoundsArray( outChannel, this.afterUndoPreviousActivationEscaping, inChannel );

          for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outputChannelCount; ++outChannelSub, ++outChannel ) {
            if ( outChannel >= this.outputChannelCount )
              break InChannelPartIndexLoop; // Never exceeds the total output channel count.

//!!! ...unfinished... (2022/01/09)
            if ( ( inChannelToBegin >= 0 ) && ( inChannel < inChannelPartInfo.inChannelEnd ) ) {

              if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
                // Do nothing. The value bounds does not change at all because it is just be past through.

                if ( inChannelToBegin == outChannelSub ) {
                  this.afterFilter.set_one_by ???; // The only one position with non-zero value.
//!!! ...unfinished... (2022/01/09) should set to the same as .afterUndoPreviousActivationEscaping? since pass through?
                } else {
//!!! ...unfinished... (2022/01/09)
                }


              } else { // Non-pass-through half channels.

//!!! ...unfinished... (2022/01/09) ???
                tBounds.set_byBoundsArray( this.afterUndoPreviousActivationEscaping, inChannel );
                tBounds.multiply_byBounds( filtersValueBounds );
                this.afterFilter.add_one_byBounds( outChannel, tBounds )

              }

            } else {
              // Do nothing. The value bounds does not change for all input channels which is not in range (since these inputs are ignored).
            }

          }
        }
      }

  }


//!!! (2022/01/09 Remarked) seems not used. because should be channel by channel.
//   /**
//    *
//    * @param {ConvBiasActivation.BoundsArraySet} previous_ConvBiasActivation_BoundsArraySet
//    *   The previous convolution-bias-activation value bounds set of this pointwise convolution.   
//    *
//    * @param {boolean} bPointwise
//    *   If true, the pointwise convolution (with/without bias, with/without activation) exists. 
//    *
//    * @param {number} inputChannelCount
//    *   The input channel count of the pointwise convolution. 
//    *
//    * @param {boolean} bBias
//    *   If true, the bias operation exists. 
//    *
//    * @param {number} nActivationId
//    *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the bias operation.
//    */
//   set_by( previous_ConvBiasActivation_BoundsArraySet, bPointwise, inputChannelCount, bBias, nActivationId ) {
//
//     // 0. Default as BoundsArraySet.output of previous convolution-bias-activation.
//     this.resetBy_Bounds( previous_ConvBiasActivation_BoundsArraySet.output );
//
//     // 1. No operation at all.
//     if ( !bPointwise )
//       return;
//
//     // 2. Before activation function.
//     {
//       // Because they are extracted from Weights which should have been regulated by Weights.Base.ValueBounds.Float32Array_RestrictedClone().
//       const filtersValueBounds = Weights.Base.ValueBounds;
//       const biasesValueBounds = Weights.Base.ValueBounds;
//
//       this.beforeActivation.multiply_all_byBounds( filtersValueBounds ).multiply_all_byN( inputChannelCount );
//
//       if ( bBias )
//         this.beforeActivation.add_byBounds( biasesValueBounds );
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
//     this.activationEscaping_ScaleTranslateArraySet.setBy_currentBoundsArraySet_previousActivationEscaping(
//       this, previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet );
//   }

}

