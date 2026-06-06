-- LOCATION: ServerScriptService > Script named "GameManager"
-- Authoritative server: validates hits, awards XP, tracks levels and quests.
-- Also creates all RemoteEvents so client scripts can find them via WaitForChild.

local Players       = game:GetService("Players")
local RS            = game:GetService("ReplicatedStorage")

local GameConfig    = require(RS:WaitForChild("GameConfig"))

-- ── Create RemoteEvents (must happen before clients load) ────────────────────
local function getOrCreate(class, name)
	return RS:FindFirstChild(name) or (function()
		local obj = Instance.new(class)
		obj.Name = name
		obj.Parent = RS
		return obj
	end)()
end

local ShootEvent     = getOrCreate("RemoteEvent",   "ShootEvent")
local XPAwarded      = getOrCreate("RemoteEvent",   "XPAwarded")
local LevelUpEvent   = getOrCreate("RemoteEvent",   "LevelUp")
local QuestProgress  = getOrCreate("RemoteEvent",   "QuestProgress")
local QuestCompleted = getOrCreate("RemoteEvent",   "QuestCompleted")
local ShootBindable  = getOrCreate("BindableEvent", "ShootBindable")

-- Per-player state
local playerData = {}

local function newPlayerData()
	return {
		xp             = 0,
		level          = 1,
		kills          = 0,
		headshots      = 0,
		completedQuests = {},
	}
end

-- ── XP & Levelling ───────────────────────────────────────────────────────────

local function awardXP(player, amount, label)
	local data = playerData[player.UserId]
	if not data then return end

	data.xp = data.xp + amount
	local newLevel = GameConfig.getLevelForXP(data.xp)

	local leveledUp = newLevel > data.level
	data.level = newLevel

	XPAwarded:FireClient(player, {
		amount  = amount,
		total   = data.xp,
		level   = data.level,
		label   = label or "",
	})

	if leveledUp then
		LevelUpEvent:FireClient(player, { newLevel = data.level })
	end
end

-- ── Quest Checking ───────────────────────────────────────────────────────────

local function checkQuests(player)
	local data = playerData[player.UserId]
	if not data then return end

	for _, quest in ipairs(GameConfig.QUESTS) do
		if data.completedQuests[quest.id] then continue end

		local current = 0
		if quest.type == "kills"     then current = data.kills
		elseif quest.type == "headshots" then current = data.headshots
		elseif quest.type == "level" then current = data.level
		end

		QuestProgress:FireClient(player, {
			questId = quest.id,
			current = current,
			target  = quest.target,
		})

		if current >= quest.target then
			data.completedQuests[quest.id] = true
			QuestCompleted:FireClient(player, {
				questId   = quest.id,
				xpReward  = quest.xpReward,
				name      = quest.name,
			})
			awardXP(player, quest.xpReward, "QUEST: " .. quest.name)
		end
	end
end

-- ── Shoot Validation ─────────────────────────────────────────────────────────

local RAYCAST_PARAMS = RaycastParams.new()
RAYCAST_PARAMS.FilterType = Enum.RaycastFilterType.Exclude

ShootEvent.OnServerEvent:Connect(function(shooter, origin, direction)
	local data = playerData[shooter.UserId]
	if not data then return end

	local char = shooter.Character
	if not char then return end

	-- Exclude the shooter's own character from the ray
	RAYCAST_PARAMS.FilterDescendantsInstances = { char }

	local result = workspace:Raycast(
		origin,
		direction.Unit * GameConfig.WEAPON.range,
		RAYCAST_PARAMS
	)

	if not result then return end

	local hit = result.Instance
	if not hit then return end

	-- Find the humanoid of whoever was hit
	local targetChar = hit:FindFirstAncestorWhichIsA("Model")
	if not targetChar then return end

	local humanoid = targetChar:FindFirstChildWhichIsA("Humanoid")
	if not humanoid or humanoid.Health <= 0 then return end

	-- Don't let a player shoot themselves
	local targetPlayer = Players:GetPlayerFromCharacter(targetChar)
	if targetPlayer and targetPlayer == shooter then return end

	local isHeadshot = (hit.Name == "Head")
	local damage = isHeadshot
		and (GameConfig.WEAPON.damage * GameConfig.WEAPON.headshot_mult)
		or  GameConfig.WEAPON.damage

	local wasAlive = humanoid.Health > 0
	humanoid:TakeDamage(damage)

	local xpLabel
	if isHeadshot then
		data.headshots += 1
		xpLabel = "HEADSHOT!"
		awardXP(shooter, GameConfig.XP_PER_HEADSHOT, xpLabel)
	else
		awardXP(shooter, GameConfig.XP_PER_KILL, "Elimination")
	end

	-- Award kill XP only once (when health crosses zero)
	if wasAlive and humanoid.Health <= 0 then
		data.kills += 1
	end

	checkQuests(shooter)
end)

-- ── Player Lifecycle ─────────────────────────────────────────────────────────

Players.PlayerAdded:Connect(function(player)
	playerData[player.UserId] = newPlayerData()

	player.CharacterAdded:Connect(function()
		-- Re-send current state so HUD is correct after respawn
		local data = playerData[player.UserId]
		if not data then return end
		task.wait(1) -- let client load
		XPAwarded:FireClient(player, {
			amount = 0,
			total  = data.xp,
			level  = data.level,
			label  = "",
		})
		checkQuests(player)
	end)
end)

Players.PlayerRemoving:Connect(function(player)
	playerData[player.UserId] = nil
end)

print("[GameManager] Server ready.")
