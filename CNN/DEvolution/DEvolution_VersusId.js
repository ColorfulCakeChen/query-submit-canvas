export { DEvolution_VersusId as VersusId };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as NumberTools from "../../util/NumberTools.js";

/**
 * @member {string} versusIdString
 *   The versus id string (e.g. EntityNo_ParentGenerationNo_OffspringGenerationNo).
 *
 * @member {string} entityNoString
 *   The entity id string of the versus.
 *
 * @member {number} entityNo
 *   The entity id number of the versus.
 *
 * @member {string} parentGenerationNoString
 *   The parent generation id string of the entity of the versus.
 *
 * @member {number} parentGenerationNo
 *   The parent generation id number of the entity of the versus.
 *
 * @member {string} offspringGenerationNoString
 *   The offspring generation id string of the entity of the versus.
 *
 * @member {number} offspringGenerationNo
 *   The offspring generation id number of the entity of the versus.
 */
class DEvolution_VersusId extends Recyclable.Root {

  /**
   * Used as default DEvolution.VersusId provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "DEvolution.VersusId.Pool",
    DEvolution_VersusId, DEvolution_VersusId.setAsConstructor );

  /** */
  constructor( versusIdString ) {
    super();
    DEvolution_VersusId.setAsConstructor_self.call( this, versusIdString );
  }

  /** @override */
  static setAsConstructor( versusIdString ) {
    super.setAsConstructor();
    DEvolution_VersusId.setAsConstructor_self.call( this, versusIdString );
    return this;
  }

  /** @override */
  static setAsConstructor_self( versusIdString ) {
    this.set_byVersusIdString( versusIdString );
  }

  /** @override */
  disposeResources() {
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
   *   The versus id string (e.g. EntityNo_ParentGenerationNo_OffspringGenerationNo).
   */
  set_byVersusIdString( versusIdString ) {

    // Split the versus id inside. Got id of entity, parentGeneration,
    // offspringGeneration.
    //
    //   EntityNo_ParentGenerationNo_OffspringGenerationNo
    //
    // They are separated by underline (_).
    let versusId_parts = versusIdString.split(
      DEvolution_VersusId
        .EntityNo_ParentGenerationNo_OffspringGenerationNo_SplittingRegExp,
      3 // Just parse three parts.
    );

    this.versusIdString = versusIdString;
    this.entityNoString = versusId_parts[ 0 ];
    this.entityNo = Number.parseInt( this.entityNoString, 10 );
    this.parentGenerationNoString = versusId_parts[ 1 ];
    this.parentGenerationNo = Number.parseInt( this.parentGenerationNoString, 10 );
    this.offspringGenerationNoString = versusId_parts[ 2 ];
    this.offspringGenerationNo = Number.parseInt( this.offspringGenerationNoString, 10 );
  }

  /**
   * @return {boolean} Reurn true, if these ids are legal.
   */
  isValid() {
    if ( !NumberTools.isInteger( this.entityNo ) )
      return false;
    if ( !NumberTools.isInteger( this.parentGenerationNo ) )
      return false;
    if ( !NumberTools.isInteger( this.offspringGenerationNo ) )
      return false;
    return true;
  }

}

/**
 * Regular expression for splitting ids of entity, parent generation,
 * offspring generation.
 */
DEvolution_VersusId.EntityNo_ParentGenerationNo_OffspringGenerationNo_SplittingRegExp
  = RegExp( "_", "g" );
