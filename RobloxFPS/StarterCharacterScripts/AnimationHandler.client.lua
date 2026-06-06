-- LOCATION: StarterCharacterScripts > LocalScript named "AnimationHandler"
-- Manages idle/walk/run/shoot/die animation state machine.
-- Disable the default "Animate" LocalScript in StarterCharacterScripts
-- (set it to Disabled in Properties) before using this.

local Players      = game:GetService("Players")
local RunService   = game:GetService("RunService")
local RS           = game:GetService("ReplicatedStorage")

local GameConfig   = require(RS:WaitForChild("GameConfig"))
local ShootBindable= RS:WaitForChild("ShootBindable")

local localPlayer  = Players.LocalPlayer
local character    = script.Parent
local humanoid     = character:WaitForChild("Humanoid")
local animator     = humanoid:WaitForChild("Animator")

-- ── Load animations ───────────────────────────────────────────────────────────
local function loadTrack(id)
	local anim = Instance.new("Animation")
	anim.AnimationId = id
	return animator:LoadAnimation(anim)
end

local tracks = {
	Idle  = loadTrack(GameConfig.ANIMATIONS.Idle),
	Walk  = loadTrack(GameConfig.ANIMATIONS.Walk),
	Run   = loadTrack(GameConfig.ANIMATIONS.Run),
	Jump  = loadTrack(GameConfig.ANIMATIONS.Jump),
	Shoot = loadTrack(GameConfig.ANIMATIONS.Shoot),
	Die   = loadTrack(GameConfig.ANIMATIONS.Die),
}

-- Priority configuration
tracks.Idle.Priority  = Enum.AnimationPriority.Idle
tracks.Walk.Priority  = Enum.AnimationPriority.Movement
tracks.Run.Priority   = Enum.AnimationPriority.Movement
tracks.Jump.Priority  = Enum.AnimationPriority.Movement
tracks.Shoot.Priority = Enum.AnimationPriority.Action
tracks.Die.Priority   = Enum.AnimationPriority.Action2

tracks.Idle.Looped  = true
tracks.Walk.Looped  = true
tracks.Run.Looped   = true

-- ── State machine ─────────────────────────────────────────────────────────────
local currentMovement = nil   -- "Idle" | "Walk" | "Run" | "Jump"
local dead = false

local function playMovement(name)
	if currentMovement == name then return end
	if currentMovement and tracks[currentMovement] then
		tracks[currentMovement]:Stop(0.2)
	end
	currentMovement = name
	tracks[name]:Play(0.2)
end

RunService.Heartbeat:Connect(function()
	if dead then return end

	local speed = humanoid.MoveDirection.Magnitude * humanoid.WalkSpeed

	if not humanoid:GetState() == Enum.HumanoidStateType.Freefall then
		if speed < 0.5 then
			playMovement("Idle")
		elseif speed < 14 then
			playMovement("Walk")
		else
			playMovement("Run")
		end
	end
end)

-- Jump state
humanoid.StateChanged:Connect(function(_, new)
	if dead then return end
	if new == Enum.HumanoidStateType.Jumping
		or new == Enum.HumanoidStateType.Freefall then
		playMovement("Jump")
	end
end)

-- Shoot animation (one-shot blend over movement)
ShootBindable.Event:Connect(function()
	if dead then return end
	local t = tracks.Shoot
	if t.IsPlaying then t:Stop(0) end
	t:Play(0.05)
	task.delay(t.Length > 0 and t.Length or 0.3, function()
		t:Stop(0.1)
	end)
end)

-- Death
humanoid.Died:Connect(function()
	dead = true
	for _, t in pairs(tracks) do
		if t ~= tracks.Die then t:Stop(0.1) end
	end
	tracks.Die:Play(0.1)
end)

-- Start in idle
tracks.Idle:Play(0)
currentMovement = "Idle"

print("[AnimationHandler] Animations loaded for", character.Name)
