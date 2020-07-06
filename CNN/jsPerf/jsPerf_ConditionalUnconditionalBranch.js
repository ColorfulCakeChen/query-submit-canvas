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
      this.aOp = this.arrayOp[ 0 ] = TestSet.a1;
    } else {
      this.aOp = this.arrayOp[ 0 ] = TestSet.a2;
    }

    if ( this.b ) {
      this.bOp = this.arrayOp[ 1 ] = TestSet.b3;
    } else {
      this.bOp = this.arrayOp[ 1 ] = TestSet.b4;
    }

    if ( this.c ) {
      this.cOp = this.arrayOp[ 2 ] = TestSet.c5;
    } else {
      this.cOp = this.arrayOp[ 2 ] = TestSet.c6;
    }

    if ( this.d ) {
      this.dOp = this.arrayOp[ 3 ] = TestSet.d7;
    } else {
      this.dOp = this.arrayOp[ 3 ] = TestSet.d8;
    }

  }

  static a1() { return this.a + 1; }
  static a2() { return this.a + 2; }
  static b3() { return this.b + 3; }
  static b4() { return this.b + 4; }
  static c5() { return this.c + 5; }
  static c6() { return this.c + 6; }
  static d7() { return this.d + 7; }
  static b8() { return this.d + 8; }

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
  testResultSame() {
    this.test_ConditionalBranch();
    this.test_UnconditionalBranch();
    this.test_UnconditionalBranchArray();
    this.test_UnconditionalBranchArrayLoopIndex();
    this.test_UnconditionalBranchArrayLoopIndexLocal();
    this.test_UnconditionalBranchArrayLoopIterator();
  }
 
}


globalThis.testSet = new TestSet();
