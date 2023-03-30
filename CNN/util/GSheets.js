export { UrlComposer_Pool_get_or_create_by };
export * as GSheetsAPIv4 from "./GSheet/GSheetsAPIv4.js";
export * as GVizTQ from "./GSheet/GVizTQ.js";

import * as GSheetsAPIv4 from "./GSheet/GSheetsAPIv4.js";
import * as GVizTQ from "./GSheet/GVizTQ.js";

/**
 *
 * @return { GSheetsAPIv4 | GVizTQ }
 *   - Get or create an instance of GSheetsAPIv4 if apiKey is truthy.
 *   - Get or create an instance of GVizTQ if apiKey is falsy (i.e. null or
 *       undefined).
 */
function UrlComposer_Pool_get_or_create_by( spreadsheetId, range, apiKey ) {
  let urlComposer;
  if ( apiKey ) {
    urlComposer = GSheetsAPIv4.UrlComposer.Pool.get_or_create_by(
      spreadsheetId, range, apiKey );
  } else {
    urlComposer = GVizTQ.UrlComposer.Pool.get_or_create_by(
      spreadsheetId, range );
  }
  return urlComposer;
}
