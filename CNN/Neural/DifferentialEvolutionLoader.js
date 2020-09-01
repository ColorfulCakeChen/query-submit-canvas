import * as NetProgress from "./NetProgress.js";

export { NetProgress, Base };

/**
 * Download differential evolution summary and individual entity from network (a publish html of Google Sheets).
 *
 *
 *
 */
class Base {

//  constructor() {
//  }

  /**
   *
   * @param summaryURL
   *   The published (should be html, not tsv, not csv) web page URL of the summary sheet of the differential evolution Google Sheets. For example:
   * "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzA4SXUR5VyPmJ1cLEkNMiJgfb28zzgp4HtwoBlumIIOTkL_y7mgPldqaGtsunIq5eTu5QndluyFcV/pubhtml?gid=0&single=true".
   * The "gid=0" inside the URL will be replaced with different number when downloading other published sheet.
   */
  init( summaryURL ) {

    // Why using published html web page instead of tsv (or csv)? This is because Google Sheets' published html web page support cross-origin
    // resource sharing (CORS) while its published web page tsv (or csv) does not.
    this.summaryURL = summaryURL;

    // The regular expression string for extracting one cell (i.e. the text of the html table "td" tag).
    //
    // A Google Sheets published html web page is mainly a html table. A possible parsing method is using lookbehind and lookahead. 
    // For example, "(?<=<table[^>]*>.*)(?<=>)[^<]+(?=<)(?=.*</table>)". However, some browser (e.g. safari) does not support lookbehind
    // regular expression. So it is more reliable to use the capture grouping method.
    this.tdExtractingRegExpString =
        "<td[^>]*>"         // Only searching <td> tag. (Note: Ignore <th> tag because it records row number of the sheet.)
      +   "(?:<div[^>]*>)?" // Sometimes there is a <div> tag surrounding the <td> tag. Skip it.
      +     "([^<]*)"       // This is the <td> tag's text which will be extracted (by capture group 1). 
      +   "(?:</div>)?"
      + "</td>"
    ;

//  let r = RegExp( "<td[^>]*>(?:<div[^>]*>)?([^<]*)(?:</div>)?</td>", "g" );
//  let extractedLinesByCells = String( sourceHTMLText ).replace( r, "$1\n" );
  }

  async downloadSummary( progress ) {
    let response = await fetch( this.summaryURL );

    let tdRegExp = RegExp( this.tdExtractingRegExpString, "g" );
    let matches = response.text().matchAll( tdRegExp );

    // Only capture group 1 is used.

    let match = matches.next();
    if ( !match.done ) {
      this.PopulationSize = Number.parseInt( match.value[ 1 ], 10 );

      match = match.next();
      if ( !match.done ) {
        this.EntityWeightCount = Number.parseInt( match.value[ 1 ], 10 );

        match = match.next();
        if ( !match.done ) {
          this.EntityChromosomeCount = Number.parseInt( match.value[ 1 ], 10 );

          match = match.next();
//!!! ...unfinished... gid and versus ids.
        }
      }
    }

//    for ( let match of matches ) {


//!!! ...unfinished... report progress.
  }

  downloadEntity( progress ) {
    // Parent and offspring.
  }

}
