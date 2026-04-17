import { PlayerId } from "./types/haxball-api";
import { discsDistance } from "./utils/geometry";
import { Plugin } from "./utils/plugin";

export const pvpShootPlugin: Plugin = (room) => {
  const playerCooldowns: Record<PlayerId, number> = {};
  const cooldownTime = 5000;
  return {
    onGameStart: () => {
      const code = `
        const gameWindow = window.frames[0]
        function shoot() {
          const input = gameWindow.document.getElementsByTagName('input')[0]
          input.value = '!shoot 1'
          input.dispatchEvent(new KeyboardEvent("keydown", {
            key: "enter",
            keyCode: 13,
            code: "KeyEnter",
            which: 13,
          }));
        }
        gameWindow.addEventListener('keydown', (event) => {
          if (event.key === 'q') {
            shoot()
          }
        })
      `;
      room.sendAnnouncement(`code:`);
      room.sendAnnouncement(code, undefined, 0xaaaaaa, "italic", 1);
    },
    onPlayerChat: (player, message) => {
      if (message.startsWith("!shoot")) {
        if (
          playerCooldowns[player.id] &&
          playerCooldowns[player.id] > Date.now()
        ) {
          room.sendAnnouncement(
            `You must wait ${Math.floor((playerCooldowns[player.id] - Date.now()) / 1000)} seconds before shooting again`,
            player.id,
          );
          return;
        }
        playerCooldowns[player.id] = Date.now() + cooldownTime;
        const opponents = room
          .getPlayerList()
          .filter((p) => p.team !== player.team);
        if (opponents.length > 0) {
          const [, closestOpponent] = opponents.slice(1).reduce(
            ([closestDistance, closestOpponent], opponent) => {
              const distance = discsDistance(
                player.position,
                opponent.position,
              );
              return distance < closestDistance
                ? [distance, opponent]
                : [closestDistance, closestOpponent];
            },
            [Infinity, opponents[0]],
          );

          const angle = Math.atan2(
            closestOpponent.position.y - player.position.y,
            closestOpponent.position.x - player.position.x,
          );
          const bulletId = message.split(" ")[1] || 1;
          room.setDiscProperties(+bulletId, {
            x: player.position.x,
            y: player.position.y,
            xspeed: Math.cos(angle) * 10,
            yspeed: Math.sin(angle) * 10,
            color: player.team === 1 ? 0xff0000 : 0x0000ff,
          });
        }
      }
    },
  };
};
