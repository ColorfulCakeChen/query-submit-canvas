export { tester };

import * as ValueMax from "../util/ValueMax.js";
import * as AsyncWorker_Proxy_tester from "./AsyncWorker_Proxy_tester.js";

/**
 * Test a WorkerProxy for generating number sequence.
 *
 * @param {AsyncWorker_Proxy_tester} aWorkerProxy
 */
async function testWorkerProxy(
  aWorkerProxy, workerId,
  intervalMilliseconds, valueBegin, valueCountTotal, valueCountPerBoost,
  progressToAdvance
) {
  let progressRoot = progressParent.root_get();

  let initWorkerPromise = workerProxy.initWorker_async( workerId );
  let initWorkerOk = await initWorkerPromise;

  if ( initWorkerOk == false )
    throw Error( `AsyncWorker_tester.testWorkerProxy(): `
      `workerId=${workerId}, initWorker failed.`
    );

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


//!!! ...unfinished... (2022/09/12) check processing queue removed.

  progressToAdvance.value_advance( valueCountTotal );
  yield progressRoot;
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

  let progressBoostAll = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( valueCountTotal ) );

  let progressNonBoostAll = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( valueCountTotal ) );

  let progressBoostNonBoostInterleave = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( valueCountTotal ) );


  // All boost.
  {
    let workerProxy = AsyncWorker_Proxy_tester.Pool.get_or_create_by();

    const workerId = 1;
    const intervalMilliseconds = 100;
    const valueBegin = 0;
    const valueCountPerBoost = valueCountTotal;

    testWorkerProxy( workerProxy, workerId,
      intervalMilliseconds, valueBegin, valueCountTotal, valueCountPerBoost,
      progressBoostAll
    );

    workerProxy.disposeResources_and_recycleToPool();
    workerProxy = null;
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
