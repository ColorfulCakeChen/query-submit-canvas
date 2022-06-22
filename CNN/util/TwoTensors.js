export { filtersTensor4d_biasesTensor3d };

/**
 * A function accepts a Base class and returns its sub-class which contains filtersTensor4d and biasesTensor3d, and a method to dispose them.
 *
 * @param {Class} ParentClass
 *   The parent class to be inherited. Default is Object.
 *
 * @return {Class}
 *   Return a sub-class of Base.
 */
let filtersTensor4d_biasesTensor3d = ( ParentClass = Object )  => class extends ParentClass {

  /**
   *
   */
  constructor( ...restArgs ) {
    super( ...restArgs );
  }

  /**
   * Release the tensors.
   */
  disposeResources() {
    if ( this.filtersTensor4d ) {
      this.filtersTensor4d.dispose();
      this.filtersTensor4d = null;
    }

    if ( this.biasesTensor3d ) {
      this.biasesTensor3d.dispose();
      this.biasesTensor3d = null;
    }

    // If parent class has the same method, call it.
    if ( super.disposeResources instanceof Function ) {
      super.disposeResources();
    }
  }

}
