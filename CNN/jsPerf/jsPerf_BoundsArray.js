export { test_FloatValue_Bounds };

import * as RandTools from "../util/RandTools.js";
import * as FloatValue from "../Unpacker/FloatValue.js";

/**
 * For testing Bounds.
 *
 */
class Case {
  constructor( aLowerUpper, bLowerUpper, N, addedArray, multipledArray, aMultipledNArray ) {
    this.N = N;
    this.addedArray = addedArray;
    this.multipledArray = multipledArray;
    this.aMultipledNArray = aMultipledNArray;

    this.aBounds = new FloatValue.Bounds( aLowerUpper[ 0 ], aLowerUpper[ 1 ] );
    this.bBounds = new FloatValue.Bounds( bLowerUpper[ 0 ], bLowerUpper[ 1 ] );

    this.addedBounds = this.aBounds.clone().add_byBounds( this.bBounds );
    this.multipledBounds = this.aBounds.clone().multiply_byBounds( this.bBounds );
    this.aMultipledNBounds = this.aBounds.clone().multiply_byN( N );

    this.assert_Bounds_byArray( "addedBounds", addedArray );
    this.assert_Bounds_byArray( "multipledBounds", multipledArray );
    this.assert_Bounds_byArray( "aMultipledNBounds", aMultipledNArray );
  }

  assert_Bounds_byArray( strBoundsTestName, rhsArray ) {
    this.assert_lower_or_upper( strBoundsTestName, "lower", rhsArray, 0 );
    this.assert_lower_or_upper( strBoundsTestName, "upper", rhsArray, 1 );
  }

  assert_lower_or_upper( strBoundsTestName, lower_or_upper_name, rhsArray, rhsArrayIndex ) {
    let thisValue = this[ strBoundsTestName ][ lower_or_upper_name ];
    let rhsArrayValue = rhsArray[ rhsArrayIndex ];
    tf.util.assert( thisValue == rhsArrayValue,
      `test_FloatValue_Bounds(): Case.${strBoundsTestName}.${lower_or_upper_name} ( ${thisValue} ) should be ( ${rhsArrayValue} ).` );
  }
}

/**
 * For testing BoundsArray.
 *
 */
class Cases {
  /**
   * @param {Case[]} aCaseArray  Multiple Case objects.
   */
  constructor( aCaseArray ) {
    this.aCaseArray = aCaseArray;

    this.tAssertNumberArray = [ 0, 0 ]; // For reducing momory allocation.
    let tBounds = new Bounds( 0, 0 ); // For speed up assertion.

    let oneRandIndex = RandTools.getRandomIntInclusive( 0, ( aCaseArray.length - 1 ) ); // Randomly select one.
    let oneRandCase = aCaseArray[ oneRandIndex ];
    {
      let aLower = oneRandCase.aBounds.lower;
      let aUpper = oneRandCase.aBounds.upper;
      let bLower = oneRandCase.bBounds.lower;
      let bUpper = oneRandCase.bBounds.upper;
      let N = oneRandCase.N;

//!!! ...unfinished... (2021/12/30) set

//???
      // BoundsArray all with one same bounds.
      let BoundsArrayLength = aCaseArray.length;
      this.aBoundsArrayOne = new FloatValue.BoundsArray( BoundsArrayLength );
      this.bBoundsArrayOne = new FloatValue.BoundsArray( BoundsArrayLength );

      this.aBoundsArrayOne.set_one_byN( 0, N );
      this.assert_BoundsArray_one_byArray( "aBoundsArrayOne", 0, [ N, N ] );

      this.aBoundsArrayOne.set_one_byLowerUpper( 1, aLower, aUpper );
      this.assert_BoundsArray_one_byArray( "aBoundsArrayOne", 1, [ aLower, aUpper ] );
      
      this.aBoundsArrayOne.set_one_byBounds( 2, oneRandCase.bBounds );
      this.assert_BoundsArray_one_byArray( "aBoundsArrayOne", 2, [ bLower, bUpper ] );

      this.aBoundsArrayOne.set_one_byNs( 3, [ N - 1 , N, N + 1 ], 1 );
      this.assert_BoundsArray_one_byArray( "aBoundsArrayOne", 3, [ N, N ] );


      this.bBoundsArrayOne.set_one_byLowersUppers( 0, [ aLower, bLower ], [ aUpper, bUpper ], 1 );
      this.assert_BoundsArray_one_byArray( "bBoundsArrayOne", 0, [ bLower, bUpper ] );

      this.bBoundsArrayOne.set_one_byBoundsArray( 1, this.aBoundsArrayOne, 1 );
      this.assert_BoundsArray_one_byArray( "bBoundsArrayOne", 1, [ aLower, aUpper ] );

      let NsNs = ( new Array( aCaseArray.length ) ).fill( [ N, N ] );
      this.aBoundsArrayOne.set_all_byN( N );
      this.assert_BoundsArray_all_byArrayArray( "aBoundsArrayOne", NsNs ] );

      {
        let aLowersUppers = ( new Array( aCaseArray.length ) ).fill( [ aLower, aUpper ] );
        this.aBoundsArrayOne.set_all_byLowerUpper( aLower, aUpper );
        this.assert_BoundsArray_all_byArrayArray( "aBoundsArrayOne", aLowersUppers );

        this.bBoundsArrayOne.set_all_byBounds( oneRandCase.aBounds );
        this.assert_BoundsArray_all_byArrayArray( "bBoundsArrayOne", aLowersUppers );
      }

//!!! ...unfinished... (2021/12/30) set

      this.aBoundsArrayOne.set_all_byBounds( oneRandCase.aBounds );
      this.aBoundsArrayOne.multiply_one_byN( 0, N );
      this.assert_BoundsArray_one_byArray( "aBoundsArrayOne", 0, [ aLower + N, aUpper + N ] );




    }

    // Convert multiple Bounds into one BoundsArray.
    this.aLowers = new Array( aCaseArray.length );
    this.aUppers = new Array( aCaseArray.length );
    this.aLowersUppers = new Array( aCaseArray.length ); // [ [ lowers0, uppers0 ], [ lowers1, uppers1 ], ... ]
    this.bLowers = new Array( aCaseArray.length );
    this.bUppers = new Array( aCaseArray.length );
    this.bLowersUppers = new Array( aCaseArray.length ); // [ [ lowers0, uppers0 ], [ lowers1, uppers1 ], ... ]
    this.Ns = new Array( aCaseArray.length );
    this.NsNs = new Array( aCaseArray.length );          // [ [ lowers0, uppers0 ], [ lowers1, uppers1 ], ... ]
    this.addedArrayArray = new Array( aCaseArray.length );       // [ [ lowers0, uppers0 ], [ lowers1, uppers1 ], ... ]
    this.multipledArrayArray = new Array( aCaseArray.length );   // [ [ lowers0, uppers0 ], [ lowers1, uppers1 ], ... ]
    this.aMultipledNArrayArray = new Array( aCaseArray.length ); // [ [ lowers0, uppers0 ], [ lowers1, uppers1 ], ... ]

    for ( let i = 0; i < aCaseArray.length; ++i ) {
      let oneCase = aCaseArray[ i ];

      this.aLowers[ i ] = oneCase.aBounds.lower;
      this.aUppers[ i ] = oneCase.aBounds.upper;
      this.aLowersUppers[ i ] = [ oneCase.aBounds.lower, oneCase.aBounds.upper ];

      this.bLowers[ i ] = oneCase.bBounds.lower;
      this.bUppers[ i ] = oneCase.bBounds.upper;
      this.bLowersUppers[ i ] = [ oneCase.bBounds.lower, oneCase.bBounds.upper ];

      this.Ns[ i ] = oneCase.N;
      this.NsNs[ i ] = [ oneCase.N, oneCase.N ];

      this.addedArrayArray[ i ] = oneCase.addedArray;
      this.multipledArrayArray[ i ] = oneCase.multipledArray;
      this.aMultipledNArrayArray[ i ] = oneCase.aMultipledNArray;
    }

    this.aBoundsArray = new FloatValue.BoundsArray( aCaseArray.length );
    this.bBoundsArray = new FloatValue.BoundsArray( aCaseArray.length );

    // Clone
    {
      let clonedBoundsArray = this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).clone();

      for ( let i = 0; i < aCaseArray.length; ++i ) {
        this.assert_BoundsArray_one_byLowerUpper( "aBoundsArray", i, clonedBoundsArray.lowers[ i ], clonedBoundsArray.uppers[ i ] );
      }
    }

//!!! ...unfinished... (2021/12/30) set

    // Set
    {
      this.aBoundsArray.set_one_byN( 0, oneRandCase.N );
      tBounds.set_byN( oneRandCase.N );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 0, tBounds );

      this.aBoundsArray.set_one_byLowerUpper( 1, this.aLowers[ 1 ], this.aUppers[ 1 ] );
      tBounds.set_byLowerUpper( this.aLowers[ 1 ], this.aUppers[ 1 ] );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 1, tBounds );

      this.aBoundsArray.set_one_byBounds( 2, aCaseArray[ 2 ].bBounds );
      tBounds.set_one_byBounds( aCaseArray[ 2 ].bBounds );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 2, tBounds );

      this.aBoundsArray.set_one_byNs( 3, this.Ns, 3 );
      tBounds.set_byN( this.Ns[ 3 ] );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 3, tBounds );

//!!! ...unfinished... (2021/12/31) set

      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );

      this.aBoundsArray.add_one_byLowersUppers( 0, this.bLowers, this.bUppers, 0 );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 0, this.addedArrayArray[ 0 ] );

      this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
      this.aBoundsArray.add_one_byBoundsArray( 1, this.bBoundsArray, 1 );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 1, this.addedArrayArray[ 1 ] );

      { // Test add_all_byN().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byN( oneRandCase.N );

        let tBounds = new Bounds( 0, 0 );
        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).add_byN( oneRandCase.N );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test add_all_byLowerUpper() and add_all_byBounds().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers )
          .add_all_byLowerUpper( oneRandCase.bBounds.lower, oneRandCase.bBounds.upper );

        this.bBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byBounds( oneRandCase.bBounds );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).add_byLowerUpper( oneRandCase.bBounds.lower, oneRandCase.bBounds.upper );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
          this.assert_BoundsArray_one_byBounds( "bBoundsArray", i, tBounds );
        }
      }

      { // Test add_all_byNs().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byNs( this.Ns );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).add_byN( this.Ns[ i ] );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test add_all_byLowersUppers().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byLowersUppers( this.bLowers, this.bUppers );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).add_byLowerUpper( this.bLowers[ i ], this.bUppers[ i ] );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test add_all_byBoundsArray().
        this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byBoundsArray( this.bBoundsArray );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).add_byLowerUpper( this.bLowers[ i ], this.bUppers[ i ] );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }



//!!! ...unfinished... (2021/12/31) set

      this.aBoundsArray.set_all_byNs( this.Ns );
      this.assert_BoundsArray_all_byArrayArray( "aBoundsArray", this.NsNs );

      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );
      this.assert_BoundsArray_all_byArrayArray( "aBoundsArray", this.aLowersUppers );
      
      this.bBoundsArray.set_all_byBoundsArray( this.aBoundsArray );
      this.assert_BoundsArray_all_byArrayArray( "bBoundsArray", this.aLowersUppers );
    }

//!!! ...unfinished... (2021/12/31) by this.addedArrayArray[]

    // Add
    {
      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );

      this.aBoundsArray.add_one_byN( 0, oneRandCase.N );
      tBounds.set_byLowerUpper( this.aLowers[ 0 ], this.aUppers[ 0 ] ).add_byN( oneRandCase.N );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 0, tBounds );

      this.aBoundsArray.add_one_byLowerUpper( 1, this.bLowers[ 1 ], this.bUppers[ 1 ] );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 1, this.addedArrayArray[ 1 ] );

      this.aBoundsArray.add_one_byBounds( 2, aCaseArray[ 2 ].bBounds );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 2, this.addedArrayArray[ 2 ] );

      this.aBoundsArray.add_one_byNs( 3, this.Ns, 3 );
      tBounds.set_byLowerUpper( this.aLowers[ 3 ], this.aUppers[ 3 ] ).add_byN( this.Ns[ 3 ] );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 3, tBounds );

      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );

      this.aBoundsArray.add_one_byLowersUppers( 0, this.bLowers, this.bUppers, 0 );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 0, this.addedArrayArray[ 0 ] );

      this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
      this.aBoundsArray.add_one_byBoundsArray( 1, this.bBoundsArray, 1 );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 1, this.addedArrayArray[ 1 ] );

      { // Test add_all_byN().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byN( oneRandCase.N );

        let tBounds = new Bounds( 0, 0 );
        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).add_byN( oneRandCase.N );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test add_all_byLowerUpper() and add_all_byBounds().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers )
          .add_all_byLowerUpper( oneRandCase.bBounds.lower, oneRandCase.bBounds.upper );

        this.bBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byBounds( oneRandCase.bBounds );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).add_byLowerUpper( oneRandCase.bBounds.lower, oneRandCase.bBounds.upper );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
          this.assert_BoundsArray_one_byBounds( "bBoundsArray", i, tBounds );
        }
      }

      { // Test add_all_byNs().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byNs( this.Ns );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).add_byN( this.Ns[ i ] );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test add_all_byLowersUppers().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byLowersUppers( this.bLowers, this.bUppers );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).add_byLowerUpper( this.bLowers[ i ], this.bUppers[ i ] );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test add_all_byBoundsArray().
        this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byBoundsArray( this.bBoundsArray );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).add_byLowerUpper( this.bLowers[ i ], this.bUppers[ i ] );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }
    }

//!!! ...unfinished... (2021/12/31) by this.multipledArrayArray[]

    // Multiply.
    {
      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );

      this.aBoundsArray.multiply_one_byN( 0, oneRandCase.N );
      tBounds.set_byLowerUpper( this.aLowers[ 0 ], this.aUppers[ 0 ] ).multiply_byN( oneRandCase.N );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 0, tBounds );

      this.aBoundsArray.multiply_one_byLowerUpper( 1, this.bLowers[ 1 ], this.bUppers[ 1 ] );
      tBounds.set_byLowerUpper( this.aLowers[ 1 ], this.aUppers[ 1 ] ).multiply_byLowerUpper( this.bLowers[ 1 ], this.bUppers[ 1 ] );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 1, tBounds );

      this.aBoundsArray.multiply_one_byBounds( 2, aCaseArray[ 2 ].bBounds );
      tBounds.set_byLowerUpper( this.aLowers[ 2 ], this.aUppers[ 2 ] ).multiply_byBounds( aCaseArray[ 2 ].bBounds );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 2, tBounds );

      this.aBoundsArray.multiply_one_byNs( 3, this.Ns, 3 );
      tBounds.set_byLowerUpper( this.aLowers[ 3 ], this.aUppers[ 3 ] ).multiply_byN( this.Ns[ 3 ] );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 3, tBounds );

      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );

      this.aBoundsArray.multiply_one_byLowersUppers( 0, this.bLowers, this.bUppers, 0 );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 0, this.multipledArrayArray[ 0 ] );

      this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
      this.aBoundsArray.multiply_one_byBoundsArray( 1, this.bBoundsArray, 1 );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 1, this.multipledArrayArray[ 1 ] );

      { // Test multiply_all_byN().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).aBoundsArray.multiply_all_byN( oneRandCase.N );

        let tBounds = new Bounds( 0, 0 );
        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).multiply_byN( oneRandCase.N );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test multiply_all_byLowerUpper() and multiply_all_byBounds().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers )
          .multiply_all_byLowerUpper( oneRandCase.bBounds.lower, oneRandCase.bBounds.upper );

        this.bBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).multiply_all_byBounds( oneRandCase.bBounds );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] )
            .multiply_byLowerUpper( oneRandCase.bBounds.lower, oneRandCase.bBounds.upper );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
          this.assert_BoundsArray_one_byBounds( "bBoundsArray", i, tBounds );
        }
      }

      { // Test multiply_all_byNs().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).multiply_all_byNs( this.Ns );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).add_byN( this.Ns[ i ] );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test multiply_all_byLowersUppers().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );
        this.aBoundsArray.multiply_all_byLowersUppers( this.bLowers, this.bUppers );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).multiply_byLowerUpper( this.bLowers[ i ], this.bUppers[ i ] );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test multiply_all_byBoundsArray().
        this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).multiply_all_byBoundsArray( this.bBoundsArray );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowerUpper( this.aLowers[ i ], this.aUppers[ i ] ).multiply_byLowerUpper( this.bLowers[ i ], this.bUppers[ i ] );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

//!!! ...unfinished... (2021/12/30) multiply: multiply_all_byBoundsArray_multiply_all_byNs( 
      
    }

//!!!
      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );
      this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
      
      

    }

//!!!
    let BoundsArrayLength = 1;
    this.aBoundsArray = ( new FloatValue.BoundsArray( BoundsArrayLength ) ).set_one_byLowerUpper( aLowerUpper[ 0 ], aLowerUpper[ 1 ] );
    this.bBoundsArray = ( new FloatValue.BoundsArray( BoundsArrayLength ) ).set_one_byLowerUpper( bLowerUpper[ 0 ], bLowerUpper[ 1 ] );

    this.addedBoundsArray = this.aBoundsArray.clone().add_BoundsArray( this.bBoundsArray );
    this.multipledBoundsArray = this.aBoundsArray.clone().multiply_BoundsArray( this.bBoundsArray );
    this.aMultipledNBoundsArray = this.aBoundsArray.clone().multiply_N( N );

    this.assert_BoundsArray_byArray( "addedBoundsArray", addedArray );
    this.assert_BoundsArray_byArray( "multipledBoundsArray", multipledArray );
    this.assert_BoundsArray_byArray( "aMultipledNBoundsArray", aMultipledNArray );

  }

  assert_BoundsArray_all_byArrayArray( strBoundsArrayTestName, rhsArrayArray ) {
    let count = this[ strBoundsArrayTestName ].lowers.length;
    for ( let lhsArrayIndex = 0; lhsArrayIndex < count; ++lhsArrayIndex ) {
      this.assert_lowers_or_uppers( strBoundsArrayTestName, "lowers", lhsArrayIndex, rhsArrayArray[ lhsArrayIndex ], 0 );
      this.assert_lowers_or_uppers( strBoundsArrayTestName, "uppers", lhsArrayIndex, rhsArrayArray[ lhsArrayIndex ], 1 );
    }
  }

  assert_BoundsArray_one_byLowerUpper( strBoundsArrayTestName, lhsArrayIndex, rhsLower, rhsUpper ) {
    this.tAssertNumberArray[ 0 ] = rhsLower
    this.tAssertNumberArray[ 1 ] = rhsUpper;
    this.assert_BoundsArray_one_byArray( strBoundsArrayTestName, lhsArrayIndex, this.tAssertNumberArray );
  }

  assert_BoundsArray_one_byBounds( strBoundsArrayTestName, lhsArrayIndex, rhsBounds ) {
    this.assert_BoundsArray_one_byLowerUpper( strBoundsArrayTestName, lhsArrayIndex, rhsBounds.lower, rhsBounds.upper );
  }

  assert_BoundsArray_one_byArray( strBoundsArrayTestName, lhsArrayIndex, rhsArray ) {
    this.assert_lowers_or_uppers( strBoundsArrayTestName, "lowers", lhsArrayIndex, rhsArray, 0 );
    this.assert_lowers_or_uppers( strBoundsArrayTestName, "uppers", lhsArrayIndex, rhsArray, 1 );
  }

  assert_lowers_or_uppers( strBoundsArrayTestName, lowers_or_uppers_name, lhsArrayIndex, rhsArray, rhsArrayIndex ) {
    let thisValue = this[ strBoundsArrayTestName ][ lowers_or_uppers_name ][ lhsArrayIndex ];
    let rhsArrayValue = rhsArray[ rhsArrayIndex ];
    tf.util.assert( thisValue == rhsArrayValue, `test_FloatValue_Bounds(): `
      + `Case.${strBoundsArrayTestName}.${lowers_or_uppers_name}[ ${lhsArrayIndex} ] ( ${thisValue} ) should be ( ${rhsArrayValue} ).` );
  }

}

function test_FloatValue_Bounds() {

  let casesArray = [
    new Cases( [
      new Case( [  1,  2 ], [  3,  4 ],  5, [  4,  6 ], [  3,  8 ], [   5,  10 ] ),
      new Case( [ -1,  2 ], [  3,  4 ],  5, [  2,  6 ], [ -4,  8 ], [  -5,  10 ] ),
      new Case( [  1, -2 ], [  3,  4 ],  5, [  1,  5 ], [ -8,  4 ], [ -10,   5 ] ),
      new Case( [ -1, -2 ], [  3,  4 ],  5, [  1,  3 ], [ -8, -3 ], [ -10,  -5 ] ),
    ] ),

    new Cases( [
      new Case( [  1,  2 ], [ -3,  4 ], -5, [ -2,  6 ], [ -6,  8 ], [ -10,  -5 ] ),
      new Case( [ -1,  2 ], [ -3,  4 ], -5, [ -4,  6 ], [ -6,  8 ], [ -10,   5 ] ),
      new Case( [  1, -2 ], [ -3,  4 ], -5, [ -5,  5 ], [ -8,  6 ], [  -5,  10 ] ),
      new Case( [ -1, -2 ], [ -3,  4 ], -5, [ -5,  3 ], [ -8,  6 ], [   5,  10 ] ),
    ] ),

    new Cases( [
      new Case( [  1,  2 ], [  3, -4 ],  5, [ -3,  5 ], [ -8,  6 ], [   5,  10 ] ),
      new Case( [ -1,  2 ], [  3, -4 ],  5, [ -5,  5 ], [ -8,  6 ], [  -5,  10 ] ),
      new Case( [  1, -2 ], [  3, -4 ],  5, [ -6,  4 ], [ -6,  8 ], [ -10,   5 ] ),
      new Case( [ -1, -2 ], [  3, -4 ],  5, [ -6,  2 ], [ -6,  8 ], [ -10,  -5 ] ),
    ] ),

    new Cases( [
      new Case( [  1,  2 ], [ -3, -4 ], -5, [ -3, -1 ], [ -8, -3 ], [ -10,  -5 ] ),
      new Case( [ -1,  2 ], [ -3, -4 ], -5, [ -5, -1 ], [ -8,  4 ], [ -10,   5 ] ),
      new Case( [  1, -2 ], [ -3, -4 ], -5, [ -6, -2 ], [ -4,  8 ], [  -5,  10 ] ),
      new Case( [ -1, -2 ], [ -3, -4 ], -5, [ -6, -4 ], [  3,  8 ], [   5,  10 ] ),
    ] ),
  ];

}
