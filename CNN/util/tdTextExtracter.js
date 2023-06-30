export { Base };

/**
 * Extract html table cell text from html string. This could be used to extract
 * text from Google Sheets' published html web page.
 *
 *
 */
class Base {

  //constructor() {
  //}

  /**
   * The same as calling htmlString.matchAll( Base.tdTextExtractingRegExp ).
   *
   * @param {string} htmlString
   *   A string contains HTML table markup.
   *
   * @return {Iterator}
   *   Return an iterator traverses every td tag inside the htmlString. The
   * captured group 1 of every match is the text of the html td tag (e.g.
   * <td>...</td>). If the td tag contains a div tag (e.g.
   * <td><div>...</div></td>), the captured group 1 of every match is the text
   * of the html div tag.
   */
  static createIterator( htmlString ) {
    let matches = htmlString.matchAll( Base.tdTextExtractingRegExp );
    return matches;
  }

}

/**
 * The regular expression string for extracting one cell (i.e. the text of the
 * html table "td" tag).
 *
 * A Google Sheets published html web page is mainly a html table. A possible
 * parsing method is using lookbehind and lookahead.  For example,
 * "(?<=<table[^>]*>.*)(?<=>)[^<]+(?=<)(?=.*</table>)". However, some browser
 * (e.g. safari) does not support lookbehind regular expression. So it is more
 * reliable to use the capture grouping method.
 */
Base.tdTextExtractingRegExpString =
    "<td[^>]*>"         // Only searching <td> tag. (Note: Ignore <th> tag because it records row number of the sheet.)
  +   "(?:<div[^>]*>)?" // Sometimes there is a <div> tag surrounding the <td> tag. Skip it.
  +     "([^<]*)"       // This is the <td> tag's text which will be extracted (by capture group 1). 
  +   "(?:</div>)?"
  + "</td>"
;

//  let r = RegExp( "<td[^>]*>(?:<div[^>]*>)?([^<]*)(?:</div>)?</td>", "g" );
//  let extractedLinesByCells = String( sourceHTMLText ).replace( r, "$1\n" );

/** Could be re-used by String.matchAll(). */
Base.tdTextExtractingRegExp = RegExp( Base.tdTextExtractingRegExpString, "g" );

