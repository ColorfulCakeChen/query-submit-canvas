
/**
 * @return {Trigger[]}
 *   Return all triggers of this script of this user.
 */
function UserTriggers_get_all_() {
  let triggerArray = ScriptApp.getUserTriggers( SpreadsheetApp.getActive() );
  return triggerArray;
}

/**
 * Remove all triggers of this script of this user.
 */
function UserTriggers_delete_all_() {
  let triggers = UserTriggers_get_all_();
  for ( let i = 0; i < triggers.length; ++i ) {
    ScriptApp.deleteTrigger( triggers[ i ] );
  }
}

/**
 * @return {string[]}
 *   Return all triggers' handler function names of this script of this user.
 */
function UserTriggers_get_all_HandlerFunctionNameArray_() {
  let triggers = UserTriggers_get_all_();
  let triggerNameArray = new Array( triggers.length );
  for ( let i = 0; i < triggers.length; ++i ) {
    const trigger = triggers[ i ];
    const triggerHandlerFunctionName = trigger.getHandlerFunction();
    triggerNameArray[ i ] = triggerHandlerFunctionName;
  }
  return triggerNameArray;
}

/**
 * @param {string} strHandlerFunctionName
 *   The handler function name for triggers to be searched.
 *
 * @return {Trigger}
 *   Return the first found trigger wich has the specified handler function
 * name. Return null if not found.
 */
function UserTriggers_get_first_by_HandlerFunctionName_( strHandlerFunctionName ) {
  let triggers = UserTriggers_get_all_();
  for ( let i = 0; i < triggers.length; ++i ) {
    const trigger = triggers[ i ];
    const triggerHandlerFunctionName = trigger.getHandlerFunction();
    if ( strHandlerFunctionName == triggerHandlerFunctionName )
      return trigger;
  }
  return null;
}

/**
 * Remove all triggers with the specified handler function name.
 *
 * @param {string} strHandlerFunctionName
 *   The handler function name for triggers to be deleted.
 *
 * @return {boolean}
 *   - Return true if any trigger is removed.
 *   - Return false if no trigger removed.
 */
function UserTriggers_delete_all_by_HandlerFunctionName_( strHandlerFunctionName ) {
  let bFound = false;
  let triggers = UserTriggers_get_all_();
  for ( let i = 0; i < triggers.length; ++i ) {
    const trigger = triggers[ i ];
    const triggerHandlerFunctionName = trigger.getHandlerFunction();
    if ( strHandlerFunctionName == triggerHandlerFunctionName ) {
      bFound = true;
      ScriptApp.deleteTrigger( trigger );
    }
  }

  //!!! (2023/06/07 Temp Added) For Debug whether delete successfully.
  // {
  //   const triggerNameArray = UserTriggers_get_all_HandlerFunctionNameArray_();
  //   const triggerNames = triggerNameArray.join( ", " );
  //   console.log( `trigger_delete_by_HandlerFunctionName_(): `
  //     + `Remained trigger names: [ ${triggerNames} ].` );
  // }

  return bFound;
}

/**
 * Remove the first trigger with the specified triggerUid.
 *
 * @param {string} triggerUid
 *   The unique identifier for trigger to be deleted.
 *
 * @return {boolean}
 *   - Return true if any trigger is removed.
 *   - Return false if no trigger removed.
 */
function UserTriggers_delete_by_triggerUid_( triggerUid ) {
  let triggerArray = UserTriggers_get_all_();
  let triggerFound = triggerArray.find(
    trigger => trigger.getUniqueId() === triggerUid );
  if ( triggerFound ) {
    ScriptApp.deleteTrigger( triggerFound );
    return true;
  }
  return false;
}
