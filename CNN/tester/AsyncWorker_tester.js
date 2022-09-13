export { tester };

import * as ValueMax from "../util/ValueMax.js";
import * as AsyncWorker_Proxy_tester from "./AsyncWorker_Proxy_tester.js";

/**
 * Test a WorkerProxy for generating number sequence.
 *
 * @param {AsyncWorker_Proxy_tester} aWorkerProxy
 */
async function test_WorkerProxy_init( { workerId, workerProxy } ) {
  let initWorkerPromise = workerProxy.initWorker_async( workerId );
  let initWorkerOk = await initWorkerPromise;

  if ( initWorkerOk == false )
    throw Error( `AsyncWorker_tester.testWorkerProxy(): `
      `workerId=${workerId}, initWorker failed.`
    );
}

/**
 * Test a WorkerProxy for generating number sequence.
 *
 * @param {AsyncWorker_Proxy_tester} workerProxy
 */
async function test_WorkerProxy_numberSequence(
  {
    workerId,
    intervalMilliseconds,
    valueBegin,
    valueCountTotal,
    valueCountPerBoost,
    workerProxy,
  }
) {
  let numberResulter = workerProxy.number_sequence_asyncGenerator(
    intervalMilliseconds, valueBegin, valueCountTotal, valueCountPerBoost );

  let valueIndex = 0;
  let valueTest = valueBegin;
  let numberResulterNext, done, value;
  do {
    numberResulterNext = await numberResulter.next();
    ( { done, value } = numberResulterNext );

    if ( valueTest != value )
      throw Error( `AsyncWorker_tester.testWorkerProxy(): `
        + `workerId=${workerId}, valueIndex=${valueIndex}, `
        + `value ( ${value} ) should be the same as valueTest ( ${valueTest} ).`
      );

    ++valueIndex;
    ++valueTest;

  } while ( !done );

  let valueTestFinal = valueBegin + valueCountTotal - 1;
  if ( valueTestFinal != value )
    throw Error( `AsyncWorker_tester.testWorkerProxy(): `
      + `workerId=${workerId}, `
      + `value ( ${value} ) should be the same as valueTestFinal ( ${valueTestFinal} ).`
    );

  let processingQueueSize = workerProxy.the_processingId_Resulter_Map.size;
  if ( processingQueueSize != 0 )
    throw Error( `AsyncWorker_tester.testWorkerProxy(): `
      + `workerId=${workerId}, `
      + `processingQueueSize ( ${processingQueueSize} ) should be 0.`
    );
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

  const valueCountTotal = 100;

  let progressRoot = progressParent.root_get();

  let progress_allBoost = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( valueCountTotal ) );

  let progress_allNonBoost = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( valueCountTotal ) );

  let progress_interleave_Boost_NonBoost = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( valueCountTotal ) );

  {
    // All boost.
    let allBoost = {
      workerId: 1,
      intervalMilliseconds: 100,
      valueBegin: 0,
      valueCountTotal: valueCountTotal,
      valueCountPerBoost: valueCountTotal,
      workerProxy: AsyncWorker_Proxy_tester.Pool.get_or_create_by(),
    };

    await test_WorkerProxy_init( allBoost );
    yield* test_WorkerProxy_numberSequence( allBoost );

    allBoost.workerProxy.disposeResources_and_recycleToPool();
    allBoost.workerProxy = null;

    progress_allBoost.value_advance( valueCountTotal );
    yield progressRoot;
  }

  {
    let workerProxy_allNonBoost = AsyncWorker_Proxy_tester.Pool.get_or_create_by();

    // All non-boost.
    const allNonBoost = {
      workerId: 2,
      intervalMilliseconds_allNonBoost = 100;
    const valueBegin_allNonBoost = 50;
    valueCountTotal
    const valueCountPerBoost_allNonBoost = 0;

    // Interleave boost and non-boost.
    const interleave_Boost_NonBoost = {
    const workerId_interleave_Boost_NonBoost = 2;
    const intervalMilliseconds_allNonBoost = 100;
    const valueBegin_allNonBoost = 50;
    valueCountTotal
    const valueCountPerBoost_allNonBoost = 0;

    await Promise.all( [
      test_WorkerProxy_init( workerProxy_allNonBoost, workerId_allNonBoost ),
    ];

    test_WorkerProxy_numberSequence( workerProxy_allNonBoost, workerId_allNonBoost,
      intervalMilliseconds_allNonBoost, valueBegin_allNonBoost, valueCountTotal_allNonBoost, valueCountPerBoost_allNonBoost,
      progress_allNonBoost
    );

    workerProxy_allNonBoost.disposeResources_and_recycleToPool();
    workerProxy_allNonBoost = null;
  }


//!!! ...unfinished... (2022/09/12) check value


  let tester1 = GSheets.UrlComposer.Pool.get_or_create_by( spreadsheetId, range );
  let fetcher1 = tester1.fetcher_JSON_ColumnMajorArrayArray( progress1 );
  let result1 = yield* fetcher1;

  // With API key.
  let tester2 = GSheets.UrlComposer.Pool.get_or_create_by( spreadsheetId, range, apiKey );
  let fetcher2 = tester2.fetcher_JSON_ColumnMajorArrayArray( progress2 );
  let result2 = yield* fetcher2;

  // Compare results: should the same.
  if ( !array2d_compare_EQ( result1, result2 ) )
    throw Error( `${result1} != ${result2}` );

  // Test change range.
  {
    let newRange = result1[ 0 ][ 0 ];
    tester1.range_set( newRange );
    let fetcher11 = tester1.fetcher_JSON_ColumnMajorArrayArray( progress11 );
    let result11 = yield* fetcher11;

    tester2.range_set( newRange );
    let fetcher21 = tester2.fetcher_JSON_ColumnMajorArrayArray( progress21 );
    let result21 = yield* fetcher21;

    if ( !array2d_compare_EQ( result11, result21 ) )
      throw Error( `${result11} != ${result21}` );
  }

  tester2.disposeResources_and_recycleToPool();
  tester2 = null;

  tester1.disposeResources_and_recycleToPool();
  tester1 = null;

  console.log( "AsyncWorker download testing... Done." );
}
