// import React from 'react';

interface HUDProps {
  health: number;
  maxHealth: number;
  ammo: {
    pistol: number;
    shotgun: number;
    chaingun: number;
  };
  maxAmmo: {
    pistol: number;
    shotgun: number;
    chaingun: number;
  };
  weapon?: string;
  isAttacking?: boolean;
}

export default function HUD({
  health,
  maxHealth,
  ammo,
  maxAmmo,
  weapon = "pistol",
  isAttacking = false,
}: HUDProps) {
  const healthPercentage = (health / maxHealth) * 100;

  // Determine face sprite based on health
  const getFaceColor = () => {
    if (healthPercentage > 75) return "#4ADE80"; // Green - healthy
    if (healthPercentage > 50) return "#FCD34D"; // Yellow - injured
    if (healthPercentage > 25) return "#FB923C"; // Orange - hurt
    return "#EF4444"; // Red - critical
  };

  const getFaceExpression = () => {
    if (isAttacking) return "😠"; // Angry when attacking
    if (healthPercentage > 75) return "😊";
    if (healthPercentage > 50) return "😐";
    if (healthPercentage > 25) return "😬";
    return "😵";
  };

  const getWeaponColor = () => {
    switch (weapon) {
      case "pistol":
        return "#FCD34D"; // Yellow
      case "shotgun":
        return "#FB923C"; // Orange
      case "chaingun":
        return "#EF4444"; // Red
      default:
        return "#FCD34D";
    }
  };

  const getWeaponDisplay = () => {
    return weapon.toUpperCase();
  };

  const getWeaponStats = () => {
    switch (weapon) {
      case "pistol":
        return { damage: 12, rate: "Medium", range: "Medium (15m)" }; // Updated damage
      case "shotgun":
        return { damage: 22, rate: "Slow", range: "Close (8m)" }; // Updated damage
      case "chaingun":
        return { damage: 7, rate: "Fast", range: "Medium (12m)" }; // Updated damage
      default:
        return { damage: 12, rate: "Medium", range: "Medium (15m)" }; // Updated damage
    }
  };

  const weaponStats = getWeaponStats();

  return (
    <div
      className="p-4 text-white"
      style={{ backgroundColor: "#1f2937", border: "2px solid #4b5563" }}
    >
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Left side - Health */}
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-lg text-gray-400 mb-1 font-medium">HEALTH</div>
            <div
              className="text-3xl font-mono font-bold"
              style={{ color: getFaceColor() }}
            >
              {health}%
            </div>
          </div>

          {/* Health bar */}
          <div className="w-32 h-8 bg-gray-700 border-2 border-gray-500 rounded">
            <div
              className="h-full transition-all duration-200 rounded"
              style={{
                width: `${healthPercentage}%`,
                backgroundColor: getFaceColor(),
                boxShadow: `0 0 8px ${getFaceColor()}`,
              }}
            />
          </div>
        </div>

        {/* Center - Face */}
        <div className="flex flex-col items-center">
          <div
            className={`text-6xl mb-2 transition-all duration-100 ${
              isAttacking ? "animate-pulse" : ""
            }`}
            style={{
              filter: isAttacking
                ? "hue-rotate(0deg) brightness(1.2)"
                : "hue-rotate(0deg)",
              transform: isAttacking ? "scale(1.1)" : "scale(1.0)",
            }}
          >
            {getFaceExpression()}
          </div>
          <div className="text-lg text-gray-400 font-medium">MARINE</div>
        </div>

        {/* Right side - Ammo */}
        <div className="flex items-center space-x-4">
          {/* Ammo bar */}
          <div className="w-32 h-8 bg-gray-700 border-2 border-gray-500 rounded">
            <div
              className="h-full bg-blue-500 transition-all duration-200 rounded"
              style={{
                width: `${
                  ((ammo[weapon as keyof typeof ammo] || 0) /
                    (maxAmmo[weapon as keyof typeof maxAmmo] || 1)) *
                  100
                }%`,
                boxShadow: "0 0 8px #3b82f6",
              }}
            />
          </div>

          <div className="text-center">
            <div className="text-lg text-gray-400 mb-1 font-medium">AMMO</div>
            <div className="text-3xl font-mono text-blue-400 font-bold">
              {ammo[weapon as keyof typeof ammo] || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status indicators */}
      <div className="flex justify-center mt-4 space-x-8 text-lg">
        <div className="flex items-center space-x-2">
          <div
            className={`w-4 h-4 border transition-all duration-200 ${
              isAttacking ? "animate-pulse" : ""
            }`}
            style={{
              backgroundColor: getWeaponColor(),
              borderColor: getWeaponColor(),
              boxShadow: isAttacking ? `0 0 8px ${getWeaponColor()}` : "none",
            }}
          ></div>
          <span className="font-medium" style={{ color: getWeaponColor() }}>
            {getWeaponDisplay()}
          </span>
          {isAttacking && (
            <span className="text-red-400 animate-pulse font-bold">FIRING</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 border border-red-400"></div>
          <span className="font-medium">HURT ME PLENTY</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 border border-green-400"></div>
          <span className="font-medium">READY</span>
        </div>
      </div>

      {/* Weapon stats display */}
      <div className="flex justify-center mt-3 text-lg text-gray-400">
        <div className="flex items-center space-x-6">
          <span>Damage: {weaponStats.damage}</span>
          <span>Rate: {weaponStats.rate}</span>
          <span>Range: {weaponStats.range}</span>
        </div>
      </div>

      {/* Weapon switching hint and effectiveness info */}
      <div className="flex flex-col items-center mt-2 space-y-1">
        <div className="text-lg text-gray-300 font-medium">
          Press 1, 2, or 3 to switch weapons
        </div>
        <div className="text-center">
          {weapon === "shotgun" && (
            <span className="text-orange-400 font-medium text-lg">
              • High damage at close range • Damage drops with distance •
            </span>
          )}
          {weapon === "pistol" && (
            <span className="text-yellow-400 font-medium text-lg">
              • Balanced all-around weapon • Reliable at medium range •
            </span>
          )}
          {weapon === "chaingun" && (
            <span className="text-red-400 font-medium text-lg">
              • Rapid fire • Lower damage per shot • Medium range •
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
