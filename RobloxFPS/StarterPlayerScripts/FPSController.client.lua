-- LOCATION: StarterPlayerScripts > LocalScript named "FPSController"
-- Handles: first-person camera, arrow-key movement, mouse look, shooting.

local Players          = game:GetService("Players")
local RunService       = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local RS               = game:GetService("ReplicatedStorage")

local ShootEvent    = RS:WaitForChild("ShootEvent")
local ShootBindable = RS:WaitForChild("ShootBindable")
local GameConfig    = require(RS:WaitForChild("GameConfig"))

local localPlayer = Players.LocalPlayer
local camera      = workspace.CurrentCamera

local MOUSE_SENSITIVITY = 0.003
local WALK_SPEED        = 16
local CAMERA_OFFSET     = CFrame.new(0, 0.6, 0)

local yaw          = 0
local pitch        = 0
local lastShotTime = 0
local character, humanoid, hrp, head

-- Keep camera in Scriptable mode (set each frame so default camera can't override it)
local function lockCamera()
	if camera.CameraType ~= Enum.CameraType.Scriptable then
		camera.CameraType = Enum.CameraType.Scriptable
	end
end

local function onCharacterAdded(char)
	character = char
	humanoid  = char:WaitForChild("Humanoid")
	hrp       = char:WaitForChild("HumanoidRootPart")
	head      = char:WaitForChild("Head")
	humanoid.WalkSpeed = WALK_SPEED

	-- Hide body parts in first-person
	for _, desc in ipairs(char:GetDescendants()) do
		if desc:IsA("BasePart") or desc:IsA("Decal") then
			desc.LocalTransparencyModifier = 1
		end
	end
	char.DescendantAdded:Connect(function(d)
		if d:IsA("BasePart") or d:IsA("Decal") then
			d.LocalTransparencyModifier = 1
		end
	end)
end

if localPlayer.Character then
	onCharacterAdded(localPlayer.Character)
end
localPlayer.CharacterAdded:Connect(onCharacterAdded)

-- Lock mouse
UserInputService.MouseBehavior   = Enum.MouseBehavior.LockCenter
UserInputService.MouseIconEnabled = false

UserInputService.WindowFocused:Connect(function()
	UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter
end)

-- Mouse look
UserInputService.InputChanged:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseMovement then
		yaw   = yaw   - input.Delta.X * MOUSE_SENSITIVITY
		pitch = math.clamp(pitch - input.Delta.Y * MOUSE_SENSITIVITY, -1.4, 1.4)
	end
end)

-- Camera update (high priority so it runs last each frame)
RunService:BindToRenderStep("FPSCamera", Enum.RenderPriority.Camera.Value + 1, function()
	lockCamera()
	if not head then return end

	camera.CFrame = CFrame.new(head.Position)
		* CFrame.Angles(0, yaw, 0)
		* CFrame.Angles(pitch, 0, 0)
		* CAMERA_OFFSET

	if hrp then
		hrp.CFrame = CFrame.new(hrp.Position) * CFrame.Angles(0, yaw, 0)
	end
end)

-- Arrow key / WASD movement
RunService.Heartbeat:Connect(function()
	if not humanoid or not hrp then return end
	if humanoid.Health <= 0 then return end

	local move  = Vector3.zero
	local look  = hrp.CFrame.LookVector
	local right = hrp.CFrame.RightVector

	if UserInputService:IsKeyDown(Enum.KeyCode.Up)   or UserInputService:IsKeyDown(Enum.KeyCode.W) then move += look  end
	if UserInputService:IsKeyDown(Enum.KeyCode.Down)  or UserInputService:IsKeyDown(Enum.KeyCode.S) then move -= look  end
	if UserInputService:IsKeyDown(Enum.KeyCode.Right) or UserInputService:IsKeyDown(Enum.KeyCode.D) then move += right end
	if UserInputService:IsKeyDown(Enum.KeyCode.Left)  or UserInputService:IsKeyDown(Enum.KeyCode.A) then move -= right end

	humanoid:Move(move.Magnitude > 0 and move.Unit or Vector3.zero, false)
end)

-- Shooting — do NOT check gameProcessed; mouse-lock clicks are flagged as processed by Roblox
UserInputService.InputBegan:Connect(function(input)
	if input.UserInputType ~= Enum.UserInputType.MouseButton1 then return end
	if not head then return end

	local now = tick()
	if now - lastShotTime < GameConfig.WEAPON.fire_rate then return end
	lastShotTime = now

	ShootEvent:FireServer(camera.CFrame.Position, camera.CFrame.LookVector)
	ShootBindable:Fire()
end)
