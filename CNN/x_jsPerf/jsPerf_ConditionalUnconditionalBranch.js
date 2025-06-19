//import * as TensorTools from "../util/TensorTools.js";

/**
 * Test performancce of conditional and unconditional branch.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/9224/5/colorfulcakechen-conditional-unconditional-branch-8a90e}
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

  static a1( p ) { return Math.sin( this.a + 1 ) + p; }
  static a2( p ) { return Math.sin( this.a + 2 ) + p; }
  static b3( p ) { return Math.sin( this.b + 3 ) + p; }
  static b4( p ) { return Math.sin( this.b + 4 ) + p; }
  static c5( p ) { return Math.sin( this.c + 5 ) + p; }
  static c6( p ) { return Math.sin( this.c + 6 ) + p; }
  static d7( p ) { return Math.sin( this.d + 7 ) + p; }
  static d8( p ) { return Math.sin( this.d + 8 ) + p; }

  test_ConditionalBranch() {
    let p = 1;
    let r;

    if ( this.a ) {
      r = Math.sin( this.a + 1 ) + p;
    } else {
      r = Math.sin( this.a + 2 ) + p;
    }

    if ( this.b ) {
      r = Math.sin( this.b + 3 ) + p;
    } else {
      r = Math.sin( this.b + 4 ) + p;
    }

    if ( this.c ) {
      r = Math.sin( this.c + 5 ) + p;
    } else {
      r = Math.sin( this.c + 6 ) + p;
    }

    if ( this.d ) {
      r = Math.sin( this.d + 7 ) + p;
    } else {
      r = Math.sin( this.d + 8 ) + p;
    }
  }

  test_UnconditionalBranch() {
    let p = 1;
    let r;

    r = this.aOp( p );
    r = this.bOp( p );
    r = this.cOp( p );
    r = this.dOp( p );
  }

  test_UnconditionalBranchTry() {
    try {
      let p = 1;
      let r;

      r = this.aOp( p );
      r = this.bOp( p );
      r = this.cOp( p );
      r = this.dOp( p );
    } finally {
    }
  }

  test_UnconditionalBranchArray() {
    let p = 1;
    let r;

    r = this.arrayOp[ 0 ]( p );
    r = this.arrayOp[ 1 ]( p );
    r = this.arrayOp[ 2 ]( p );
    r = this.arrayOp[ 3 ]( p );
  }

  test_UnconditionalBranchArraySpread() {
    let p = 1;
    let r;

    let [ aOp, bOp, cOp, dOp ] = [ ...this.arrayOp ];
    r = aOp( p );
    r = bOp( p );
    r = cOp( p );
    r = dOp( p );
  }

  test_UnconditionalBranchArrayLoopIndex() {
    let p = 1;
    let r;

    for ( let i = 0; i < this.arrayOp.length; ++i ) {
      r = this.arrayOp[ i ]( p );
    }
  }

  test_UnconditionalBranchArrayLoopIndexLocal() {
    let p = 1;
    let r;

    let count = this.arrayOp.length;
    for ( let i = 0; i < count; ++i ) {
      r = this.arrayOp[ i ]( p );
    }
  }

  test_UnconditionalBranchArrayLoopIterator() {
    let p = 1;
    let r;

    for ( let op of this.arrayOp ) {
      r = op( p );
    }
  }

  test_UnconditionalBranchArrayLoopForEach() {
    let p = 1;
    let r;

    this.arrayOp.forEach( ( op ) => {
      r = op( p );
    });
  }

  test_UnconditionalBranchArrayLoopMap() {
    let p = 1;
    let r;

    this.arrayOp.map( ( op ) => {
      r = op( p );
    });
  }

  test_UnconditionalBranchArrayLoopIndexNewArray() {
    let p = 1;
    let r;

    let rArray = new Array( this.arrayOp.length );
    for ( let i = 0; i < this.arrayOp.length; ++i ) {
      rArray[ i ] = this.arrayOp[ i ];
      r = rArray[ i ]( p );
    }
  }

  test_UnconditionalBranchArrayLoopIndexLocalNewArray() {
    let p = 1;
    let r;

    let count = this.arrayOp.length;
    let rArray = new Array( count );
    for ( let i = 0; i < count; ++i ) {
      rArray[ i ] = this.arrayOp[ i ];
      r = rArray[ i ]( p );
    }
  }

  // Testing whether the results of different implementation are the same.
  // Also, pre-compile the codes.
  async testCaseLoader() {
    this.test_ConditionalBranch();
    this.test_UnconditionalBranch();
    this.test_UnconditionalBranchTry();
    this.test_UnconditionalBranchArray();
    this.test_UnconditionalBranchArraySpread();
    this.test_UnconditionalBranchArrayLoopIndex();
    this.test_UnconditionalBranchArrayLoopIndexLocal();
    this.test_UnconditionalBranchArrayLoopIterator();
    this.test_UnconditionalBranchArrayLoopForEach();
    this.test_UnconditionalBranchArrayLoopMap();
    this.test_UnconditionalBranchArrayLoopIndexNewArray();
    this.test_UnconditionalBranchArrayLoopIndexLocalNewArray();
  }
 
}


globalThis.testSet = new TestSet( 3, 2, 0, 1 );
