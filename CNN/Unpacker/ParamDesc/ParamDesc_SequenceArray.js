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
   *
   *   - every element should be a ParamDesc.Xxx object (one of ParamDesc.Base, ParamDesc.Same, ParamDesc.Bool)
   *       describing the parameter.
   *
   *     - The paramDesc.valueDesc should be a ValueDesc.Xxx object (one of ValueDesc.Same, ValueDesc.Bool, ValueDesc.Int).
   *       The paramDesc.valueDesc.range should be a ValueRange.Xxx object (one of ValueRange.Same, ValueRange.Bool, ValueRange.Int).
   *       The paramDesc.valueDesc.range.adjust() is a function for adjusting the parameter value.
   *
   */
  constructor( aParamDescArray ) {
    this.array = aParamDescArray;

    for ( let i = 0; i < this.array.length; ++i ) {
      this.array[ i ].seqId = i;
    }
  }

}

