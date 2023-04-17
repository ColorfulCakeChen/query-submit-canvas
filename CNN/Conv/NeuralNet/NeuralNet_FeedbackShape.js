export { NeuralNet_FeedbackShape as FeedbackShape };

//!!! ...unfinished... (2023/04/16)
/**
 *
 *
 *
 *
 * 1. Where to place recurrent feedback information in the next times input?
 *
 *
 * 1.1 From convolution operation's point of view:
 *
 *   - Neighbor pixels of the same channel can be moved to different channel
 *       of the same pixel by pointwise and then depthwise convolution filter.
 *
 *   - Different channel of the same pixel can also be moved to neighbor pixels
 *       of the same channel by depthwise and then pointwise convolution filter.
 *
 *   - So, it seems both feasible to place recurrent feedback information
 *       either on the neighbor pixels of the same channel or on the different
 *       channel of the same pixel.
 *
 *
 * 1.2 From information dimension's point of view:
 *
 *   - Neighbor pixels on the same channel has two dimensions information
 *       (top-bottom, left-right).
 *
 *   - Different channels of the same pixel has only one dimension (front-rear).
 *
 *   - So, it seems better a little to place recurrent feedback information as
 *       on the neighbor pixels of the same channel.
 *
 *
 * 1.3 From image's point of view:
 *
 *   - Channels are originally used to represent the relevant information of
 *       the same pixel.
 *
 *   - So, it should view the previous output as channels group. For example,
 *     - Suppose: Only 6 output values are needed, and per pixel has 4 channel.
 *     - Then: 24 (= 6 * 4 ) values should be outputted.
 *       - Element 0, 4, 8, 12, 16, 20 are output values.
 *       - Element 1, 2, 3 are extra recurrent feedback information of element 0.
 *       - Element 5, 6, 7 are extra recurrent feedback information of element 4.
 *       - ...
 *
 *
 */
class NeuralNet_FeedbackShape {

//!!! ...unfinished... (2023/04/17)

}
