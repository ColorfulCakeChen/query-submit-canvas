export { Comparator };

/**
 * An channel shuffler accepts a list of tensor3d with same size (height, width, channel) and outputs a shuffled
 * (re-grouped) list tensor3d.
 *
 * Usually, the output tensor3d list length will be the same as input tensor3d list. Even more, the size of 
 * every output tensor3d will also be the same as input tensor3d. However, the order of the tensor3d's channels
 * (the 3rd dimension) are different.
 *
 * This is the Channel-Shuffle operation of the ShuffleNetV2 neural network.
 *
 *
 *
 *
 * @member {ShuffleInfo} shuffleInfo
 *   The information calculated from init()'s concatenatedShape and outputGroupCount.
 */
class Comparator {

  /** @return Return true, if two array of tensor are equal by value. */
  static isTensorArrayEqual( tensorArray1, tensorArray2 ) {

    if ( tensorArray1 === tensorArray2 )
      return true;

    if ( tensorArray1 == null || tensorArray2 == null )
      return false;

    if ( tensorArray1.length !== tensorArray2.length )
      return false;

    for ( let i = 0; i < tensorArray1.length; ++i ) {  // Compare every element of each tensor.
      let allElementEqual = tf.tidy( "ChannelShuffler.Layer.isTensorArrayEqual", () => {
        let everyElementEqualTensor1d = tensorArray1[ i ].equal( tensorArray2[ i ] );
        let allElementEqualTensor1d = everyElementEqualTensor1d.all();
        return allElementEqualTensor1d.arraySync(); // 0: false. 1: true.
      });

      if ( !allElementEqual )
        return false;
    }

    return true;
  }

}
