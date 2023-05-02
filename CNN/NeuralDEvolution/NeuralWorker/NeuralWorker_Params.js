export { NeuralWorker_Params as Params };


//!!! ...unfinished... (2023/05/02)
// The interpretation of from_output_valueArray (which contains one or
// two alignments) should be according to NeuralWorker_Mode.
// So, these Feedback related operations should belong to NeuralWorker.


//!!! ...unfinished... (2023/05/02)
// When training neural networks, NeuralWorker_Proxies is used.
// When real usage after training complete, NeuralWorker_Proxy should be used.
//
// However, what kind of ImageData_process_Xxx() should be called when real
// usage?
// It needs fill alignment mark and feedback but needs not post back source
// TypedArray.


//!!! ...unfinished... (2023/05/02)
// ImageData_process_Xxx() should be renamed since it accepts TypedArray
// instead of ImageData.


/**
 *
 *
 */
class NeuralWorker_Params {

}
