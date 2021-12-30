export { test_FloatValue_Bounds };

import * as FloatValue from "../Unpacker/FloatValue.js";

/**
 *
 */
class Case {
  constructor( aLowerUpper, bLowerUpper, N, addedArray, multipledArray, aMultipledNArray ) {
    this.aBounds = new FloatValue.Bounds( aLowerUpper[ 0 ], aLowerUpper[ 1 ] );
    this.bBounds = new FloatValue.Bounds( bLowerUpper[ 0 ], bLowerUpper[ 1 ] );

    this.addedBounds = this.aBounds.clone().add_Bounds( this.bBounds );
    this.multipledBounds = this.aBounds.clone().multiply_Bounds( this.bBounds );
    this.aMultipledNBounds = this.aBounds.clone().multiply_N( N );

    this.assert_Bounds_byArray( "addedBounds", addedArray );
    this.assert_Bounds_byArray( "multipledBounds", multipledArray );
    this.assert_Bounds_byArray( "aMultipledNBounds", aMultipledNArray );

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

  assert_Bounds_byArray( strBoundsTestName, rhsArray ) {
    this.assert_lower_or_upper( strBoundsTestName, "lower", rhsArray, 0 );
    this.assert_lower_or_upper( strBoundsTestName, "upper", rhsArray, 1 );
  }

  assert_BoundsArray_byArray( strBoundsArrayTestName, rhsArray ) {
    let lhsArrayIndex = 0;
    this.assert_lowers_or_uppers( strBoundsArrayTestName, "lowers", lhsArrayIndex, rhsArray, 0 );
    this.assert_lowers_or_uppers( strBoundsArrayTestName, "uppers", lhsArrayIndex, rhsArray, 1 );
  }

  assert_lower_or_upper( strBoundsTestName, lower_or_upper_name, rhsArray, rhsArrayIndex ) {
    let thisValue = this[ strBoundsTestName ][ lower_or_upper_name ];
    let rhsArrayValue = rhsArray[ rhsArrayIndex ];
    tf.util.assert( thisValue == rhsArrayValue,
      `test_FloatValue_Bounds(): Case.${strBoundsTestName}.${lower_or_upper_name} ( ${thisValue} ) should be ( ${rhsArrayValue} ).` );
  }

  assert_lowers_or_uppers( strBoundsArrayTestName, lowers_or_uppers_name, lhsArrayIndex, rhsArray, rhsArrayIndex ) {
    let thisValue = this[ strBoundsArrayTestName ][ lowers_or_uppers_name ][ lhsArrayIndex ];
    let rhsArrayValue = rhsArray[ rhsArrayIndex ];
    tf.util.assert( thisValue == rhsArrayValue, `test_FloatValue_Bounds(): `
      + `Case.${strBoundsArrayTestName}.${lowers_or_uppers_name}[ ${lhsArrayIndex} ] ( ${thisValue} ) should be ( ${rhsArrayValue} ).` );
  }
}

test_FloatValue_Bounds() {

  let caseArray = [
    new Case( [  1,  2 ], [  3,  4 ],  5, [  4,  6 ], [  3,  8 ], [   5,  10 ] ),
    new Case( [ -1,  2 ], [  3,  4 ],  5, [  2,  6 ], [ -4,  8 ], [  -5,  10 ] ),
    new Case( [  1, -2 ], [  3,  4 ],  5, [  1,  5 ], [ -8,  4 ], [ -10,   5 ] ),
    new Case( [ -1, -2 ], [  3,  4 ],  5, [  1,  3 ], [ -8, -3 ], [ -10,  -5 ] ),

    new Case( [  1,  2 ], [ -3,  4 ], -5, [ -2,  6 ], [ -6,  8 ], [ -10,  -5 ] ),
    new Case( [ -1,  2 ], [ -3,  4 ], -5, [ -4,  6 ], [ -6,  8 ], [ -10,   5 ] ),
    new Case( [  1, -2 ], [ -3,  4 ], -5, [ -5,  5 ], [ -8,  6 ], [  -5,  10 ] ),
    new Case( [ -1, -2 ], [ -3,  4 ], -5, [ -5,  3 ], [ -8,  6 ], [   5,  10 ] ),

    new Case( [  1,  2 ], [  3, -4 ],  5, [ -3,  5 ], [ -8,  6 ], [   5,  10 ] ),
    new Case( [ -1,  2 ], [  3, -4 ],  5, [ -5,  5 ], [ -8,  6 ], [  -5,  10 ] ),
    new Case( [  1, -2 ], [  3, -4 ],  5, [ -6,  4 ], [ -6,  8 ], [ -10,   5 ] ),
    new Case( [ -1, -2 ], [  3, -4 ],  5, [ -6,  2 ], [ -6,  8 ], [ -10,  -5 ] ),

    new Case( [  1,  2 ], [ -3, -4 ], -5, [ -3, -1 ], [ -8, -3 ], [ -10,  -5 ] ),
    new Case( [ -1,  2 ], [ -3, -4 ], -5, [ -5, -1 ], [ -8,  4 ], [ -10,   5 ] ),
    new Case( [  1, -2 ], [ -3, -4 ], -5, [ -6, -2 ], [ -4,  8 ], [  -5,  10 ] ),
    new Case( [ -1, -2 ], [ -3, -4 ], -5, [ -6, -4 ], [  3,  8 ], [   5,  10 ] ),
  ];

}
