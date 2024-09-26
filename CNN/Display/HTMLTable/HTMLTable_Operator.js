export { HTMLTable_Operator as Operator };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

/**
 * Append table row into a HTMLTable.
 *
 *
 * @member {string} htmlTableElementId
 *   The HTML table element id for displaying data.
 *
 * @member {number} digitsCount
 *   For number data, it will be converted to text by toFix() with digitsCount
 * (i.e. the number of digits to appear after the decimal point).
 */
class HTMLTable_Operator extends Recyclable.Root {

  /**
   * Used as default HTMLTable.Operator provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "HTMLTable.Operator.Pool",
    HTMLTable_Operator, HTMLTable_Operator.setAsConstructor );

  /** */
  constructor( htmlTableElementId, digitsCount = 4 ) {
    super();
    HTMLTable_Operator.setAsConstructor_self.call( this,
      htmlTableElementId, digitsCount );
  }

  /** @override */
  static setAsConstructor( htmlTableElementId, digitsCount ) {
    super.setAsConstructor();
    HTMLTable_Operator.setAsConstructor_self.call( this,
      htmlTableElementId, digitsCount );
    return this;
  }

  /** @override */
  static setAsConstructor_self( htmlTableElementId, digitsCount ) {
    this.htmlTableElementId = htmlTableElementId;
    this.digitsCount = digitsCount;
  }

  /** @override */
  disposeResources() {
    this.digitsCount = undefined;
    this.htmlTableElementId = undefined;
    this.htmlTableElement = undefined;
    super.disposeResources();
  }

  /** If .htmlTableElement undefined, prepare it by .htmlTableElementId. */
  Table_ensure() {
    if ( this.htmlTableElement )
      return;
    if ( !document )
      return;
    if ( !this.htmlTableElementId )
      return;
    this.htmlTableElement = document.getElementById( this.htmlTableElementId );
  }

  /** Remove all child nodes of the .htmlTableElement. */
  Table_clear() {
    this.Table_ensure();
    this.htmlTableElement.replaceChildren();
  }

  /** Ensure table header. */
  TableHeader_ensure() {
    this.Table_ensure();
    if ( this.htmlTableElement.tHead )
      return;
    this.htmlTableElement.createTHead();
  }

  /* Ensure table body. */
  TableBody_ensure() {
    this.Table_ensure();
    if ( this.htmlTableElement.tBodies.length > 0 )
      return;
    this.htmlTableElement.createTBody();
  }

  /**
   * @return {boolean}
   *   Return true, if the table header already has content.
   */
  Header_hasChild() {
    this.TableHeader_ensure();
    if ( this.htmlTableElement.tHead.childElementCount > 0 )
      return true;
    return false;
  }

  /**
   * @param {string[]|number[]} dataArray
   *   Append the data as the last row of the table header.
   */
  Header_addRow( dataArray ) {
    this.TableHeader_ensure();
    HTMLTable_Operator.Section_addRow.call( this,
      this.htmlTableElement.tHead,
      "th", // Table header always uses "th".
      dataArray );
  }

  /**
   * @param {string[]|number[]} dataArray
   *   Append the data as the last row of the table body.
   */
  Body_addRow( dataArray ) {
    this.TableBody_ensure();
    HTMLTable_Operator.Section_addRow.call( this,
      this.htmlTableElement.tBodies[ 0 ],
      "td", // Table body mainly uses "td" (except first column).
      dataArray );
  }

  /**
   * @param {Node} htmlNode
   *   The HTML DOM Node which will the new row will be inserted. For HTML
   * table, it could be .tHead or .tBodies or .tFoot.
   *
   * @param {string} th_OR_td  "th" for table header, "td" for table body.
   *   "th" for table header cell, "td" for table data cell.
   *
   * @param {string[]|number[]} dataArray
   *   The data to be displaye 
   */
  static Section_addRow( htmlNode, th_OR_td, dataArray ) {
    let oneLine = document.createElement( "tr" );

    let cellElementName;
    let textAlign;
    let data, dataText;
    for ( let i = 0; i < dataArray.length; ++i ) {
      data = dataArray[ i ];

      if ( typeof data === "number" ) {
        textAlign = "right";
        dataText = data.toFixed( this.digitsCount );
      } else {
        textAlign = "left";
        dataText = data;
      }

      if ( 0 == i )
        cellElementName = "th"; // First column always use <th>
      else
        cellElementName = th_OR_td;

      if ( htmlNode === this.htmlTableElement.tHead )
        textAlign = "center"; // Table header always align to center.

      let oneCell = document.createElement( cellElementName );
      oneCell.style.textAlign = textAlign;

      oneCell.appendChild( document.createTextNode( dataText ) );
      oneLine.appendChild( oneCell );
    }

    htmlNode.appendChild( oneLine );
  }

}
