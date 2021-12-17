export { filtersTensor4d_biasesTensor3d };

/**
 * A function accepts a Base class and returns a sub-class of Base.
 *
 * @param {Class} Base
 *   The base class to be inherited. Default is Object.
 *
 * @return {Class}
 *   Return a sub-class of Base. The returned sub-class contains filtersTensor4d and biasesTensor3d, and a method to dispose them.
 */
let filtersTensor4d_biasesTensor3d( ( Base = Object )  => class extends Base {

  /**
   * Release the tensors.
   */
  disposeTensors() {
    if ( this.filtersTensor4d ) {
      this.filtersTensor4d.dispose();
      this.filtersTensor4d = null;
    }

    if ( this.biasesTensor3d ) {
      this.biasesTensor3d.dispose();
      this.biasesTensor3d = null;
    }
  }

}
