
export { Base };

/**
 * Count how many operations use a parameter behind this counter.
 */
class Base {

  constructor( paramId ) {
    this.paramId = paramId;
    this.previousParamOpCounter = ;
    this.behindOperationCount = 0;
  }

}
