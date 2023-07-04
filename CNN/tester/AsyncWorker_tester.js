export { tester };

import * as PartTime from "../util/PartTime.js";
import * as ValueMax from "../util/ValueMax.js";
import { AsyncWorker_Proxy_tester } from "./AsyncWorker_Proxy_tester.js";

/** */
class NumberSequenceInfo {

  constructor(
    sequenceName, intervalMilliseconds,
    valueBegin, valueCountTotal, valueCountPerBoost,
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
 * Test a WorkerProxy's initialization.
 *
 * @param {AsyncWorker_Proxy_tester} workerProxy
 */
async function test_WorkerProxy_init( { workerProxy }, workerId ) {
  let initWorkerPromise = workerProxy.initWorker_async( workerId );

  //!!! (2022/09/26 Remarked)
  // Test terminating worker when some resulter still has pending promises.
  // {
  //   workerProxy.disposeResources_and_recycleToPool();
  // }

  let initWorkerOk;
  try {
    initWorkerOk = await initWorkerPromise;
  } catch ( e ) {
    alert( e );
    console.error( e );
    debugger;
  }

  if ( !initWorkerOk )
    throw Error( `AsyncWorker_tester.testWorkerProxy(): `
      + `workerId=${workerId}, initWorker failed.`
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
  //   console.error( e );
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
 *   - Other value: await so many milliseconds before call
 *       numberResulter.next().
 */
async function test_WorkerProxy_numberSequence(
  {
    sequenceName, intervalMilliseconds,
    valueBegin, valueCountTotal, valueCountPerBoost,
    workerProxy,
  },
  nextMilliseconds,
) {
  const workerId = workerProxy.workerId;

  let numberResulter = workerProxy.number_sequence_asyncGenerator(
    intervalMilliseconds, valueBegin, valueCountTotal, valueCountPerBoost );

  const valueCountPerDelay
    = Math.ceil( nextMilliseconds / intervalMilliseconds );

  let valueIndex = 0;
  let valueTest = valueBegin;
  let numberResulterNext, done, value;
  do {
    if ( nextMilliseconds >= 0 )
      await PartTime.delayedValue( nextMilliseconds );

    let valueCountThisDelay = 0;
    do {
      numberResulterNext = await numberResulter.next();
      ( { done, value } = numberResulterNext );

      if ( valueTest != value )
        throw Error( `AsyncWorker_tester.test_WorkerProxy_numberSequence(): `
          + `sequenceName="${sequenceName}", workerId=${workerId}, `
          + `nextMilliseconds=${nextMilliseconds}, `
          + `valueCountPerDelay=${valueCountPerDelay}, `
          + `valueCountThisDelay=${valueCountThisDelay}, `
          + `valueIndex=${valueIndex}, `
          + `value ( ${value} ) should be the same as `
          + `valueTest ( ${valueTest} ).`
        );

      ++valueIndex;
      ++valueTest;

      ++valueCountThisDelay;

    } while ( ( !done ) && ( valueCountThisDelay < valueCountPerDelay ) );

  } while ( !done );

  let valueTestFinal = valueBegin + valueCountTotal - 1;
  if ( valueTestFinal != value )
      throw Error( `AsyncWorker_tester.test_WorkerProxy_numberSequence(): `
        + `sequenceName="${sequenceName}", workerId=${workerId}, `
        + `nextMilliseconds=${nextMilliseconds}, `
        + `valueCountPerDelay=${valueCountPerDelay}, `
        + `value ( ${value} ) should be the same as `
        + `valueTestFinal ( ${valueTestFinal} ).`
    );
}

/**
 * Test different nextMilliseconds.
 */
async function test_WorkerProxy_numberSequence_multi( aNumberSequenceInfo ) {
  let noMilliseconds = -1;
  let zeroMilliseconds = 0;
  let halfMilliseconds = aNumberSequenceInfo.intervalMilliseconds / 2;
  let oneHalfMilliseconds
    = aNumberSequenceInfo.intervalMilliseconds + halfMilliseconds;
  let sameMilliseconds = aNumberSequenceInfo.intervalMilliseconds;
  let twoMilliseconds = aNumberSequenceInfo.intervalMilliseconds * 2;
  let fiveMilliseconds = aNumberSequenceInfo.intervalMilliseconds * 5;
  let overMilliseconds
    = aNumberSequenceInfo.intervalMilliseconds
        * aNumberSequenceInfo.valueCountTotal;

  return Promise.all( [
    test_WorkerProxy_numberSequence( aNumberSequenceInfo, overMilliseconds ),
    test_WorkerProxy_numberSequence( aNumberSequenceInfo, fiveMilliseconds ),
    test_WorkerProxy_numberSequence( aNumberSequenceInfo, twoMilliseconds ),
    test_WorkerProxy_numberSequence( aNumberSequenceInfo, sameMilliseconds ),
    test_WorkerProxy_numberSequence( aNumberSequenceInfo, oneHalfMilliseconds ),
    test_WorkerProxy_numberSequence( aNumberSequenceInfo, halfMilliseconds ),
    test_WorkerProxy_numberSequence( aNumberSequenceInfo, zeroMilliseconds ),
    test_WorkerProxy_numberSequence( aNumberSequenceInfo, noMilliseconds ),
  ] );
}

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 */
async function* tester( progressParent ) {
  console.log( "AsyncWorker testing..." );

//!!! (2022/09/14 Temp Remarked) lesser.
  const valueCountTotal = 100;
  //const valueCountTotal = 10;
  //const valueCountTotal = 50;

  let progressRoot = progressParent.root_get();

  let progressMax =
      1 // one worker
    + 1 // two workers
    + 1 // three workers
    ;

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( progressMax ) );

  // NumberSequenceInfo:
  //   sequenceName, intervalMilliseconds,
  //   valueBegin, valueCountTotal, valueCountPerBoost,
  //   workerProxy,

  // All boost.
  let allBoost = new NumberSequenceInfo(
    "allBoost", 10,
    0, valueCountTotal, valueCountTotal,
    undefined,
  );

  // All non-boost.
  const allNonBoost = new NumberSequenceInfo(
    "allNonBoost", 50,
    50, valueCountTotal, 0,
    undefined,
  );

  // Interleave boost and non-boost.
  const interleave_Boost_NonBoost = new NumberSequenceInfo(
    "interleave_Boost_NonBoost", 40,
    120, valueCountTotal, Math.ceil( valueCountTotal / 11 ),
    undefined,
  );

  // 1. One woker, three number sequences.
  {
    allBoost.workerProxy
      = allNonBoost.workerProxy
      = interleave_Boost_NonBoost.workerProxy
      = AsyncWorker_Proxy_tester.Pool.get_or_create_by();

    await test_WorkerProxy_init( allBoost, 1 );

    await Promise.all( [
      test_WorkerProxy_numberSequence_multi( allBoost ),
      test_WorkerProxy_numberSequence_multi( allNonBoost ),
      test_WorkerProxy_numberSequence_multi( interleave_Boost_NonBoost )
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
      test_WorkerProxy_numberSequence_multi( allBoost ),
      test_WorkerProxy_numberSequence_multi( allNonBoost ),
      test_WorkerProxy_numberSequence_multi( interleave_Boost_NonBoost )
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
      test_WorkerProxy_numberSequence_multi( allBoost ),
      test_WorkerProxy_numberSequence_multi( allNonBoost ),
      test_WorkerProxy_numberSequence_multi( interleave_Boost_NonBoost )
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
