export { PassThrough_FiltersArray_BiasesArray_Bag };

import * as MapTools from "../../util/MapTools.js";
import { PassThrough_FiltersArray_BiasesArray } from "./PassThrough.js";

/**
 * A pool for PassThrough_FiltersArray_BiasesArray with various parameters. It could reduce re-create them of same parameters again
 * and again to improve performance.
 *
 */
class PassThrough_FiltersArray_BiasesArray_Bag {
  
//!!! ...unfinished... (2022/05/23)
  constructor() {
    this.by_inputChannelCount_outputChannelCount_inputChannelIndexStart_bBias_filterValue_biasValue = new Map();
  }

  get_by( inputChannelCount, outputChannelCount, inputChannelIndexStart, bBias, filterValue = 1, biasValue = 0 ) {

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
