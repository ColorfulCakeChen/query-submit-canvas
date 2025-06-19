
/**
 * Test performancce of array concat, unshift, push, assign.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/9225/4/colorfulcakechen-array-concat-unshift-push-assign-f4890}
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

  test_ArrayAssign() {
    let result = new Array( this.arrayListLength );
    for ( let i = 0; i < this.arrayListLength; ++i ) {
      result[ i ]= this.arrayList[ i ][ 0 ];
    }
  }

  // Testing whether the results of different implementation are the same.
  // Also, pre-compile the codes.
  async testCaseLoader() {
    this.test_ArrayConcat();
    this.test_ArrayUnshift();
    this.test_ArrayPush();
    this.test_ArrayAssign();
  }
 
}


globalThis.testSet = new TestSet( 100 );
