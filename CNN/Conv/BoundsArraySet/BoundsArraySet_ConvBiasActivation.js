export { ConvBiasActivation };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as TableLogger from "../../util/TableLogger.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { InputsOutputs } from "./BoundsArraySet_InputsOutputs.js";

/**
 * Element value bounds (per channel) for every operation's result of a
 * convolution-bias-activation. The main purpose is to find out the
 * activationEscaping_ScaleArraySet so that it can be used to let channel
 * escape from activation function's non-linear effect.
 *
 *   - Only input0 is used. The input1 always is undefined.
 *   - Only outputChannelCount0 is used. The outputChannelCount1 always is
 *       undefined.
 *
 * @member {FloatValue.BoundsArray} afterUndoPreviousActivationEscaping
 *   The element value bounds (per channel) after applying the
 * input0.scaleArraySet.undo to this.input0. (i.e. beforeFilter)
 *
 * @member {FloatValue.BoundsArray} afterFilter
 *   The element value bounds (per channel) after applying the convolution
 * filters to this.afterUndoPreviousActivationEscaping. (i.e. beforeBias)
 *
 * @member {FloatValue.BoundsArray} afterBias
 *   The element value bounds (per channel) after applying the convolution
 * biases to this.afterFilter. (i.e. beforeActivationEscaping)
 *
 * @member {FloatValue.BoundsArray} afterActivation
 *   The element value bounds (per channel) after applying activation function
 * to this.afterBias. It is just the this.output0.boundsArray (without
 * this.output0.scaleArraySet).
 *
 * @member {boolean[]} bPassThroughArray
 *   If true for a output channel, the output channel should be arranged to
 * pass-through from input to output.
 *
 * @see InputsOutputs
 */
class ConvBiasActivation extends InputsOutputs {

  /**
   * Used as default BoundsArraySet.ConvBiasActivation provider for conforming
   * to Recyclable interface.
   */
  static Pool = new Pool.Root( "BoundsArraySet.ConvBiasActivation.Pool",
    ConvBiasActivation );

  /**
   *   - The .input0 will be set as input0.
   *   - The .afterUndoPreviousActivationEscaping will be set according to
   *       input0 and input0.scaleArraySet.undo.scales.
   *
   * Difference from (parent class) InputsOutputs:
   *   - Only input0 (always no input1), because convolution (no matter
   *       pointwise or depthwise) could handle one input tensor.
   *   - Only output0 (always no output1), because convolution (no matter
   *       pointwise or depthwise) always generate one output tensor.
   *
   * @param {number} channelShuffler_inputGroupCount
   *   The input group count of the channel shuffler. Usually, it is used for
   * undo previous operation's channel shuffling. If 0, the
   * inputScaleBoundsArray will be used. If positive (only 2 is supported
   * currently), the inputScaleBoundsArray.beforeChannelShuffled will be used.
   *
   */
  constructor(
    input0, outputChannelCount0, channelShuffler_inputGroupCount ) {

    // .input0 and .output0
    super(
      input0, undefined, outputChannelCount0, undefined );
    this.#setAsConstructor_self(
      input0, outputChannelCount0, channelShuffler_inputGroupCount );
  }

  /** @override */
  setAsConstructor(
    input0, outputChannelCount0, channelShuffler_inputGroupCount ) {

    super.setAsConstructor(
      input0, undefined, outputChannelCount0, undefined );
    this.#setAsConstructor_self(
      input0, outputChannelCount0, channelShuffler_inputGroupCount );
  }

  /**  */
  #setAsConstructor_self(
    input0, outputChannelCount0, channelShuffler_inputGroupCount ) {

    // channel count same as input0.
    this.afterUndoPreviousActivationEscaping
      = FloatValue.BoundsArray.Pool.get_or_create_by( input0.length );

    this.afterFilter
      = FloatValue.BoundsArray.Pool.get_or_create_by( outputChannelCount0 );

    this.afterBias
      = FloatValue.BoundsArray.Pool.get_or_create_by( outputChannelCount0 );

    this.bPassThroughArray
      = Recyclable.Array.Pool.get_or_create_by( outputChannelCount0 );

    this.set_afterUndoPreviousActivationEscaping_by_input0_undoScales(
      channelShuffler_inputGroupCount );
  }

  /**
   * Set .afterUndoPreviousActivationEscaping as .input0 multiplying
   * .input0.scaleArraySet.undo.scales.
   *
   * @param {number} channelShuffler_inputGroupCount
   *   The input group count of the channel shuffler. Usually, it is used for
   * undo previous operation's channel shuffling.
   *   - If 0, the .afterUndoPreviousActivationEscaping will be in the same
   *       order of inputScaleBoundsArray.
   *   - If 2, the .afterUndoPreviousActivationEscaping will be in the order
   *       of undo-interleave-as-group-two of inputScaleBoundsArray.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_afterUndoPreviousActivationEscaping_by_input0_undoScales(
    channelShuffler_inputGroupCount ) {

    this.afterUndoPreviousActivationEscaping
      .set_all_byBoundsArray( this.input0.boundsArray )
      .multiply_all_byNs( this.input0.scaleArraySet.undo.scales );

    // Undo the channel shuffling.
    if ( channelShuffler_inputGroupCount > 0 ) {
      this.set_afterUndoPreviousActivationEscaping_by_Interleave_asGrouptTwo_undo();
    }
    return this;
  }

  /**
   * Redo the channel shuffling of .afterUndoPreviousActivationEscaping.
   */
  set_afterUndoPreviousActivationEscaping_by_Interleave_asGrouptTwo() {
    let unShuffled = FloatValue.BoundsArray.Pool.get_or_create_by(
      this.afterUndoPreviousActivationEscaping.length );

    unShuffled.set_all_byInterleave_asGrouptTwo_byBoundsArray(
      this.afterUndoPreviousActivationEscaping );

    this.afterUndoPreviousActivationEscaping.disposeResources_and_recycleToPool();
    this.afterUndoPreviousActivationEscaping = unShuffled;
    return this;
  }

  /**
   * Undo the channel shuffling of .afterUndoPreviousActivationEscaping.
   */
  set_afterUndoPreviousActivationEscaping_by_Interleave_asGrouptTwo_undo() {
    let unShuffled = FloatValue.BoundsArray.Pool.get_or_create_by(
      this.afterUndoPreviousActivationEscaping.length );
    unShuffled.set_all_byInterleave_asGrouptTwo_undo_byBoundsArray(
      this.afterUndoPreviousActivationEscaping );
    this.afterUndoPreviousActivationEscaping.disposeResources_and_recycleToPool();
    this.afterUndoPreviousActivationEscaping = unShuffled;
    return this;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources()
   * before return).
   *
   * @override
   */
  disposeResources() {

    if ( this.bPassThroughArray ) {
      this.bPassThroughArray.disposeResources_and_recycleToPool();
      this.bPassThroughArray = null;
    }

    if ( this.afterBias ) {
      this.afterBias.disposeResources_and_recycleToPool();
      this.afterBias = null;
    }

    if ( this.afterFilter ) {
      this.afterFilter.disposeResources_and_recycleToPool();
      this.afterFilter = null;
    }

    if ( this.afterUndoPreviousActivationEscaping ) {
      this.afterUndoPreviousActivationEscaping.disposeResources_and_recycleToPool();
      this.afterUndoPreviousActivationEscaping = null;
    }

    super.disposeResources();
  }

  /**
   * @return {ConvBiasActivation}
   *   Return a newly created ConvBiasActivation which is a copy of this
   * ConvBiasActivation. The this.inputs will just past to new
   * ConvBiasActivation (i.e. NOT copied). But the other data members will be
   * copied.
   */
  clone() {
    let result = ConvBiasActivation.Pool.get_or_create_by(
      this.input0, this.outputChannelCount0 );
    result.set_all_byBoundsArraySet( this );
    return result;
  }

  /**
   * @param {boolean} bPassThrough
   * Set this.bPassThroughArray[] all to bPassThrough.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_bPassThroughArray_all( bPassThrough ) {
    this.bPassThroughArray.fill( bPassThrough );
    return this;
  }

  /**
   * Set:
   *   - this.bPassThroughArray[] to false (i.e. all are not pass-through).
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_bPassThroughArray_all_none() {
    return this.set_bPassThroughArray_all( false );
  }

  /**
   * Set:
   *   - this.activationEscaping_ScaleArraySet to scale 1 (i.e. all are no
   *       scale).
   *   - this.bPassThroughArray[] to false (i.e. all are not pass-through).
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_activationEscaping_bPassThroughArray_all_none() {
    super.set_activationEscaping_all_none();
    this.set_bPassThroughArray_all_none();
    return this;
  }

  /**
   * @param {FloatValue.Bounds} aBounds
   *   Set all outputs related BoundsArray (.afterFilter, .afterBias,
   * .output0.boundsArray (i.e. .afterActivation), .bPassThroughArray) to the
   * same as the specified aBounds. Set the this.output0.scaleArraySet to
   * default (i.e. 1). The .input0 are not modified.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_outputs_all_byBounds( aBounds ) {
    this.afterFilter.set_all_byBounds( aBounds );
    this.afterBias.set_all_byBounds( aBounds );

    // i.e. .output0.boundsArray (i.e. .afterActivation),
    // .output0.scaleArraySet
    super.set_outputs_all_byBounds( aBounds );

    this.set_bPassThroughArray_all_none();
    return this;
  }

  /**
   * @param {BoundsArraySet.ConvBiasActivation} aBoundsArraySet
   *   The BoundsArraySet to be copied. The .inputs will just be referenced
   * (NOT copied). But the other data members will be copied.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object which is copied from aBoundsArraySet.
   */
  set_all_byBoundsArraySet( aBoundsArraySet ) {

    // inputs. Non-copy. Just reference to the same inputs.
    {
      this.input0 = aBoundsArraySet.input0;

      if ( aBoundsArraySet.input1 ) {
        this.input1 = aBoundsArraySet.input1;
      } else {
        if ( this.input1 )
          this.input1 = undefined;
      }
    }

    this.afterUndoPreviousActivationEscaping
      .set_all_byBoundsArray( aBoundsArraySet.afterUndoPreviousActivationEscaping );
    this.afterFilter
      .set_all_byBoundsArray( aBoundsArraySet.afterFilter );
    this.afterBias
      .set_all_byBoundsArray( aBoundsArraySet.afterBias );

    // .output0.boundsArray (i.e. .afterActivation), .output0.scaleArraySet,
    // .output1.boundsArray, .output1.scaleArraySet
    super.set_outputs_all_byBoundsArraySet( aBoundsArraySet );

    for ( let i = 0; i < this.bPassThroughArray.length; ++i ) {
      this.bPassThroughArray[ i ] = aBoundsArraySet.bPassThroughArray[ i ];
    }

    return this;
  }

  /**
   * Determine .output0.boundsArray (i.e. .afterActivation) and
   * .output0.scaleArraySet by .afterBias and .bPassThroughArray and
   * nActivationId. Also adjust .afterFilter and .afterBias by
   * .output0.scaleArraySet.
   *
   * The following properties will be used:
   *   - this.afterBias
   *   - this.bPassThroughArray
   *
   * The following properties will be modified:
   *   - this.afterFilter
   *   - this.afterBias
   *   - this.output0.boundsArray (i.e. this.afterActivation)
   *   - this.output0.scaleArraySet
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx)
   * of this convolution.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  adjust_afterFilter_afterBias_set_output0_by_afterBias_bPassThroughArray_nActivationId(
    nActivationId ) {

    const theActivationFunctionInfo
      = ValueDesc.ActivationFunction.Singleton.getInfo_byId( nActivationId );

    let outputChannelCount = this.afterBias.length;
    let doEscapingScale;
    for ( let outChannel = 0; outChannel < outputChannelCount; ++outChannel ) {

      // For pass-through half channels.
      let bPassThrough = this.bPassThroughArray[ outChannel ];

      // 1. Determine (activationEscaping) .scaleArraySet (of .output0)
      {
        // 1.1 Determine .do

        if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {

          // Since no activation function, no need to escape. (i.e. scale = 1
          // for no scale)
          this.output0.scaleArraySet.do.set_one_byN( outChannel, 1 );
          doEscapingScale = 1;

        } else {

          if ( bPassThrough ) { // For channels will be activation-escaping.

!!! ...unfinished... (2025/07/04)
// For bounds [ 0, 0 ], whether can just (like non-pass-through) let:
//   this.output0.scaleArraySet.do.set_one_byN( outChannel, 1 );
//   doEscapingScale = 1;
// So that the .lowers[] and .uppers[] needs not be modified?
//  

            // If value bounds is [ 0, 0 ], adjust it to a range which includes
            // zero.
            //
            // This could happen when filters are all zero for outChannel. This
            // adjustment is necessary because the following
            // .set_one_by_fromLowerUpper_toLowerUpper() can not work for
            // bounds [ 0, 0 ].
            //
            if (   ( this.afterBias.lowers[ outChannel ] == 0 )
                && ( this.afterBias.uppers[ outChannel ] == 0 ) ) {
              this.afterBias.lowers[ outChannel ] = -1;
              this.afterBias.uppers[ outChannel ] = +1;
            }

            // Calculate the scale for escaping bias result from activation
            // function's non-linear domain into linear domain.
            //
            // Note: This does not work for avg/max pooling.
            this.output0.scaleArraySet.do.set_one_by_fromLowerUpper_toLowerUpper(
              outChannel,
              this.afterBias.lowers[ outChannel ],
              this.afterBias.uppers[ outChannel ],
              theActivationFunctionInfo.inputDomainLinear.lower,
              theActivationFunctionInfo.inputDomainLinear.upper
            );

            doEscapingScale = this.output0.scaleArraySet.do.scales[ outChannel ];
            if ( Number.isNaN( doEscapingScale ) == true )
              throw Error( `BoundsArraySet.ConvBiasActivation`
                + `.adjust_afterFilter_afterBias_set_output0_by_afterBias_bPassThroughArray_nActivationId( `
                  + `${ValueDesc.ActivationFunction.Singleton.getNameWithInt_byId( nActivationId )} ): `
                + `this.output0.scaleArraySet.do.scales[ ${outChannel} ] `
                + `( ${doEscapingScale} ) should not be NaN. `
                + `Please use activation function (e.g. clipByValue(), tanh())`
                + `which has both negative and positive parts near origin point.`
              );

          } else { // For channels will not be activation-escaping.
            // No need to escape. (i.e. scale = 1 for no scale)
            this.output0.scaleArraySet.do.set_one_byN( outChannel, 1 );
            doEscapingScale = 1;
          }
        }

        // 1.2 Determine .undo (Prepared for the next
        //     convolution-bias-activation. Not for this.)
        this.output0.scaleArraySet.undo.set_one_byUndo_N(
          outChannel, doEscapingScale );
      }

      // 2. Adjust .afterFilter and .afterBias
      this.afterFilter.multiply_one_byN( outChannel, doEscapingScale );
      this.afterBias.multiply_one_byN( outChannel, doEscapingScale );

      // 3. Determine .afterActivation (i.e. .output0.boundsArray)
      {
        // If no activation function, the output range is determined by
        // adjusted .afterBias.
        if ( nActivationId
               == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
          this.output0.boundsArray.set_one_byBoundsArray( outChannel,
            this.afterBias, outChannel );

        } else { // Use activated escaping-scaled afterBias value as output.
          const lower_activated = theActivationFunctionInfo.pfnReference(
            this.afterBias.lowers[ outChannel ] );
          const upper_activated = theActivationFunctionInfo.pfnReference(
            this.afterBias.uppers[ outChannel ] );
          this.output0.boundsArray.set_one_byLowerUpper( outChannel,
            lower_activated, upper_activated );
        }
      }

    }

    return this;
  }

  /**
   * Rearrange output related channel information (.afterFilter, .afterBias,
   * .output0.boundsArray (i.e. .afterActivation), output0.scaleArraySet (i.e.
   * activationEscaping), .bPassThroughArray) by interleaving as
   * ( groupCount == 2 ). The channel count must be even (i.e. divisible by 2).
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_outputs_all_byInterleave_asGrouptTwo() {
    {
      let afterFilterShuffled = FloatValue.BoundsArray.Pool.get_or_create_by(
        this.afterFilter.length );

      afterFilterShuffled.set_all_byInterleave_asGrouptTwo_byBoundsArray(
        this.afterFilter );

      this.afterFilter.disposeResources_and_recycleToPool();
      this.afterFilter = afterFilterShuffled;
    }

    {
      let afterBiasShuffled = FloatValue.BoundsArray.Pool.get_or_create_by(
        this.afterBias.length );

      afterBiasShuffled.set_all_byInterleave_asGrouptTwo_byBoundsArray(
        this.afterBias );

      this.afterBias.disposeResources_and_recycleToPool();
      this.afterBias = afterBiasShuffled;
    }

    // i.e. this.afterActivation
    super.set_outputs_all_byInterleave_asGrouptTwo();

    {
      let bPassThroughArray_Shuffled = Recyclable.Array.Pool.get_or_create_by(
        this.bPassThroughArray.length );

      FloatValue.ArrayInterleaver.interleave_asGrouptTwo_alongLastAxis_from_to(
        this.bPassThroughArray, bPassThroughArray_Shuffled,
        this.bPassThroughArray.length );

      this.bPassThroughArray.disposeResources_and_recycleToPool();
      this.bPassThroughArray = bPassThroughArray_Shuffled;
    }

    return this;
  }

  get afterActivation() {
    return this.output0.boundsArray;
  }


//!!! ...unfinished... (2025/05/30)

//!!! ...untested... (2025/05/28)
  /**
   * Log .bPassThroughArray, .afterUndoPreviousActivationEscaping,
   * .afterFilter, .afterBias, .afterActivation of this object as a table.
   */
  TableLog_header_body() {
    super.TableLog_header_body(); // Log the .inputX and .outputX

    const theTableLogger = TableLogger.Base.Singleton;
  
    const {
      headerPrefixEmpty, characterCountPerField, digitCountAfterDecimalPoint,
      fieldJoinSeparator, lineJoinSeparator,
      headerFields, bodyFields, tableLines,
    } = theTableLogger;

    headerFields.length = 0;
    bodyFields.length = 0;
    tableLines.length = 0;

    // 1. Log headers.
    {
      // 1.1 Generate the 2nd line of headers. It has all detail field names. 
      {
        // Note: The .bPassThroughArray[] does not have 2nd line of headers.
        //       So let it empty.
        bodyFields.push(
          headerPrefixEmpty.padStart( characterCountPerField ) );

        const headerPrefix_boundsArray = ".boundsArray";

        this.afterUndoPreviousActivationEscaping.TableLog_header_appendFields(
          bodyFields, characterCountPerField, headerPrefix_boundsArray );

        this.afterFilter.TableLog_header_appendFields(
          bodyFields, characterCountPerField, headerPrefix_boundsArray );

        this.afterBias.TableLog_header_appendFields(
          bodyFields, characterCountPerField, headerPrefix_boundsArray );

        this.afterActivation.TableLog_header_appendFields(
          bodyFields, characterCountPerField, headerPrefix_boundsArray );
      }

      // 1.2 Generate the 1st line of headers.
      //
      // Place the header prefix (may be very long) in the 1st line of headers.
      {
//!!! (2025/05/30 Remarked) seems not used.
//         // "-1" for excluding .bPassThroughArray[] (which is not a BoundsArray).
//         const boundsArrayCount = ( bodyFields.length - 1 );
//         const headerPrefix_columnCount = Math.floor( boundsArrayCount / 2 );

        // Because a BoundsArray has two data members (i.e. two columns in the
        // table log), let them share the same header prefix (so that a very
        // long header prefix could be displayed properly).
        //
        // Its column width is twice as the detail column (with separator).
        const headerPrefix_wideColumn_characterCount = characterCountPerField
          + fieldJoinSeparator.length + characterCountPerField;

        // The header of .bPassThroughArray[] (which is not a BoundsArray)
        // uses normal (narrow) column width.
        const headerPrefix_bPassThrough = ".bPassThrough";
        headerFields.push(
          headerPrefix_bPassThrough.padStart( characterCountPerField ),
        );

        // All other headers (which are BoundsArray) use wide (twice) column
        // width.
        const headerPrefix_afterUndoPreviousActivationEscaping
          = ".afterUndoPreviousActivationEscaping";
        headerFields.push(
          headerPrefix_afterUndoPreviousActivationEscaping.padStart(
            headerPrefix_wideColumn_characterCount ) );

        const headerPrefix_afterFilter = ".afterFilter";
        headerFields.push(
          headerPrefix_afterUndoPreviousActivationEscaping.padStart(
            headerPrefix_wideColumn_characterCount ) );

        const headerPrefix_afterBias = ".afterBias";
        headerFields.push(
          headerPrefix_afterBias.padStart(
            headerPrefix_wideColumn_characterCount ) );

        const headerPrefix_afterActivation = ".afterActivation";
        headerFields.push(
          headerPrefix_afterActivation.padStart(
            headerPrefix_wideColumn_characterCount ) );
      }

      // 1.3 Write out the headers to log.
      const header_line0 = headerFields.join( fieldJoinSeparator );
      tableLines.push( header_line0 );

      const header_line1 = bodyFields.join( fieldJoinSeparator );
      tableLines.push( header_line1 );
    }

    // 2. Log body.
    {
      // Note: The .bPassThroughArray[] (a boolean 0 or 1) needs not decimal
      //       point.
      const digitCountAfterDecimalPoint_bPassThrough = 0;

      const rowIndexBound = aBoundsArray.length;
      for ( let rowIndex = 0; rowIndex < rowIndexBound; ++rowIndex ) {
        bodyFields.length = 0;

        bodyFields.push(
          this.bPassThroughArray[ rowIndex ]
            .toFixed( digitCountAfterDecimalPoint_bPassThrough )
            .padStart( characterCountPerField )
        );

        this.afterUndoPreviousActivationEscaping.TableLog_body_appendFields(
          bodyFields,
          characterCountPerField, digitCountAfterDecimalPoint, rowIndex );

        this.afterFilter.TableLog_body_appendFields(
          bodyFields,
          characterCountPerField, digitCountAfterDecimalPoint, rowIndex );

        this.afterBias.TableLog_body_appendFields(
          bodyFields,
          characterCountPerField, digitCountAfterDecimalPoint, rowIndex );

        this.afterActivation.TableLog_body_appendFields(
          bodyFields,
          characterCountPerField, digitCountAfterDecimalPoint, rowIndex );

        const body_line = bodyFields.join( fieldJoinSeparator );
        tableLines.push( body_line );
      }
    }

    // 3. Write out log table.
    const tableText = tableLines.join( lineJoinSeparator );
    console.log( tableText );
  }

}
