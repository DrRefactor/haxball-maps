import { Plugin } from "./utils/plugin";

const $DISCORD_WEBHOOK_URL = "";
const botName = "Haxball Announcer";
const autoAnnounce = true; // change to false if you want to stop spamming

export const serverAnnouncerPlugin: Plugin = (room) => {
  let serverUrl = "";
  const announce = () => {
    if (!serverUrl) {
      console.error("announce: server url is empty!");
      return;
    }
    fetch($DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        username: botName,
        content: serverUrl,
      }),
    });
  };
  return {
    onRoomLink: (url) => {
      serverUrl = url;
      if (autoAnnounce) {
        announce();
      }
    },
    onPlayerChat: (_, message) => {
      if (message.startsWith("!d")) {
        announce();
      }
    },
  };
};
