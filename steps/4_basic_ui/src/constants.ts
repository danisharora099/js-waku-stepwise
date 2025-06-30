// Content topics
export const CONTENT_TOPIC_VERSION = "1";
export const CONTENT_TOPIC_PREFIX = "/waku-react-example";

// Content topic for chat messages
export const CHAT_TOPIC = `${CONTENT_TOPIC_PREFIX}/${CONTENT_TOPIC_VERSION}/chat/proto`;

// Legacy content topic (for backward compatibility)
export const CONTENT_TOPIC = CHAT_TOPIC;

// Protocol IDs
export const LIGHT_PUSH_PROTOCOL_ID = "/vac/waku/relay/2.0.0";
export const FILTER_PROTOCOL_ID = "/vac/waku/filter/2.0.0";
export const STORE_PROTOCOL_ID = "/vac/waku/store/2.0.0";

// Network configuration
export const CUSTOM_BOOTSTRAP_NODES = [
  "/dns4/waku-test.bloxy.one/tcp/8095/wss/p2p/16Uiu2HAmSZbDB7CusdRhgkD81VssRjQV5ZH13FbzCGcdnbbh6VwZ",
  "/dns4/node-01.do-ams3.waku.sandbox.status.im/tcp/30303/p2p/16Uiu2HAmNaeL4p3WEYzC9mgXBmBWSgWjPHRvatZTXnp8Jgv3iKsb",
  "/dns4/waku.fryorcraken.xyz/tcp/8000/wss/p2p/16Uiu2HAmMRvhDHrtiHft1FTUYnn6cVA8AWVrTyLUayJJ3MWpUZDB",
  "/dns4/vps-aaa00d52.vps.ovh.ca/tcp/8000/wss/p2p/16Uiu2HAm9PftGgHZwWE3wzdMde4m3kT2eYJFXLZfGoSED3gysofk"
];

// Application settings
export const APP_NAME = "Waku React Example";
export const APP_VERSION = "0.1.0"; 