//import * as TensorTools from "../util/TensorTools.js";

/**
 * Test performancce of conditional and unconditional branch.
 *
 * @see {@link https://jsperf.com/colorfulcakechen-conditional-unconditional-branch}
 */

/**
 * A test set.
 */
class TestSet {

  /**
   */
  constructor( a, b, c, d ) {

    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;

    this.arrayOp = new Array( 4 );

    if ( this.a ) {
      this.aOp = TestSet.a1;
      this.arrayOp[ 0 ] = TestSet.a1.bind( this );
    } else {
      this.aOp = TestSet.a2;
      this.arrayOp[ 0 ] = TestSet.a2.bind( this );
    }

    if ( this.b ) {
      this.bOp = TestSet.b3;
      this.arrayOp[ 1 ] = TestSet.b3.bind( this );
    } else {
      this.bOp = TestSet.b4;
      this.arrayOp[ 1 ] = TestSet.b4.bind( this );
    }

    if ( this.c ) {
      this.cOp = TestSet.c5;
      this.arrayOp[ 2 ] = TestSet.c5.bind( this );
    } else {
      this.cOp = TestSet.c6;
      this.arrayOp[ 2 ] = TestSet.c6.bind( this );
    }

    if ( this.d ) {
      this.dOp = TestSet.d7;
      this.arrayOp[ 3 ] = TestSet.d7.bind( this );
    } else {
      this.dOp = TestSet.d8;
      this.arrayOp[ 3 ] = TestSet.d8.bind( this );
    }

  }

  static a1() { return this.a + 1; }
  static a2() { return this.a + 2; }
  static b3() { return this.b + 3; }
  static b4() { return this.b + 4; }
  static c5() { return this.c + 5; }
  static c6() { return this.c + 6; }
  static d7() { return this.d + 7; }
  static d8() { return this.d + 8; }

  test_ConditionalBranch() {
    let r;

    if ( this.a ) {
      r = this.a + 1;
    } else {
      r = this.a + 2;
    }

    if ( this.b ) {
      r = this.b + 3;
    } else {
      r = this.b + 4;
    }

    if ( this.c ) {
      r = this.c + 5;
    } else {
      r = this.c + 6;
    }

    if ( this.d ) {
      r = this.d + 7;
    } else {
      r = this.d + 8;
    }
  }

  test_UnconditionalBranch() {
    this.aOp();
    this.bOp();
    this.cOp();
    this.dOp();
  }

  test_UnconditionalBranchArray() {
    this.arrayOp[ 0 ]();
    this.arrayOp[ 1 ]();
    this.arrayOp[ 2 ]();
    this.arrayOp[ 3 ]();
  }

  test_UnconditionalBranchArraySpread() {
    let [ aOp, bOp, cOp, dOp ] = [ ...this.arrayOp ];
    aOp();
    bOp();
    cOp();
    dOp();
  }

  test_UnconditionalBranchArrayLoopIndex() {
    for ( let i = 0; i < this.arrayOp.length; ++i ) {
      this.arrayOp[ i ]();
    }
  }

  test_UnconditionalBranchArrayLoopIndexLocal() {
    let count = this.arrayOp.length;
    for ( let i = 0; i < count; ++i ) {
      this.arrayOp[ i ]();
    }
  }

  test_UnconditionalBranchArrayLoopIterator() {
    for ( let op of this.arrayOp ) {
      op();
    }
  }

  // Testing whether the results of different implementation are the same. Also, pre-compile the codes.
  async testCaseLoader() {
    this.test_ConditionalBranch();
    this.test_UnconditionalBranch();
    this.test_UnconditionalBranchArray();
    this.test_UnconditionalBranchArraySpread();
    this.test_UnconditionalBranchArrayLoopIndex();
    this.test_UnconditionalBranchArrayLoopIndexLocal();
    this.test_UnconditionalBranchArrayLoopIterator();
  }
 
}


globalThis.testSet = new TestSet( 3, 2, 0, 1 );
