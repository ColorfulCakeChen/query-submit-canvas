export { filtersTensor4d_biasesTensor3d };

/**
 * An object contains filtersTensor4d and biasesTensor3d, and a method to dispose them.
 */
class filtersTensor4d_biasesTensor3d {

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
