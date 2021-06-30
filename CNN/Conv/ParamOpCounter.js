export { Base };

/**
 * Count how many operations use a parameter behind this counter.
 *
 * @member {number} paramId
 *   This parameter's identifier.
 *
 * @member {Base} previousParamOpCounter
 *   The previous ParamOpCounter which is before this ParamOpCounter.
 *
 * @member {number} behindOperationCount
 *   This parameter is used by how many operations which is behind this operation.
 *
 *
 *
 */
class Base {

  constructor( paramId, previousParamOpCounter ) {
    this.paramId = paramId;
    this.previousParamOpCounter = previousParamOpCounter;
    this.behindOperationCount = 0;
  }

}
