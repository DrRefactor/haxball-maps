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
      const playerDiscProperties = room.getPlayerDiscProperties(player.id);
      if (!playerDiscProperties) {
        return;
      }
      const ballDiscProperties = room.getDiscProperties(0);
      if (!ballDiscProperties) {
        return;
      }
      const distanceToBall = discsDistance(playerDiscProperties, ballDiscProperties);
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

  let originalProperties = {
    invMass: 1,
    color: 0xFFFFFF,
    bCoeff: 1,
    ygravity: 0,
    radius: 10
  };
  let restoreTimerId: number = 0;
  let spinTimerId: number = 0;
  const spinDuration = 25;
  const spinGravity = 0.3;

  return {
    onPlayerBallKick: function (player) {
      const powerMultiplier =
        powerShotRatio[player.team] *
        ((playerTouchTime[player.id] >= megaPowerTouchTime && megaPowerMultiplier) ||
          (playerTouchTime[player.id] >= powerTouchTime && 1) ||
          0);
      if (powerMultiplier) {
        const ballDiscProperties = room.getDiscProperties(0);
        if (!ballDiscProperties) {
          return;
        }
        const spinSign = ballDiscProperties.yspeed > 0 ? -1 : 1;
        room.setDiscProperties(0, {
          xspeed: powerMultiplier * (ballDiscProperties.xspeed ?? 0),
          yspeed: powerMultiplier * (ballDiscProperties.yspeed ?? 0),
          color: player.team === TEAM.RED ? 0xAA0000 : 0x0000AA,
          invMass: originalProperties.invMass / 2,
          ygravity: originalProperties.ygravity + spinGravity * spinSign,
          radius: 12
        });
        window.clearTimeout(spinTimerId);
        spinTimerId = window.setTimeout(() => {
          room.setDiscProperties(0, {
            ygravity: originalProperties.ygravity,
            radius: originalProperties.radius,
            color: player.team === TEAM.RED ? 0xFF0000 : 0x0000FF,
          });
        }, spinDuration);
        window.clearTimeout(restoreTimerId);
        restoreTimerId = window.setTimeout(() => {
          room.setDiscProperties(0, {
            color: originalProperties.color,
            bCoeff: originalProperties.bCoeff,
            invMass: originalProperties.invMass,
          });
        }, 2000);
        resetTouchTimes();
      }
    },

    onGameStart: function () {
      originalProperties = room.getDiscProperties(0) || originalProperties;
    },

    onGameStop: function (byPlayer) {
      playerTouchTime = {};
      window.clearTimeout(restoreTimerId);
      window.clearTimeout(spinTimerId);
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
