export { Base };

import * as MapTools from "./util/MapTools.js";

/**
 * A map whose value is also a map (except the most leaf node.
 *
 */
class Base {

//!!! ...unfinished... (2022/05/23)
  constructor() {
    this.map = new Map();
  }

  /**
   *
   *
   * @param {function} pfnCreate
   *   This parameter (i.e. arguments[ 0 ]) should be a function. When specified keys (i.e. arguments[] except arguments[ 0 ]) is
   * not found, this function will be called with these parameters. The function pfnCreate() should return a object which will
   * be recorded as the keys' corresponding value.
   *
   * @return {any}
   *   All parameters ( arguments[ 1 ], arguments[ 2 ], ..., arguments[ arguments.length - 1 ] ) will be used as keys of every map
   * layer.
   *
   *   - If a object is found, it will be returned.
   *
   *   - Otherwise, the function (pfnCreate)() will be called with all these same parameters to create a new object. The newly
   *     created object will be recorded into the leaf map and returned.
   *
   */
  static get_or_create_by_arguments1_etc( pfnCreate ) {

//!!! ...unfinished... (2022/05/23)
//     let nPassThroughStyleId = ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0;
//     const thePassThroughStyleInfo = ValueDesc.PassThroughStyle.Singleton.getInfoById( nPassThroughStyleId );

  }

  get_by_filterValue_biasValue( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue = 1, biasValue = 0 ) {

//!!! ...unfinished... (2022/05/23)
    let by_outputChannelCount_inputChannelIndexStart_bBias_filterValue_biasValue
      = MapTools.get_or_create(
          this.by_inputChannelCount_outputChannelCount_inputChannelIndexStart_bBias_filterValue_biasValue, inputChannelCount );

  }

//!!! ...unfinished... (2022/05/23)
  /** Release all tensors. */
  disposeTensors() {
    if ( this.tensorsBy_originalHeight_originalWidth_channelCount_filterHeight_filterWidth_stridesPad ) {

      for ( let tensor
        of MapTools.values_recursively( this.tensorsBy_originalHeight_originalWidth_channelCount_filterHeight_filterWidth_stridesPad ) ) {

        tensor.dispose();
      }

      this.tensorsBy_originalHeight_originalWidth_channelCount_filterHeight_filterWidth_stridesPad.clear();
    }
  }

}
