-- LOCATION: ReplicatedStorage > ModuleScript named "GameConfig"
-- Both server and client scripts require this module.

local GameConfig = {}

GameConfig.XP_PER_KILL      = 100
GameConfig.XP_PER_HEADSHOT  = 150  -- replaces base kill XP on headshots

-- XP required to reach each level (index = level number)
GameConfig.LEVEL_THRESHOLDS = {
	[1]  = 0,
	[2]  = 500,
	[3]  = 1200,
	[4]  = 2500,
	[5]  = 4500,
	[6]  = 7000,
	[7]  = 10500,
	[8]  = 15000,
	[9]  = 21000,
	[10] = 28500,
}
GameConfig.MAX_LEVEL = 10

-- Returns the level number for a given total XP
function GameConfig.getLevelForXP(xp)
	local level = 1
	for lvl = GameConfig.MAX_LEVEL, 1, -1 do
		if xp >= GameConfig.LEVEL_THRESHOLDS[lvl] then
			level = lvl
			break
		end
	end
	return level
end

-- Returns XP needed for next level (nil if max level)
function GameConfig.xpForNextLevel(currentLevel)
	if currentLevel >= GameConfig.MAX_LEVEL then return nil end
	return GameConfig.LEVEL_THRESHOLDS[currentLevel + 1]
end

GameConfig.QUESTS = {
	{
		id        = "first_blood",
		name      = "First Blood",
		desc      = "Get your first elimination",
		type      = "kills",
		target    = 1,
		xpReward  = 200,
		icon      = "rbxassetid://6031094678",
	},
	{
		id        = "on_a_roll",
		name      = "On a Roll",
		desc      = "Get 5 eliminations",
		type      = "kills",
		target    = 5,
		xpReward  = 500,
		icon      = "rbxassetid://6031094678",
	},
	{
		id        = "warpath",
		name      = "Warpath",
		desc      = "Get 25 eliminations",
		type      = "kills",
		target    = 25,
		xpReward  = 1500,
		icon      = "rbxassetid://6031094678",
	},
	{
		id        = "sharpshooter",
		name      = "Sharpshooter",
		desc      = "Land 10 headshots",
		type      = "headshots",
		target    = 10,
		xpReward  = 800,
		icon      = "rbxassetid://6031094678",
	},
	{
		id        = "veteran",
		name      = "Veteran",
		desc      = "Reach Level 5",
		type      = "level",
		target    = 5,
		xpReward  = 1000,
		icon      = "rbxassetid://6031094678",
	},
}

GameConfig.WEAPON = {
	damage           = 34,
	headshot_mult    = 3,     -- headshot damage = damage * headshot_mult
	fire_rate        = 0.15,  -- seconds between shots
	range            = 500,   -- studs
	muzzle_offset    = Vector3.new(0, 0, -2),
}

-- Animation asset IDs (free Roblox catalog animations)
GameConfig.ANIMATIONS = {
	Idle  = "rbxassetid://507766666",
	Walk  = "rbxassetid://507777826",
	Run   = "rbxassetid://507767714",
	Jump  = "rbxassetid://507765000",
	Shoot = "rbxassetid://522635514",
	Die   = "rbxassetid://507771019",
}

return GameConfig
