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
   * @param {any} key1
   *   The 1st key (i.e. arguments[ 1 ]) to find object. It must be provided. All other keys (i.e. arguments[ 2 ], ...,
   * arguments[ arguments.length - 1 ] ) are optional.
   *
   * @return {any}
   *   All parameters except arguments[ 0 ] (i.e. ( arguments[ 1 ], arguments[ 2 ], ..., arguments[ arguments.length - 1 ] ) )
   * will be used as keys of every map layer.
   *
   *   - If a object is found, it will be returned.
   *
   *   - Otherwise, the function (pfnCreate)() will be called with all these same parameters to create a new object. The newly
   *     created object will be recorded into the leaf map and returned.
   *
   */
  get_or_create_by_arguments1_etc( pfnCreate, key1 ) {

    tf.util.assert( ( arguments.length >= 2 ),
      `MultiLayerMap.Base.get_or_create_by_arguments1_etc(): `
        + `arguments.length ${arguments.length} must >= 2. `
        + `At least, pfnCreate and key1 should be provided.` );

    if ( arguments.length < 2 )
      return undefined; // This operation can not work.

    let container = this.map;
    let lastKeyIndex = arguments.length - 1;

    //
    let node;
    for ( let i = 1; i < lastKeyIndex; ++i ) {
      let key = arguments[ i ];
      node = MapTools.get_or_create( container, key, Map );
    }

    let lastKey = arguments[ lastKeyIndex ];
    node.get( 
//!!! ...unfinished... (2022/05/23)

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
