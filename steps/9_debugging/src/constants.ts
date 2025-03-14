// Content topics
export const CONTENT_TOPIC_VERSION = "1";
export const CONTENT_TOPIC_PREFIX = "/waku-react-example";

// Content topic for chat messages
export const CHAT_TOPIC = `${CONTENT_TOPIC_PREFIX}/${CONTENT_TOPIC_VERSION}/chat/proto`;

export const CONTENT_TOPIC = CHAT_TOPIC;

// Network configuration
export const CUSTOM_BOOTSTRAP_NODES = [
  "/dns4/node-01.ac-cn-hongkong-c.wakuv2.test.statusim.net/tcp/443/wss/p2p/16Uiu2HAkvWiyFsgRhuJEb9JfjYxEkoHLgnUQmr1N5mKWnYjxYRVm",
  // "/dns4/node-01.do-ams3.wakuv2.test.statusim.net/tcp/443/wss/p2p/16Uiu2HAmPLe7Mzm8TsYUubgCAW1aJoeFScxrLj8ppHFivPo97bUZ",
  // "/dns4/node-01.gc-us-central1-a.wakuv2.test.statusim.net/tcp/443/wss/p2p/16Uiu2HAmJb2e28qLXxT5kZxVUUoJt72EMzNGXB47Rxx5hw3q4YjS"
]; 