export { Bag };

import * as MapTools from "../../util/MapTools.js";
import * as RandTools from "../../util/RandTools.js";

/**
 * A pool for number array which is created with sequence and randomized offset. It could reduce re-create them of same parameters again
 * and again to improve performance.
 *
 */
class Bag {

//!!! ...unfinished... (2022/05/23)
  constructor() {
    this.by_inputChannelCount_outputChannelCount_inputChannelIndexStart_bBias_filterValue_biasValue = new Map();
  }

  get_by_nPassThroughStyleId( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, nPassThroughStyleId ) {

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
