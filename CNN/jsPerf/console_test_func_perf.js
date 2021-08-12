const x = tf.randomNormal([2000, 2000, 4]);
//const b = tf.randomNormal([2000, 2000, 4]);
//const b = tf.randomNormal([2000, 2000, 1]);
const b = tf.randomNormal([1, 1, 4]);

function foo( f ) {
  let times = 10; //10 * 1000;
  let y;
  for ( let i = 0; i < times; ++i ) {
  	y = f();
    y.dispose();
  }
}

let testFuncArray = [
  tf.add,
  tf.cos,
  tf.tanh,
  tf.sigmoid,
  tf.relu,
  tf.relu6,
  tf.log,
  tf.log1p
];

for ( let i = 0; i < testFuncArray.length; ++i ) {
  let testFunc = testFuncArray[ i ];
	let testFuncBind = testFunc.bind( null, x, b );
	let bar = foo.bind( null, testFuncBind );

	const time = await tf.time( bar );
	console.log(
    `${testFunc.name}, kernelMs: ${time.kernelMs}, wallTimeMs: ${time.wallMs}`);
}
