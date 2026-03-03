/**
 * content_scripts/inpage.ts
 *
 * Entry point for the page-provider bundle.
 * This file is built as a separate chunk (inpage.js) and injected
 * into the webpage's main world by content_scripts/index.ts.
 *
 * After injection, `window.zent` is available on any page where the
 * extension is active.
 */

// Side-effect import: evaluating pageProvider/index.ts creates the
// ZentProvider instance and assigns it to window.zent.
import './pageProvider/index';
