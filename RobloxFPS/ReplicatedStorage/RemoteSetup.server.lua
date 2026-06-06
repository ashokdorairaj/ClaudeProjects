-- LOCATION: ReplicatedStorage > Script named "RemoteSetup"
-- Runs once on server startup to create all RemoteEvents used by the game.
-- Client scripts wait for these with WaitForChild before using them.

local RS = game:GetService("ReplicatedStorage")

local function makeEvent(name)
	if RS:FindFirstChild(name) then return end
	local e = Instance.new("RemoteEvent")
	e.Name = name
	e.Parent = RS
end

local function makeFunction(name)
	if RS:FindFirstChild(name) then return end
	local f = Instance.new("RemoteFunction")
	f.Name = name
	f.Parent = RS
end

local function makeBindable(name)
	if RS:FindFirstChild(name) then return end
	local b = Instance.new("BindableEvent")
	b.Name = name
	b.Parent = RS
end

-- Client fires when shooting; server validates and applies damage
makeEvent("ShootEvent")

-- Server fires to client with XP info { amount, total, level }
makeEvent("XPAwarded")

-- Server fires to client on level up { newLevel }
makeEvent("LevelUp")

-- Server fires to client with quest progress { questId, current, target }
makeEvent("QuestProgress")

-- Server fires to client when a quest is finished { questId, xpReward, name }
makeEvent("QuestCompleted")

-- BindableEvent so AnimationHandler (StarterCharacterScripts) can react to shots
makeBindable("ShootBindable")

print("[RemoteSetup] All remotes created.")
