export { filtersTensor4d_biasesTensor3d };

/**
 * A function accepts a Base class and returns a sub-class of Base.
 *
 * @param {Class} Base
 *   The base class to be inherited.
 *
 * @return {Class}
 *   Return a sub-class of Base. The returned sub-class contains filtersTensor4d and biasesTensor3d, and a method to dispose them.
 */
let filtersTensor4d_biasesTensor3d = Base => class extends Base {
//!!! (2021/12/16 Remarked)
//class filtersTensor4d_biasesTensor3d {

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
