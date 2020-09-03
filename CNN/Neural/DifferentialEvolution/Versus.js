import * as NetProgress from "../NetProgress.js";
import * as tdTextExtracter from "../../util/tdTextExtracter.js";

export { NetProgress, Base };

/**
 * Download differential evolution individual versus (entity vs entity) from network (a publish html of Google Sheets).
 *
 *
 *
 */
class Base {

//  constructor() {
//  }

  /**
   *
   * @param versusURL
   *   The published (should be html, not tsv, not csv) web page URL of the versus sheet of the differential evolution Google Sheets. For example:
   * "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzA4SXUR5VyPmJ1cLEkNMiJgfb28zzgp4HtwoBlumIIOTkL_y7mgPldqaGtsunIq5eTu5QndluyFcV/pubhtml?gid=0&single=true".
   * The "gid=0" inside the URL will be replaced with different number when downloading other published sheet.
   */
  init( versusURL ) {

    this.versusURL = versusURL;

  }

  async downloadEntity( progress ) {

//!!! ...unfinished... Which gid number should be used.
//    let gid = ???;
    let replaceContext = `$1${gid}`;
    let url = this.summaryURL.replace( this.gidReplacingRegExp, replaceContext );

    let response = await fetch( url );

    let matches = tdTextExtracter.Base.createIterator( response.text() );
    let match = matches.next();    // Only capture group 1 will be used.
    if ( match.done )
      return;

//!!! ...unfinished...

    // Parent and offspring.
  }

}
