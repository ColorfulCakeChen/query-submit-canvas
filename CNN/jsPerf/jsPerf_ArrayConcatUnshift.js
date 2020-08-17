
/**
 * Test performancce of array concat and unshift.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/9225/0/colorfulcakechen-array-concat-unshift-f38d5e6c5a6a0096f}
 */

/**
 * A test set.
 */
class TestSet {

  /**
   */
  constructor( arrayListLength ) {

    this.arrayListLength = arrayListLength;
    this.arrayList = new Array( arrayListLength );

    for ( let i = 0; i < this.arrayListLength; ++i ) {
      this.arrayList[ i ] = new Array( 1 );
      this.arrayList[ i ][ 0 ] = i;
    }
  }

  test_ArrayConcat() {
    let result = [];
    for ( let i = 0; i < this.arrayListLength; ++i ) {
      result = result.concat( this.arrayList[ i ] );
    }
  }

  test_ArrayUnshift() {
    let result = [];
    for ( let i = ( this.arrayListLength - 1 ); i >= 0; --i ) {
      result.unshift( ...this.arrayList[ i ] );
    }
  }

  // Testing whether the results of different implementation are the same. Also, pre-compile the codes.
  async testCaseLoader() {
    this.test_ArrayConcat();
    this.test_ArrayUnshift();
  }
 
}


globalThis.testSet = new TestSet( 100 );
