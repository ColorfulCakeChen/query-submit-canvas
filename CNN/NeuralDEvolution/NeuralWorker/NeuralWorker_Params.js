export { NeuralWorker_Params as Params };


//!!! ...unfinished... (2023/05/02)
// The interpretation of from_output_valueArray (which contains one or
// two alignments) should be according to NeuralWorker_Mode.
// So, these Feedback related operations should belong to NeuralWorker.

/**
 *
 *
 */
class NeuralWorker_Params {

  output_channelCount_per_alignment;

//!!! ...unfinished... (2023/05/06)
// alignmentMarkValueArray can NOT be placed here because
// alignemt mark value should be changable during the lifetime
// of a neural network.

}
