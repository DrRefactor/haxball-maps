import { ballRadius, playerRadius, TEAM } from "./constants";
import { PlayerId } from "./types/haxball-api.d";
import { discsDistance } from "./utils/geometry";
import { Plugin } from "./utils/plugin";

const triggerDistance = ballRadius + playerRadius + 75;
const powerTouchTime = 80;
const megaPowerTouchTime = 160;
const powerAvatar = "P";
const megaPowerAvatar = "P!";

const powerShotRatio = {
  [TEAM.RED]: 1.8,
  [TEAM.BLUE]: 1.8,
};
const megaPowerMultiplier = 1.5;

export const powerPlugin: Plugin = room => {
  let playerTouchTime: Record<PlayerId, number> = {};

  function saveTouchTime() {
    room.getPlayerList().forEach(player => {
      const distanceToBall = discsDistance(room.getPlayerDiscProperties(player.id), room.getDiscProperties(0));
      const touches = distanceToBall < triggerDistance;
      if (touches) {
        playerTouchTime[player.id] = playerTouchTime[player.id] || 0;
        playerTouchTime[player.id]++;
      } else {
        playerTouchTime[player.id] = 0;
      }
    });
  }

  function updateAvatars() {
    Object.entries(playerTouchTime).forEach(([playerId, playerTouchTime]) => {
      if (playerTouchTime >= megaPowerTouchTime) {
        room.setPlayerAvatar(+playerId, megaPowerAvatar);
      } else if (playerTouchTime >= powerTouchTime) {
        room.setPlayerAvatar(+playerId, powerAvatar);
      } else if (playerTouchTime > 0) {
        const a = Math.round((10 * playerTouchTime) / powerTouchTime);
        room.setPlayerAvatar(+playerId, "." + a);
      } else {
        room.setPlayerAvatar(+playerId, null);
      }
    });
  }

  function resetTouchTimes() {
    playerTouchTime = {};
    updateAvatars();
  }

  return {
    onPlayerBallKick: function (player) {
      const powerMultiplier =
        powerShotRatio[player.team] *
        ((playerTouchTime[player.id] >= megaPowerTouchTime && megaPowerMultiplier) ||
          (playerTouchTime[player.id] >= powerTouchTime && 1) ||
          0);
      if (powerMultiplier) {
        room.setDiscProperties(0, {
          xspeed: powerMultiplier * (room.getDiscProperties(0)?.xspeed ?? 0),
          yspeed: powerMultiplier * (room.getDiscProperties(0)?.yspeed ?? 0),
        });
        resetTouchTimes();
      }
    },

    onGameStop: function (byPlayer) {
      playerTouchTime = {};
    },

    onGameTick: function () {
      if (room.getPlayerList().filter(p => p.team != 0).length > 0) {
        saveTouchTime();
      }
      updateAvatars();
    },

    onPlayerChat: function (player, message) {
      if (message.toLowerCase().startsWith("!power")) {
        const [_, teamIdString, powerString] = message.split(",");
        const power = Number.parseFloat(powerString);
        const team = Number.parseInt(teamIdString);
        if (!Number.isNaN(power) && !Number.isNaN(team)) {
          powerShotRatio[team] = power;
          room.sendAnnouncement(`Power of team ${team} set to ${power}`, player.id);
        } else {
          room.sendAnnouncement(`Incorrect power settings, command syntax: !power,<team_id>,<power_value>`, player.id);
        }
      }
    },
  };
};
