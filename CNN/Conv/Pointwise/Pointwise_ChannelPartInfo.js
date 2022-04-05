export { ChannelPartInfo, FiltersBiasesPartInfo };

//!!! (2022/04/01 Remarked) Hard to implement it efficiently.
//export { ChannelPart };

/**
 * Half channels information. Describe channel index range of lower half or higher half.
 *
 * @member {number} inChannelBegin
 *   The beginning input channel index of this part.
 *
 * @member {number} inChannelEnd
 *   The ending input channel index of this part.
 *
 * @member {number} outputChannelCount
 *   The channel count of output.
 *
 * @member {boolean} bPassThrough
 *   If true, this is a pass-through part and it will pass-through input channel index in [ inChannelBegin, inChannelEnd ) to output.
 * Otherwise, this is a non-pass-through part and it will using filters and biases extracted from weights array to convolve input channel
 * index in [ inChannelBegin, inChannelEnd ) to output.
 */
class ChannelPartInfo {

  /**
   */
  constructor( inChannelBegin, inChannelEnd, outputChannelCount, bPassThrough ) {
    this.inChannelBegin = inChannelBegin;
    this.inChannelEnd = inChannelEnd;    
    this.outputChannelCount = outputChannelCount;
    this.bPassThrough = bPassThrough;
  }

}


//!!! (2022/04/01 Remarked) Hard to implement it efficiently.
//
// /**
//  * The value of generator FiltersBiasesPartInfo.ChannelPartGenerator( this.outputChannelCount, inChannel ).next().
//  */
// class ChannelPart {
//
// //   ChannelPart.info (i.e. ChannelPartInfo)
// //   ChannelPart.outChannelSub
// //   ChannelPart.outChannel
// //   ChannelPart.outChannelEnd
// //   ChannelPart.inChannelToPartBegin
//
// //!!! ...unfifnished... (2022/04/01)
//
//   /**
//    *
//    */
//   isOutChannelInRange() {
//   }
//
// //!!! ...unfifnished... (2022/04/01)
//
//   /**
//    *
//    */
//   isInChannelInRange() {
//   }
//
// //!!! ...unfifnished... (2022/04/01)
//
//   /**
//    *
//    */
//   isPassThrough() {
//   }
//
// //!!! ...unfifnished... (2022/04/01)
//
//   /**
//    *
//    */
//   isInChannelSameAsOutChannel() {
//   }
//
//
// //   if ( outChannel >= outChannelBegin ) {
// //     if ( ( inChannelToPartBegin >= 0 ) && ( inChannel < inChannelPartInfo.inChannelEnd ) ) {
// //       if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
// //         if ( inChannelToPartBegin == outChannelSub ) { // The only one filter position (in the pass-through part) has non-zero value.
//
// }


/**
 * Describe a range for a (pointwise) filters and a biases.
 *
 *
 * @member {number} inputChannelCount
 *   The input channel count of this parts.
 *
 * @member {ChannelPartInfo[]} aChannelPartInfoArray
 *   Every input-output relationship of this parts.
 *
 */
class FiltersBiasesPartInfo {

  /**
   *
   */
//!!! (2022/04/05 Remarked) Always run through all input channels.
//   constructor( inputChannelCount, aChannelPartInfoArray ) {
//     this.inputChannelCount = inputChannelCount;

  constructor( aChannelPartInfoArray ) {
    this.aChannelPartInfoArray = aChannelPartInfoArray;
  }

//!!! (2022/04/01 Remarked) Hard to implement it efficiently.
//
//   /**
//    *
//    * @param {number} outChannelBegin
//    *   The output channel index of the ChannelPart's beginning.
//    *
//    * @param {number} outputChannelCount
//    *   The total output channel count which is used as the upper bounds of yielded ChannelPart.outChannel.
//    *
//    * @param {number} inChannel
//    *   The current input channel index which is used to calculate ChannelPart.inChannelToPartBegin.
//    *
//    * @return {Generator}
//    *   Return a generator whose .next().value will be a ChannelPart object.
//    */
//   * ChannelPartGenerator( outChannelBegin, outputChannelCount, inChannel ) {
//
// //!!! ...unfifnished... (2022/04/01)
//
//
// //!!! ...unfifnished... (2022/04/01)
// //            outChannelEnd = Math.min( outChannelEnd + inChannelPartInfo.outputChannelCount, this.outputChannelCount );
//
//   }
//
// //!!! ...unfifnished... (2022/04/01)
//   * FiltersBiasesPartGenerator() {
//   }

//!!! ...unfifnished... (2022/02/24)
//   /**
//    * @return {number}
//    *   Total output channel count of this.aChannelPartInfoArray.
//    */
//   get outputChannelCountTotal() {
//   }
}
