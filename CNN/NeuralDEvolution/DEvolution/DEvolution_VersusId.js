export { DEvolution_VersusId as VersusId };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as NumberTools from "../../util/NumberTools.js";

/**
 * @member {string} versusIdString
 *   The versus id string (e.g.
 * EntityNo_ParentGenerationNo_OffspringGenerationNo_ParentWinCount).
 *
 * @member {string} entityNoString
 *   The entity id string of the versus.
 *
 * @member {number} entityNo
 *   The entity id number of the versus. It is a 0-base integer.
 *
 * @member {string} parentGenerationNoString
 *   The parent generation id string of the entity of the versus.
 *
 * @member {number} parentGenerationNo
 *   The parent generation id number of the entity of the versus. It is a
 * 0-base integer.
 *
 * @member {string} offspringGenerationNoString
 *   The offspring generation id string of the entity of the versus.
 *
 * @member {number} offspringGenerationNo
 *   The offspring generation id number of the entity of the versus. It is a
 * 0-base integer.
 *
 * @member {string} parentWinCountString
 *   The parent win count string of the entity of the versus.
 *
 * @member {number} parentWinCount
 *   The parent win count number of the entity of the versus. It is a 0-base
 * integer.
 *
 * @member {string} measurementId
 *   The measurement id of stream of property of Google Analytics v4.
 *
 * @member {string} apiSecret
 *   The measurement api secret of stream of property of Google Analytics v4.
 */
class DEvolution_VersusId extends Recyclable.Root {

  /**
   * Used as default DEvolution.VersusId provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "DEvolution.VersusId.Pool",
    DEvolution_VersusId, DEvolution_VersusId.setAsConstructor );

  /** */
  constructor( versusIdString ) {
    super();
    this.#setAsConstructor_self( versusIdString );
  }

  /** @override */
  setAsConstructor( versusIdString ) {
    super.setAsConstructor();
    this.#setAsConstructor_self( versusIdString );
  }

  /**  */
  #setAsConstructor_self( versusIdString ) {
    this.set_byVersusIdString( versusIdString );
  }

  /** @override */
  disposeResources() {
    if ( this.apiSecret )
      this.apiSecret = undefined;

    if ( this.measurementId )
      this.measurementId = undefined;

    this.parentWinCount = undefined;
    this.parentWinCountString = undefined;
    this.offspringGenerationNo = undefined;
    this.offspringGenerationNoString = undefined;
    this.parentGenerationNo = undefined;
    this.parentGenerationNoString = undefined;
    this.entityNo = undefined;
    this.entityNoString = undefined;
    this.versusIdString = undefined;
    super.disposeResources();
  }

  /**
   *
   * @param {string} versusIdString
   *   The versus id string (e.g.
   * EntityNo_ParentGenerationNo_OffspringGenerationNo_ParentWinCount).
   */
  set_byVersusIdString( versusIdString ) {

    // Split the versus id.
    //
    //   EntityNo_ParentGenerationNo_OffspringGenerationNo_ParentWinCount
    //
    // They are separated by underline (_).
    let versusId_parts = versusIdString.split(
      DEvolution_VersusId.SplittingRegExp,
      4 // Just parse four parts.
    );

    this.versusIdString = versusIdString;

    this.entityNoString = versusId_parts[ 0 ];
    this.entityNo = Number.parseInt( this.entityNoString, 10 );

    this.parentGenerationNoString = versusId_parts[ 1 ];
    this.parentGenerationNo
      = Number.parseInt( this.parentGenerationNoString, 10 );

    this.offspringGenerationNoString = versusId_parts[ 2 ];
    this.offspringGenerationNo
      = Number.parseInt( this.offspringGenerationNoString, 10 );

    this.parentWinCountString = versusId_parts[ 3 ];
    this.parentWinCount
      = Number.parseInt( this.parentWinCountString, 10 );
  }

  /**
   * @return {boolean} Reurn true, if these ids are legal.
   */
  isValid() {
    if ( !NumberTools.isInteger( this.entityNo ) )
      return false;
    if ( this.entityNo < 0 ) // entity id is 0-base.
      return false;

    if ( !NumberTools.isInteger( this.parentGenerationNo ) )
      return false;
    if ( this.parentGenerationNo < 0 ) // generation id is 0-base.
      return false;

    if ( !NumberTools.isInteger( this.offspringGenerationNo ) )
      return false;
    if ( this.offspringGenerationNo < 0 ) // generation id is 0-base.
      return false;

    if ( !NumberTools.isInteger( this.parentWinCount ) )
      return false;
    if ( this.parentWinCount < 0 ) // win count is 0-base.
      return false;

    return true;
  }

}

/**
 * Regular expression for splitting entity id, parent generation number,
 * offspring generation number, parent win count.
 */
DEvolution_VersusId.SplittingRegExp = RegExp( "_", "g" );
