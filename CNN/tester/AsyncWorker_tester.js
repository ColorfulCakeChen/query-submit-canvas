export { tester };

import * as ValueMax from "../util/ValueMax.js";
import { AsyncWorker_Proxy_tester } from "./AsyncWorker_Proxy_tester.js";

/** */
class NumberSequenceInfo {

  constructor(
    sequenceName,
    intervalMilliseconds, valueBegin, valueCountTotal, valueCountPerBoost,
    workerProxy,
  ) {
    this.sequenceName = sequenceName;
    this.intervalMilliseconds = intervalMilliseconds;
    this.valueBegin = valueBegin;
    this.valueCountTotal = valueCountTotal;
    this.valueCountPerBoost = valueCountPerBoost;
    this.workerProxy = workerProxy;
  }
}

/**
 * @return {Promise}
 *   Return a promise which will be resolved as specified value after specified
 * milliseconds.
 */
function delayedValue( milliseconds, value ) {
  return new Promise( ( resolve /*, reject*/ ) => {
    setTimeout( () => resolve( value ), milliseconds );
  } );
}

/**
 * Test a WorkerProxy's initialization.
 *
 * @param {AsyncWorker_Proxy_tester} workerProxy
 */
async function test_WorkerProxy_init( { workerProxy }, workerId ) {
  let initWorkerPromise = workerProxy.initWorker_async( workerId );
  let initWorkerOk = await initWorkerPromise;
  if ( initWorkerOk == false )
    throw Error( `AsyncWorker_tester.testWorkerProxy(): `
      `workerId=${workerId}, initWorker failed.`
    );

  //!!! (2022/09/14 Remarked)
  // // Test: unknown command.
  // let not_existed_command_result;
  // try {
  //   not_existed_command_result
  //     = await workerProxy.createPromise_by_postCommandArgs( [
  //     "not_existed_command"
  //   ] );
  // } catch ( e ) {
  //   //debugger;
  //   console.log( e );
  // }
}

/**
 * Test a WorkerProxy's processing queue size whether is zero.
 *
 * @param {AsyncWorker_Proxy_tester} workerProxy
 */
async function test_WorkerProxy_processingQueueSize_zero( { workerProxy } ) {
  let processingQueueSize = workerProxy.the_processingId_Resulter_Map.size;
  if ( processingQueueSize != 0 )
    throw Error( `AsyncWorker_tester.test_WorkerProxy_processingQueueSize(): `
      + `workerId=${workerProxy.workerId}, `
      + `processingQueueSize ( ${processingQueueSize} ) should be 0.`
    );
}

/**
 * Test a WorkerProxy for generating number sequence.
 *
 * @param {AsyncWorker_Proxy_tester} workerProxy
 * 
 * @param {number} nextMilliseconds
 *   - Negative: No await before call numberResulter.next().
 *   - Other value: await so many milliseconds before call numberResulter.next().
 */
async function test_WorkerProxy_numberSequence(
  {
    sequenceName,
    intervalMilliseconds,
    valueBegin,
    valueCountTotal,
    valueCountPerBoost,
    workerProxy,
  },
  nextMilliseconds,
) {
  const workerId = workerProxy.workerId;

  let numberResulter = workerProxy.number_sequence_asyncGenerator(
    intervalMilliseconds, valueBegin, valueCountTotal, valueCountPerBoost );

  let valueIndex = 0;
  let valueTest = valueBegin;
  let numberResulterNext, done, value;
  do {
    if ( nextMilliseconds >= 0 )
      delayedValue( nextMilliseconds );

    numberResulterNext = await numberResulter.next();
    ( { done, value } = numberResulterNext );

    if ( valueTest != value )
      throw Error( `AsyncWorker_tester.test_WorkerProxy_numberSequence(): `
        + `sequenceName="${sequenceName}", workerId=${workerId}, `
        + `valueIndex=${valueIndex}, `
        + `value ( ${value} ) should be the same as valueTest ( ${valueTest} ).`
      );

    ++valueIndex;
    ++valueTest;

  } while ( !done );

  let valueTestFinal = valueBegin + valueCountTotal - 1;
  if ( valueTestFinal != value )
      throw Error( `AsyncWorker_tester.test_WorkerProxy_numberSequence(): `
        + `sequenceName="${sequenceName}", workerId=${workerId}, `
        + `value ( ${value} ) should be the same as valueTestFinal ( ${valueTestFinal} ).`
    );
}

async function test_WorkerProxy_numberSequence( NumberSequenceInfo ) {
  
}

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent. The
 * created progressToAdvance will be increased when every time advanced. The
 * progressParent.root_get() will be returned when every time yield.
 *
 */
async function* tester( progressParent ) {
  console.log( "AsyncWorker testing..." );

//!!! (2022/09/14 Temp Remarked) lesser.
  const valueCountTotal = 100;
  //const valueCountTotal = 10;

  let progressRoot = progressParent.root_get();

  let progressMax =
      1 // one worker
    + 1 // two workers
    + 1 // three workers
    ;

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( progressMax ) );

  // All boost.
  let allBoost = {
    sequenceName: "allBoost",
    intervalMilliseconds: 10,
    valueBegin: 0,
    valueCountTotal: valueCountTotal,
    valueCountPerBoost: valueCountTotal,
    workerProxy: undefined,
  };

  // All non-boost.
  const allNonBoost = {
    sequenceName: "allNonBoost",
    intervalMilliseconds: 150,
    valueBegin: 50,
    valueCountTotal: valueCountTotal,
    valueCountPerBoost: 0,
    workerProxy: undefined,
  };

  // Interleave boost and non-boost.
  const interleave_Boost_NonBoost = {
    sequenceName: "interleave_Boost_NonBoost",
    intervalMilliseconds: 90,
    valueBegin: 120,
    valueCountTotal: valueCountTotal,
    valueCountPerBoost: Math.ceil( valueCountTotal / 11 ),
    workerProxy: undefined,
  };

//!!! ...unfinished... (2022/09/14)
// Try whether or not delayedValue() before test_WorkerProxy_numberSequence()

  // 1. One woker, three number sequences.
  {
    allBoost.workerProxy
      = allNonBoost.workerProxy
      = interleave_Boost_NonBoost.workerProxy
      = AsyncWorker_Proxy_tester.Pool.get_or_create_by();
  
    await test_WorkerProxy_init( allBoost, 1 );

//!!!
    if ( )
      await delayedValue( ???, ?? );

    await Promise.all( [
      test_WorkerProxy_numberSequence( allBoost ),
      test_WorkerProxy_numberSequence( allNonBoost ),
      test_WorkerProxy_numberSequence( interleave_Boost_NonBoost )
    ] );

    test_WorkerProxy_processingQueueSize_zero( allBoost );

    allBoost.workerProxy.disposeResources_and_recycleToPool();

    allBoost.workerProxy
      = allNonBoost.workerProxy
      = interleave_Boost_NonBoost.workerProxy
      = null;

    progressToAdvance.value_advance();
    yield progressRoot;
  }

  // 2. Two wokers, three number sequences.
  {
    allBoost.workerProxy
      = AsyncWorker_Proxy_tester.Pool.get_or_create_by();

    allNonBoost.workerProxy
      = interleave_Boost_NonBoost.workerProxy
      = AsyncWorker_Proxy_tester.Pool.get_or_create_by();
  
    await Promise.all( [
      test_WorkerProxy_init( allBoost, 2 ),
      test_WorkerProxy_init( allNonBoost, 3 )
    ] );

    await Promise.all( [
      test_WorkerProxy_numberSequence( allBoost ),
      test_WorkerProxy_numberSequence( allNonBoost ),
      test_WorkerProxy_numberSequence( interleave_Boost_NonBoost )
    ] );

    test_WorkerProxy_processingQueueSize_zero( allBoost );
    test_WorkerProxy_processingQueueSize_zero( allNonBoost );

    allBoost.workerProxy.disposeResources_and_recycleToPool();
    allBoost.workerProxy = null;

    allNonBoost.workerProxy.disposeResources_and_recycleToPool();
    allNonBoost.workerProxy
      = interleave_Boost_NonBoost.workerProxy
      = null;

    progressToAdvance.value_advance();
    yield progressRoot;
  }

  // 3. Three wokers, three number sequences.
  {
    allBoost.workerProxy = AsyncWorker_Proxy_tester.Pool.get_or_create_by();
    allNonBoost.workerProxy = AsyncWorker_Proxy_tester.Pool.get_or_create_by();
    interleave_Boost_NonBoost.workerProxy
      = AsyncWorker_Proxy_tester.Pool.get_or_create_by();
  
    await Promise.all( [
      test_WorkerProxy_init( allBoost, 4 ),
      test_WorkerProxy_init( allNonBoost, 5 ),
      test_WorkerProxy_init( interleave_Boost_NonBoost, 6 ),
    ] );

    await Promise.all( [
      test_WorkerProxy_numberSequence( allBoost ),
      test_WorkerProxy_numberSequence( allNonBoost ),
      test_WorkerProxy_numberSequence( interleave_Boost_NonBoost )
    ] );

    test_WorkerProxy_processingQueueSize_zero( allBoost );
    test_WorkerProxy_processingQueueSize_zero( allNonBoost );
    test_WorkerProxy_processingQueueSize_zero( interleave_Boost_NonBoost );

    allBoost.workerProxy.disposeResources_and_recycleToPool();
    allBoost.workerProxy = null;

    allNonBoost.workerProxy.disposeResources_and_recycleToPool();
    allNonBoost.workerProxy = null;

    interleave_Boost_NonBoost.workerProxy.disposeResources_and_recycleToPool();
    interleave_Boost_NonBoost.workerProxy = null;

    progressToAdvance.value_advance();
    yield progressRoot;
  }

  console.log( "AsyncWorker testing... Done." );
}
