export { SequenceArray };

/**
 * An array of ParamDesc.Xxx objects. It will also fill the value of these ParamDesc.Xxx's .seqId property.
 *
 *
 */
class SequenceArray {
  
  /**
   *
   * @param {ParamDesc.Base[]} aParamDescArray
   *   An array of ParamDesc.Xxx objects. It will be kept (i.e. owned; not cloned) by this SequenceArray object.
   */
  constructor( aParamDescArray ) {
    this.array = aParamDescArray;

    for ( let i = 0; i < this.array.legth; ++i ) {
      this.array[ i ].seqId = i;
    }
  }

}

