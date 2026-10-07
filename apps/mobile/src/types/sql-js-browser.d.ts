// The browser build of sql.js has the same API as the package root.
declare module 'sql.js/dist/sql-wasm-browser.js' {
  import initSqlJs = require('sql.js');
  export = initSqlJs;
}
