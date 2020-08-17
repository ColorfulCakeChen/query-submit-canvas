
/**
 * Test performancce of array concat and unshift.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/9225/3/colorfulcakechen-array-concat-unshift-7442a507b6dfd6798}
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

  test_ArrayPush() {
    let result = [];
    for ( let i = 0; i < this.arrayListLength; ++i ) {
      result.push( ...this.arrayList[ i ] );
    }
  }

  // Testing whether the results of different implementation are the same. Also, pre-compile the codes.
  async testCaseLoader() {
    this.test_ArrayConcat();
    this.test_ArrayUnshift();
    this.test_ArrayPush();
  }
 
}


globalThis.testSet = new TestSet( 100 );
