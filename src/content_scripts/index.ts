/**
 * content_scripts/index.ts
 *
 * Runs inside the Chrome extension sandbox (ISOLATED world / content-script).
 * Acts as a bridge between the inpage provider (inpage.ts, running in the
 * MAIN world via manifest world:"MAIN") and the background service worker.
 *
 * Communication flow:
 *   webpage (window.zent)
 *     ↕  BroadcastChannel("ZENT_CHANNEL")
 *   [this script — ISOLATED world]
 *     ↕  chrome.runtime.Port ("content-script")
 *   background service worker
 *
 * NOTE: inpage.ts is injected by the browser directly (world:"MAIN" in
 * manifest.ts), so there is no need to inject a <script> tag here.
 */
import { Message } from '@/shared/utils';

// Must match CHANNEL_NAME defined in pageProvider/index.ts
const CHANNEL_NAME = 'ZENT_CHANNEL';

const { BroadcastChannelMessage, PortMessage } = Message;

// Connect to background via a long-lived named Port
const pm = new PortMessage().connect('content-script');

// Listen to requests from the inpage provider (MAIN world) and forward to background
const bcm = new BroadcastChannelMessage(CHANNEL_NAME).listen((data: unknown) =>
  pm.request(data)
);

// Forward background responses / push events back to the inpage provider
pm.on('message', (data) => {
  bcm.send('message', data);
});

document.addEventListener('beforeunload', () => {
  bcm.dispose();
  pm.dispose();
});
