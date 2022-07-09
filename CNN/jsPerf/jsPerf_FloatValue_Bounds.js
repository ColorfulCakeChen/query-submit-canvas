export { testCorrectness };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as RandTools from "../util/RandTools.js";
import * as FloatValue from "../Unpacker/FloatValue.js";

/**
 * For testing Bounds.
 *
 */
class Case {

  /**
   * @param {number} caseId  The id of this test case.
   */
  constructor( caseId, aLowerUpper, bLowerUpper, N, clampedArray, addedArray, multipledArray, aMultipledNArray ) {
    this.caseId = caseId;
    this.aBounds = FloatValue.Bounds.Pool.get_or_create_by( aLowerUpper[ 0 ], aLowerUpper[ 1 ] );
    this.bBounds = FloatValue.Bounds.Pool.get_or_create_by( bLowerUpper[ 0 ], bLowerUpper[ 1 ] );
    this.N = N;
    this.clampedArray = clampedArray;
    this.addedArray = addedArray;
    this.multipledArray = multipledArray;
    this.aMultipledNArray = aMultipledNArray;

    this.clampedBounds = this.aBounds.clone().clamp_byBounds( this.bBounds );
    this.addedBounds = this.aBounds.clone().add_byBounds( this.bBounds );
    this.multipledBounds = this.aBounds.clone().multiply_byBounds( this.bBounds );
    this.aMultipledNBounds = this.aBounds.clone().multiply_byN( N );

    this.assert_Bounds_byArray( "clampedBounds", clampedArray );
    this.assert_Bounds_byArray( "addedBounds", addedArray );
    this.assert_Bounds_byArray( "multipledBounds", multipledArray );
    this.assert_Bounds_byArray( "aMultipledNBounds", aMultipledNArray );

    { // Test multiply_byBounds_multiply_byN().
      this.mmBounds = this.aBounds.clone().multiply_byBounds_multiply_byN( this.bBounds, N );
      let rhsBounds = this.aBounds.clone().multiply_byBounds( this.bBounds ).multiply_byN( N );
      this.assert_Bounds_byBounds( "mmBounds", rhsBounds );
      rhsBounds.disposeResources_and_recycleToPool();
    }

    { // Test scaleTranslate_byScaleTranslate().
      let aScaleTranslate = new FloatValue.ScaleTranslate(
        RandTools.getRandomIntInclusive( -10, +10 ), RandTools.getRandomIntInclusive( -10, +10 ) ); // Random scale-translate.

      this.stBounds = this.aBounds.clone().scaleTranslate_byScaleTranslate( aScaleTranslate );
      let rhsBounds = this.aBounds.clone().multiply_byN( aScaleTranslate.scale ).add_byN( aScaleTranslate.translate );
      this.assert_Bounds_byBounds( "stBounds", rhsBounds );
      rhsBounds.disposeResources_and_recycleToPool();
    }

    { // Test clamp_or_zeroIfNaN().
      let randValue;
      if ( RandTools.getRandomIntInclusive( 0, 9 ) == 0 ) { // 10% is NaN.
        randValue = Number.NaN;
      } else {
        randValue = RandTools.getRandomIntInclusive( -1000, +1000 );
      }

      let clampedValue = this.aBounds.clamp_or_zeroIfNaN( randValue );

      if ( Number.isNaN( clampedValue ) == true )
        throw Error( `jsPerf_FloatValue_Bounds.Cases().one_clamp_or_zeroIfNaN(): `
          + `clamp ( ${randValue} ) got ( ${clampedValue} ) should never be NaN.` );

      if ( ( clampedValue < this.aBounds.lower ) || ( clampedValue > this.aBounds.upper ) )
        throw Error( `jsPerf_FloatValue_Bounds.Cases().one_clamp_or_zeroIfNaN(): `
          + `clamp ( ${randValue} ) got ( ${clampedValue} ) should between `
          + `[ ${this.aBounds.lower}, ${this.aBounds.upper} ].` );
    }

  }

  /**  */
  disposeResources() {
    this.aBounds.disposeResources_and_recycleToPool();
    this.bBounds.disposeResources_and_recycleToPool();

    this.clampedBounds.disposeResources_and_recycleToPool();
    this.addedBounds.disposeResources_and_recycleToPool();
    this.multipledBounds.disposeResources_and_recycleToPool();
    this.aMultipledNBounds.disposeResources_and_recycleToPool();

    this.mmBounds.disposeResources_and_recycleToPool();
    this.stBounds.disposeResources_and_recycleToPool();
  }

  assert_Bounds_byBounds( strBoundsTestName, rhsBounds ) {
    this.assert_Bounds_byLowerUpper( strBoundsTestName, rhsBounds.lower, rhsBounds.upper );
  }

  assert_Bounds_byArray( strBoundsTestName, rhsArray ) {
    this.assert_Bounds_byLowerUpper( strBoundsTestName, rhsArray[ 0 ], rhsArray[ 1 ] );
  }

  assert_Bounds_byLowerUpper( strBoundsTestName, rhsLower, rhsUpper ) {
    this.assert_lower_or_upper( strBoundsTestName, "lower", rhsLower );
    this.assert_lower_or_upper( strBoundsTestName, "upper", rhsUpper );
  }

  assert_lower_or_upper( strBoundsTestName, lower_or_upper_name, rhsArrayValue ) {
    let thisValue = this[ strBoundsTestName ][ lower_or_upper_name ];
    if ( thisValue != rhsArrayValue )
      throw Error( `jsPerf_FloatValue_Bounds.testCorrectness(): `
        + `Case( caseId = ${this.caseId} ).${strBoundsTestName}.${lower_or_upper_name} `
        + `( ${thisValue} ) should be ( ${rhsArrayValue} ).` );
  }
}

/**
 * For testing BoundsArray.
 *
 */
class Cases {
  /**
   * @param {number} casesId     The id of this test cases.
   * @param {Case[]} aCaseArray  Multiple Case objects.
   */
  constructor( casesId, aCaseArray ) {
    this.casesId = casesId;
    this.aCaseArray = aCaseArray;

    this.tAssertNumberArray = [ 0, 0 ]; // For reducing momory allocation.
    let tBounds = FloatValue.Bounds.Pool.get_or_create_by( 0, 0 ); // For speed up assertion.

    let oneRandIndex = RandTools.getRandomIntInclusive( 0, ( aCaseArray.length - 1 ) ); // Randomly select one.
    let oneRandCase = aCaseArray[ oneRandIndex ];

    // Convert multiple Bounds into one BoundsArray.
    this.aLowers = Recyclabe.Array.Pool.get_or_create_by( aCaseArray.length );
    this.aUppers = Recyclabe.Array.Pool.get_or_create_by( aCaseArray.length );
    this.aLowersUppers = Recyclabe.Array.Pool.get_or_create_by( aCaseArray.length ); // [ [ lowers0, uppers0 ], [ lowers1, uppers1 ], ... ]
    this.bLowers = Recyclabe.Array.Pool.get_or_create_by( aCaseArray.length );
    this.bUppers = Recyclabe.Array.Pool.get_or_create_by( aCaseArray.length );
    this.bLowersUppers = Recyclabe.Array.Pool.get_or_create_by( aCaseArray.length ); // [ [ lowers0, uppers0 ], [ lowers1, uppers1 ], ... ]
    this.Ns = Recyclabe.Array.Pool.get_or_create_by( aCaseArray.length );
    this.NsNs = Recyclabe.Array.Pool.get_or_create_by( aCaseArray.length );          // [ [ lowers0, uppers0 ], [ lowers1, uppers1 ], ... ]
    this.clampedArrayArray = Recyclabe.Array.Pool.get_or_create_by( aCaseArray.length );     // [ [ lowers0, uppers0 ], [ lowers1, uppers1 ], ... ]
    this.addedArrayArray = Recyclabe.Array.Pool.get_or_create_by( aCaseArray.length );       // [ [ lowers0, uppers0 ], [ lowers1, uppers1 ], ... ]
    this.multipledArrayArray = Recyclabe.Array.Pool.get_or_create_by( aCaseArray.length );   // [ [ lowers0, uppers0 ], [ lowers1, uppers1 ], ... ]
    this.aMultipledNArrayArray = Recyclabe.Array.Pool.get_or_create_by( aCaseArray.length ); // [ [ lowers0, uppers0 ], [ lowers1, uppers1 ], ... ]

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

      this.clampedArrayArray[ i ] = oneCase.clampedArray;
      this.addedArrayArray[ i ] = oneCase.addedArray;
      this.multipledArrayArray[ i ] = oneCase.multipledArray;
      this.aMultipledNArrayArray[ i ] = oneCase.aMultipledNArray;
    }

    this.aBoundsArray = FloatValue.BoundsArray.Pool.get_or_create_by( aCaseArray.length );
    this.bBoundsArray = FloatValue.BoundsArray.Pool.get_or_create_by( aCaseArray.length );

    // Clone
    {
      let clonedBoundsArray = this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).clone();

      for ( let i = 0; i < aCaseArray.length; ++i ) {
        this.assert_BoundsArray_one_byLowerUpper( "aBoundsArray", i, clonedBoundsArray.lowers[ i ], clonedBoundsArray.uppers[ i ] );
      }
    }

    // Set
    {
      this.aBoundsArray.set_one_byN( 0, oneRandCase.N );
      tBounds.set_byN( oneRandCase.N );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 0, tBounds );

      this.aBoundsArray.set_one_byLowerUpper( 1, this.aLowers[ 1 ], this.aUppers[ 1 ] );
      tBounds.set_byLowerUpper( this.aLowers[ 1 ], this.aUppers[ 1 ] );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 1, tBounds );

      this.aBoundsArray.set_one_byBounds( 2, aCaseArray[ 2 ].bBounds );
      tBounds.set_byBounds( aCaseArray[ 2 ].bBounds );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 2, tBounds );

      this.aBoundsArray.set_one_byNs( 3, this.Ns, 3 );
      tBounds.set_byN( this.Ns[ 3 ] );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 3, tBounds );

      this.aBoundsArray.set_one_byLowersUppers( 0, this.aLowers, this.aUppers, 0 );
      tBounds.set_byLowerUpper( this.aLowers[ 0 ], this.aUppers[ 0 ] );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 0, tBounds );

      this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
      this.aBoundsArray.set_one_byBoundsArray( 1, this.bBoundsArray, 1 );
      this.assert_BoundsArray_one_byLowerUpper( "aBoundsArray", 1, this.bBoundsArray.lowers[ 1 ], this.bBoundsArray.uppers[ 1 ] );

      { // Test set_all_byN().
        this.aBoundsArray.set_all_byN( oneRandCase.N );

        tBounds.set_byN( oneRandCase.N );
        for ( let i = 0; i < aCaseArray.length; ++i ) {
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test set_all_byLowerUpper().
        this.aBoundsArray.set_all_byLowerUpper( oneRandCase.bBounds.lower, oneRandCase.bBounds.upper );

        tBounds.set_byLowerUpper( oneRandCase.bBounds.lower, oneRandCase.bBounds.upper );
        for ( let i = 0; i < aCaseArray.length; ++i ) {
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test set_all_byBounds().
        this.aBoundsArray.set_all_byBounds( oneRandCase.bBounds );

        tBounds.set_byBounds( oneRandCase.bBounds );
        for ( let i = 0; i < aCaseArray.length; ++i ) {
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test add_all_byNs().
        this.aBoundsArray.set_all_byNs( this.Ns );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byNs( this.Ns, i );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test set_all_byLowersUppers().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowersUppers( this.aLowers, this.aUppers, i );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test set_all_byBoundsArray().
        this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
        this.aBoundsArray.set_all_byBoundsArray( this.bBoundsArray );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowersUppers( this.bLowers, this.bUppers, i );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }
    }

    // Clamp
    {
      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );

      this.aBoundsArray.clamp_one_byLowerUpper( 1, this.bLowers[ 1 ], this.bUppers[ 1 ] );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 1, this.clampedArrayArray[ 1 ] );

      this.aBoundsArray.clamp_one_byBounds( 2, aCaseArray[ 2 ].bBounds );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 2, this.clampedArrayArray[ 2 ] );

      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );

      this.aBoundsArray.clamp_one_byLowersUppers( 0, this.bLowers, this.bUppers, 0 );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 0, this.clampedArrayArray[ 0 ] );

      this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
      this.aBoundsArray.clamp_one_byBoundsArray( 1, this.bBoundsArray, 1 );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 1, this.clampedArrayArray[ 1 ] );

      { // Test clamp_all_byLowerUpper() and clamp_all_byBounds().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers )
          .clamp_all_byLowerUpper( oneRandCase.bBounds.lower, oneRandCase.bBounds.upper );

        this.bBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).clamp_all_byBounds( oneRandCase.bBounds );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowersUppers( this.aLowers, this.aUppers, i ).clamp_byBounds( oneRandCase.bBounds );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
          this.assert_BoundsArray_one_byBounds( "bBoundsArray", i, tBounds );
        }
      }

      { // Test clamp_all_byLowersUppers().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).clamp_all_byLowersUppers( this.bLowers, this.bUppers );
        this.assert_BoundsArray_all_byArrayArray( "aBoundsArray", this.clampedArrayArray );
      }

      { // Test add_all_byBoundsArray().
        this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).clamp_all_byBoundsArray( this.bBoundsArray );
        this.assert_BoundsArray_all_byArrayArray( "aBoundsArray", this.clampedArrayArray );
      }
    }

    // Add
    {
      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );

      this.aBoundsArray.add_one_byN( 0, oneRandCase.N );
      tBounds.set_byLowersUppers( this.aLowers, this.aUppers, 0 ).add_byN( oneRandCase.N );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 0, tBounds );

      this.aBoundsArray.add_one_byLowerUpper( 1, this.bLowers[ 1 ], this.bUppers[ 1 ] );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 1, this.addedArrayArray[ 1 ] );

      this.aBoundsArray.add_one_byBounds( 2, aCaseArray[ 2 ].bBounds );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 2, this.addedArrayArray[ 2 ] );

      this.aBoundsArray.add_one_byNs( 3, this.Ns, 3 );
      tBounds.set_byLowersUppers( this.aLowers, this.aUppers, 3 ).add_byNs( this.Ns, 3 );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 3, tBounds );

      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );

      this.aBoundsArray.add_one_byLowersUppers( 0, this.bLowers, this.bUppers, 0 );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 0, this.addedArrayArray[ 0 ] );

      this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
      this.aBoundsArray.add_one_byBoundsArray( 1, this.bBoundsArray, 1 );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 1, this.addedArrayArray[ 1 ] );

      { // Test add_all_byN().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byN( oneRandCase.N );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowersUppers( this.aLowers, this.aUppers, i ).add_byN( oneRandCase.N );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test add_all_byLowerUpper() and add_all_byBounds().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers )
          .add_all_byLowerUpper( oneRandCase.bBounds.lower, oneRandCase.bBounds.upper );

        this.bBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byBounds( oneRandCase.bBounds );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowersUppers( this.aLowers, this.aUppers, i ).add_byBounds( oneRandCase.bBounds );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
          this.assert_BoundsArray_one_byBounds( "bBoundsArray", i, tBounds );
        }
      }

      { // Test add_all_byNs().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byNs( this.Ns );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowersUppers( this.aLowers, this.aUppers, i ).add_byNs( this.Ns, i );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test add_all_byLowersUppers().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byLowersUppers( this.bLowers, this.bUppers );
        this.assert_BoundsArray_all_byArrayArray( "aBoundsArray", this.addedArrayArray );
      }

      { // Test add_all_byBoundsArray().
        this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).add_all_byBoundsArray( this.bBoundsArray );
        this.assert_BoundsArray_all_byArrayArray( "aBoundsArray", this.addedArrayArray );
      }
    }

    // Multiply.
    {
      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );

      this.aBoundsArray.multiply_one_byN( 0, this.Ns[ 0 ] );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 0, this.aMultipledNArrayArray[ 0 ] );

      this.aBoundsArray.multiply_one_byLowerUpper( 1, this.bLowers[ 1 ], this.bUppers[ 1 ] );
      tBounds.set_byLowersUppers( this.aLowers, this.aUppers, 1 ).multiply_byLowersUppers( this.bLowers, this.bUppers, 1 );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 1, tBounds );

      this.aBoundsArray.multiply_one_byBounds( 2, aCaseArray[ 2 ].bBounds );
      tBounds.set_byLowersUppers( this.aLowers, this.aUppers, 2 ).multiply_byBounds( aCaseArray[ 2 ].bBounds );
      this.assert_BoundsArray_one_byBounds( "aBoundsArray", 2, tBounds );

      this.aBoundsArray.multiply_one_byNs( 3, this.Ns, 3 );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 3, this.aMultipledNArrayArray[ 3 ] );

      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );

      this.aBoundsArray.multiply_one_byLowersUppers( 0, this.bLowers, this.bUppers, 0 );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 0, this.multipledArrayArray[ 0 ] );

      this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
      this.aBoundsArray.multiply_one_byBoundsArray( 1, this.bBoundsArray, 1 );
      this.assert_BoundsArray_one_byArray( "aBoundsArray", 1, this.multipledArrayArray[ 1 ] );

      { // Test multiply_all_byN().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).multiply_all_byN( oneRandCase.N );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowersUppers( this.aLowers, this.aUppers, i ).multiply_byN( oneRandCase.N );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }

      { // Test multiply_all_byLowerUpper() and multiply_all_byBounds().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers )
          .multiply_all_byLowerUpper( oneRandCase.bBounds.lower, oneRandCase.bBounds.upper );

        this.bBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).multiply_all_byBounds( oneRandCase.bBounds );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowersUppers( this.aLowers, this.aUppers, i )
            .multiply_byBounds( oneRandCase.bBounds );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
          this.assert_BoundsArray_one_byBounds( "bBoundsArray", i, tBounds );
        }
      }

      { // Test multiply_all_byNs().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).multiply_all_byNs( this.Ns );
        this.assert_BoundsArray_all_byArrayArray( "aBoundsArray", this.aMultipledNArrayArray );
      }

      { // Test multiply_all_byLowersUppers().
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).multiply_all_byLowersUppers( this.bLowers, this.bUppers );
        this.assert_BoundsArray_all_byArrayArray( "aBoundsArray", this.multipledArrayArray );
      }

      { // Test multiply_all_byBoundsArray().
        this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).multiply_all_byBoundsArray( this.bBoundsArray );
        this.assert_BoundsArray_all_byArrayArray( "aBoundsArray", this.multipledArrayArray );
      }

      { // Test multiply_all_byBoundsArray_multiply_all_byNs().
        this.bBoundsArray.set_all_byLowersUppers( this.bLowers, this.bUppers );
        this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers )
          .multiply_all_byBoundsArray_multiply_all_byNs( this.bBoundsArray, this.Ns );

        for ( let i = 0; i < aCaseArray.length; ++i ) {
          tBounds.set_byLowersUppers( this.aLowers, this.aUppers, i )
            .multiply_byLowersUppers( this.bLowers, this.bUppers, i ).multiply_byNs( this.Ns, i );
          this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
        }
      }
    }

    { // scaleTranslate_all_byScaleTranslateArray().
      let aScaleTranslateArray = new FloatValue.ScaleTranslateArray( aCaseArray.length );
      {
        for ( let i = 0; i < aCaseArray.length; ++i ) { // Random scale-translate.
          aScaleTranslateArray.scales[ i ] = RandTools.getRandomIntInclusive( -10, +10 );
          aScaleTranslateArray.translates[ i ] = RandTools.getRandomIntInclusive( -10, +10 );
        }
      }

      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers ).scaleTranslate_all_byScaleTranslateArray( aScaleTranslateArray );

      let aScaleTranslate = new FloatValue.ScaleTranslate();
      for ( let i = 0; i < aCaseArray.length; ++i ) {
        aScaleTranslate.set_by_scale_translate( aScaleTranslateArray.scales[ i ], aScaleTranslateArray.translates[ i ] );
        tBounds.set_byLowersUppers( this.aLowers, this.aUppers, i ).scaleTranslate_byScaleTranslate( aScaleTranslate );
        this.assert_BoundsArray_one_byBounds( "aBoundsArray", i, tBounds );
      }
    }

    { // Test one_clamp_or_zeroIfNaN().
      this.aBoundsArray.set_all_byLowersUppers( this.aLowers, this.aUppers );

      for ( let i = 0; i < aCaseArray.length; ++i ) {
        let randValue;
        if ( RandTools.getRandomIntInclusive( 0, 9 ) == 0 ) { // 10% is NaN.
          randValue = Number.NaN;
        } else {
          randValue = RandTools.getRandomIntInclusive( -1000, +1000 );
        }

        let lhsValue = this.aBoundsArray.one_clamp_or_zeroIfNaN( i, randValue );
        let rhsValue = tBounds.set_byLowersUppers( this.aLowers, this.aUppers, i ).clamp_or_zeroIfNaN( randValue );

        if ( lhsValue != rhsValue )
          throw Error( `jsPerf_FloatValue_Bounds.Cases().one_clamp_or_zeroIfNaN(): `
            + `lhsValue ( ${lhsValue} ) should be rhsValue ( ${rhsValue} ).` );
      }
    }

    // Release resources.
    {
      tBounds.disposeResources_and_recycleToPool();
      tBounds = null;

      this.disposeResources();
    }
  }

  /**  */
  disposeResources() {
    this.aLowers.disposeResources_and_recycleToPool();
    this.aUppers.disposeResources_and_recycleToPool();
    this.aLowersUppers.disposeResources_and_recycleToPool();
    this.bLowers.disposeResources_and_recycleToPool();
    this.bUppers.disposeResources_and_recycleToPool();
    this.bLowersUppers.disposeResources_and_recycleToPool();
    this.Ns.disposeResources_and_recycleToPool();
    this.NsNs.disposeResources_and_recycleToPool();
    this.clampedArrayArray.disposeResources_and_recycleToPool();
    this.addedArrayArray.disposeResources_and_recycleToPool();
    this.multipledArrayArray.disposeResources_and_recycleToPool();
    this.aMultipledNArrayArray.disposeResources_and_recycleToPool();

    this.aBoundsArray.disposeResources_and_recycleToPool();
    this.bBoundsArray.disposeResources_and_recycleToPool();

    for ( let i = 0; i < this.aCaseArray.length; ++i ) {
      this.aCaseArray[ i ].disposeResources();
      this.aCaseArray[ i ] = null;
    }
  }

  assert_BoundsArray_all_byArrayArray( strBoundsArrayTestName, rhsArrayArray ) {
    let count = this[ strBoundsArrayTestName ].lowers.length;
    for ( let lhsArrayIndex = 0; lhsArrayIndex < count; ++lhsArrayIndex ) {
      this.assert_BoundsArray_one_byArray( strBoundsArrayTestName, lhsArrayIndex, rhsArrayArray[ lhsArrayIndex ] );
    }
  }

  assert_BoundsArray_one_byBounds( strBoundsArrayTestName, lhsArrayIndex, rhsBounds ) {
    this.assert_BoundsArray_one_byLowerUpper( strBoundsArrayTestName, lhsArrayIndex, rhsBounds.lower, rhsBounds.upper );
  }

  assert_BoundsArray_one_byArray( strBoundsArrayTestName, lhsArrayIndex, rhsArray ) {
    this.assert_BoundsArray_one_byLowerUpper( strBoundsArrayTestName, lhsArrayIndex, rhsArray[ 0 ], rhsArray[ 1 ] );
  }

  assert_BoundsArray_one_byLowerUpper( strBoundsArrayTestName, lhsArrayIndex, rhsLower, rhsUpper ) {
    this.assert_lowers_or_uppers( strBoundsArrayTestName, "lowers", lhsArrayIndex, rhsLower );
    this.assert_lowers_or_uppers( strBoundsArrayTestName, "uppers", lhsArrayIndex, rhsUpper );
  }

  assert_lowers_or_uppers( strBoundsArrayTestName, lowers_or_uppers_name, lhsArrayIndex, rhsArrayValue ) {
    let thisValue = this[ strBoundsArrayTestName ][ lowers_or_uppers_name ][ lhsArrayIndex ];
    if ( thisValue != rhsArrayValue )
      throw Error( `jsPerf_FloatValue_Bounds.testCorrectness(): `
        + `Cases( casesId = ${this.casesId} ).${strBoundsArrayTestName}.${lowers_or_uppers_name}[ ${lhsArrayIndex} ] `
        + `( ${thisValue} ) should be ( ${rhsArrayValue} ).` );
  }

}

function testCorrectness() {

//!!! (2022/07/03 Remarked) dispose manually.
//  Pool.All.sessionCall( () => {

    let casesArray = [
      new Cases( 0, [
        new Case(  0, [  1,  2 ], [  3,  4 ],  5, [  3,  3 ], [  4,  6 ], [  3,  8 ], [   5,  10 ] ),
        new Case(  1, [ -1,  2 ], [  3,  4 ],  5, [  3,  3 ], [  2,  6 ], [ -4,  8 ], [  -5,  10 ] ),
        new Case(  2, [  1, -2 ], [  3,  4 ],  5, [  3,  3 ], [  1,  5 ], [ -8,  4 ], [ -10,   5 ] ),
        new Case(  3, [ -1, -2 ], [  3,  4 ],  5, [  3,  3 ], [  1,  3 ], [ -8, -3 ], [ -10,  -5 ] ),
      ] ),

      new Cases( 1, [
        new Case( 10, [  1,  2 ], [ -3,  4 ], -5, [  1,  2 ], [ -2,  6 ], [  -6,  8 ], [ -10,  -5 ] ),
        new Case( 11, [ -1,  2 ], [ -3,  4 ], -5, [ -1,  2 ], [ -4,  6 ], [  -6,  8 ], [ -10,   5 ] ),
        new Case( 12, [  1, -2 ], [ -3,  4 ], -5, [ -2,  1 ], [ -5,  5 ], [  -8,  6 ], [  -5,  10 ] ),
        new Case( 13, [ -1, -2 ], [ -3,  4 ], -5, [ -2, -1 ], [ -5,  3 ], [  -8,  6 ], [   5,  10 ] ),
      ] ),

      new Cases( 2, [
        new Case( 20, [  1,  2 ], [  3, -4 ],  5, [  1,  2 ], [ -3,  5 ], [  -8,  6 ], [   5,  10 ] ),
        new Case( 21, [ -1,  2 ], [  3, -4 ],  5, [ -1,  2 ], [ -5,  5 ], [  -8,  6 ], [  -5,  10 ] ),
        new Case( 22, [  1, -2 ], [  3, -4 ],  5, [ -2,  1 ], [ -6,  4 ], [  -6,  8 ], [ -10,   5 ] ),
        new Case( 23, [ -1, -2 ], [  3, -4 ],  5, [ -2, -1 ], [ -6,  2 ], [  -6,  8 ], [ -10,  -5 ] ),
      ] ),

      new Cases( 3, [
        new Case( 30, [  1,  2 ], [ -3, -4 ], -5, [ -3, -3 ], [ -3, -1 ], [  -8, -3 ], [ -10,  -5 ] ),
        new Case( 31, [ -1,  2 ], [ -3, -4 ], -5, [ -3, -3 ], [ -5, -1 ], [  -8,  4 ], [ -10,   5 ] ),
        new Case( 32, [  1, -2 ], [ -3, -4 ], -5, [ -3, -3 ], [ -6, -2 ], [  -4,  8 ], [  -5,  10 ] ),
        new Case( 33, [ -1, -2 ], [ -3, -4 ], -5, [ -3, -3 ], [ -6, -4 ], [   3,  8 ], [   5,  10 ] ),
      ] ),


      new Cases( 4, [
        new Case( 40, [  1,  3 ], [  2,  4 ],  5, [  2,  3 ], [  3,  7 ], [   2, 12 ], [   5,  15 ] ),
        new Case( 41, [ -1,  3 ], [  2,  4 ],  5, [  2,  3 ], [  1,  7 ], [  -4, 12 ], [  -5,  15 ] ),
        new Case( 42, [  1, -3 ], [  2,  4 ],  5, [  2,  2 ], [ -1,  5 ], [ -12,  4 ], [ -15,   5 ] ),
        new Case( 43, [ -1, -3 ], [  2,  4 ],  5, [  2,  2 ], [ -1,  3 ], [ -12, -2 ], [ -15,  -5 ] ),
      ] ),

      new Cases( 5, [
        new Case( 50, [  1,  3 ], [ -2,  4 ], -5, [  1,  3 ], [ -1,  7 ], [  -6, 12 ], [ -15,  -5 ] ),
        new Case( 51, [ -1,  3 ], [ -2,  4 ], -5, [ -1,  3 ], [ -3,  7 ], [  -6, 12 ], [ -15,   5 ] ),
        new Case( 52, [  1, -3 ], [ -2,  4 ], -5, [ -2,  1 ], [ -5,  5 ], [ -12,  6 ], [  -5,  15 ] ),
        new Case( 53, [ -1, -3 ], [ -2,  4 ], -5, [ -2, -1 ], [ -5,  3 ], [ -12,  6 ], [   5,  15 ] ),
      ] ),

      new Cases( 6, [
        new Case( 60, [  1,  3 ], [  2, -4 ],  5, [  1,  2 ], [ -3,  5 ], [ -12,  6 ], [   5,  15 ] ),
        new Case( 61, [ -1,  3 ], [  2, -4 ],  5, [ -1,  2 ], [ -5,  5 ], [ -12,  6 ], [  -5,  15 ] ),
        new Case( 62, [  1, -3 ], [  2, -4 ],  5, [ -3,  1 ], [ -7,  3 ], [  -6, 12 ], [ -15,   5 ] ),
        new Case( 63, [ -1, -3 ], [  2, -4 ],  5, [ -3, -1 ], [ -7,  1 ], [  -6, 12 ], [ -15,  -5 ] ),
      ] ),

      new Cases( 7, [
        new Case( 70, [  1,  3 ], [ -2, -4 ], -5, [ -2, -2 ], [ -3,  1 ], [ -12, -2 ], [ -15,  -5 ] ),
        new Case( 71, [ -1,  3 ], [ -2, -4 ], -5, [ -2, -2 ], [ -5,  1 ], [ -12,  4 ], [ -15,   5 ] ),
        new Case( 72, [  1, -3 ], [ -2, -4 ], -5, [ -3, -2 ], [ -7, -1 ], [  -4, 12 ], [  -5,  15 ] ),
        new Case( 73, [ -1, -3 ], [ -2, -4 ], -5, [ -3, -2 ], [ -7, -3 ], [   2, 12 ], [   5,  15 ] ),
      ] ),

    ];

//!!! (2022/07/03 Remarked) dispose manually.
//  });
}
