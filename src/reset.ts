import { Plugin } from "./utils/plugin";

export const resetPlugin: Plugin = room => {
  let resetTimeout: NodeJS.Timeout | null = null;

  return {
    onPlayerChat: function (player, message) {
      const msg = message.trim().toLowerCase()

      if (msg.startsWith("!reset")) {
        if (resetTimeout) {
          clearTimeout(resetTimeout);
          resetTimeout = null;
        }

        resetTimeout = setTimeout(() => {
          room.setDiscProperties(0, {
            x: 0,
            y: 0,
          });
        }, 1000);
      }

      if (msg.startsWith("!stop_reset")) {
        if (resetTimeout) {
          clearTimeout(resetTimeout);
          resetTimeout = null;
        }
      }
    },
  };
};
