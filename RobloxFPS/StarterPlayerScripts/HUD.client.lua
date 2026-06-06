-- LOCATION: StarterPlayerScripts > LocalScript named "HUD"
-- Builds all UI: crosshair, XP bar, level display, quest tracker,
-- +XP popups, level-up banner, and kill feed.

local Players      = game:GetService("Players")
local RS           = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local localPlayer = Players.LocalPlayer
local playerGui   = localPlayer:WaitForChild("PlayerGui")

-- ── Helper ────────────────────────────────────────────────────────────────────
local function make(class, props, parent)
	local obj = Instance.new(class)
	for k, v in pairs(props) do obj[k] = v end
	if parent then obj.Parent = parent end
	return obj
end

-- ── Root ScreenGui ────────────────────────────────────────────────────────────
local gui = make("ScreenGui", {
	Name           = "FPS_HUD",
	ResetOnSpawn   = false,
	IgnoreGuiInset = true,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
}, playerGui)

-- ══════════════════════════════════════════════════════════════════════════════
-- CROSSHAIR  — created first so it always shows immediately
-- ══════════════════════════════════════════════════════════════════════════════
local crosshairFrame = make("Frame", {
	Name                   = "Crosshair",
	Size                   = UDim2.new(0, 30, 0, 30),
	AnchorPoint            = Vector2.new(0.5, 0.5),
	Position               = UDim2.new(0.5, 0, 0.5, 0),
	BackgroundTransparency = 1,
	ZIndex                 = 20,
}, gui)

-- Horizontal bar
make("Frame", {
	Size             = UDim2.new(0, 20, 0, 3),
	AnchorPoint      = Vector2.new(0.5, 0.5),
	Position         = UDim2.new(0.5, 0, 0.5, 0),
	BackgroundColor3 = Color3.fromRGB(0, 255, 120),
	BorderSizePixel  = 0,
	ZIndex           = 20,
}, crosshairFrame)

-- Vertical bar
make("Frame", {
	Size             = UDim2.new(0, 3, 0, 20),
	AnchorPoint      = Vector2.new(0.5, 0.5),
	Position         = UDim2.new(0.5, 0, 0.5, 0),
	BackgroundColor3 = Color3.fromRGB(0, 255, 120),
	BorderSizePixel  = 0,
	ZIndex           = 20,
}, crosshairFrame)

-- Center dot
make("Frame", {
	Size             = UDim2.new(0, 4, 0, 4),
	AnchorPoint      = Vector2.new(0.5, 0.5),
	Position         = UDim2.new(0.5, 0, 0.5, 0),
	BackgroundColor3 = Color3.fromRGB(255, 255, 255),
	BorderSizePixel  = 0,
	ZIndex           = 21,
}, crosshairFrame)

-- ══════════════════════════════════════════════════════════════════════════════
-- Wait for server-created events and config (after crosshair is already up)
-- ══════════════════════════════════════════════════════════════════════════════
local GameConfig    = require(RS:WaitForChild("GameConfig"))
local XPAwarded     = RS:WaitForChild("XPAwarded")
local LevelUpEvent  = RS:WaitForChild("LevelUp")
local QuestProgress = RS:WaitForChild("QuestProgress")
local QuestCompleted= RS:WaitForChild("QuestCompleted")

-- ══════════════════════════════════════════════════════════════════════════════
-- XP BAR  (bottom center)
-- ══════════════════════════════════════════════════════════════════════════════
local xpBarBg = make("Frame", {
	Size             = UDim2.new(0.5, 0, 0, 22),
	AnchorPoint      = Vector2.new(0.5, 1),
	Position         = UDim2.new(0.5, 0, 1, -44),
	BackgroundColor3 = Color3.fromRGB(30, 30, 30),
	BorderSizePixel  = 0,
	ZIndex           = 5,
}, gui)
make("UICorner", { CornerRadius = UDim.new(0, 6) }, xpBarBg)

local xpFill = make("Frame", {
	Size             = UDim2.new(0, 0, 1, 0),
	BackgroundColor3 = Color3.fromRGB(80, 200, 120),
	BorderSizePixel  = 0,
	ZIndex           = 6,
}, xpBarBg)
make("UICorner", { CornerRadius = UDim.new(0, 6) }, xpFill)

local levelLabel = make("TextLabel", {
	Size                   = UDim2.new(0, 80, 1, 0),
	AnchorPoint            = Vector2.new(1, 0),
	Position               = UDim2.new(0, -6, 0, 0),
	BackgroundTransparency = 1,
	Text                   = "LVL 1",
	TextColor3             = Color3.new(1, 1, 1),
	Font                   = Enum.Font.GothamBold,
	TextSize               = 14,
	TextXAlignment         = Enum.TextXAlignment.Right,
	ZIndex                 = 7,
}, xpBarBg)

local xpLabel = make("TextLabel", {
	Size                   = UDim2.new(1, 0, 1, 0),
	BackgroundTransparency = 1,
	Text                   = "0 / 500",
	TextColor3             = Color3.new(1, 1, 1),
	Font                   = Enum.Font.Gotham,
	TextSize               = 12,
	ZIndex                 = 7,
}, xpBarBg)

local function updateXPBar(total, level)
	local nextXP = GameConfig.xpForNextLevel(level)
	local prevXP = GameConfig.LEVEL_THRESHOLDS[level]
	levelLabel.Text = "LVL " .. level
	if nextXP then
		local pct = math.clamp((total - prevXP) / (nextXP - prevXP), 0, 1)
		xpLabel.Text = (total - prevXP) .. " / " .. (nextXP - prevXP)
		TweenService:Create(xpFill, TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			{ Size = UDim2.new(pct, 0, 1, 0) }):Play()
	else
		xpLabel.Text = "MAX"
		TweenService:Create(xpFill, TweenInfo.new(0.4), { Size = UDim2.new(1, 0, 1, 0) }):Play()
	end
end

-- ══════════════════════════════════════════════════════════════════════════════
-- +XP POPUP
-- ══════════════════════════════════════════════════════════════════════════════
local function showXPPopup(amount, label)
	local text = (label and label ~= "")
		and ("+" .. amount .. " XP  " .. label)
		or  ("+" .. amount .. " XP")

	local popup = make("TextLabel", {
		Size                   = UDim2.new(0, 260, 0, 34),
		AnchorPoint            = Vector2.new(0.5, 0.5),
		Position               = UDim2.new(0.5, 0, 0.62, 0),
		BackgroundTransparency = 1,
		Text                   = text,
		TextColor3             = Color3.fromRGB(255, 220, 60),
		Font                   = Enum.Font.GothamBold,
		TextSize               = 20,
		ZIndex                 = 20,
	}, gui)

	TweenService:Create(popup, TweenInfo.new(1.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
		Position        = UDim2.new(0.5, 0, 0.52, 0),
		TextTransparency = 1,
	}):Play()
	task.delay(1.3, function() popup:Destroy() end)
end

XPAwarded.OnClientEvent:Connect(function(info)
	if info.amount and info.amount > 0 then
		showXPPopup(info.amount, info.label)
	end
	if info.total ~= nil then
		updateXPBar(info.total, info.level)
	end
end)

-- ══════════════════════════════════════════════════════════════════════════════
-- LEVEL-UP BANNER
-- ══════════════════════════════════════════════════════════════════════════════
LevelUpEvent.OnClientEvent:Connect(function(info)
	local banner = make("Frame", {
		Size                   = UDim2.new(1, 0, 0, 64),
		AnchorPoint            = Vector2.new(0.5, 0.5),
		Position               = UDim2.new(0.5, 0, 0.35, 0),
		BackgroundColor3       = Color3.fromRGB(80, 200, 120),
		BackgroundTransparency = 0.15,
		BorderSizePixel        = 0,
		ZIndex                 = 25,
	}, gui)
	make("TextLabel", {
		Size                   = UDim2.new(1, 0, 1, 0),
		BackgroundTransparency = 1,
		Text                   = "LEVEL UP!   LVL " .. info.newLevel,
		TextColor3             = Color3.new(1, 1, 1),
		Font                   = Enum.Font.GothamBold,
		TextSize               = 30,
		ZIndex                 = 26,
	}, banner)
	task.delay(0.1, function()
		TweenService:Create(banner, TweenInfo.new(1.6, Enum.EasingStyle.Quad), { BackgroundTransparency = 1 }):Play()
	end)
	task.delay(1.8, function()
		local lbl = banner:FindFirstChildWhichIsA("TextLabel")
		if lbl then TweenService:Create(lbl, TweenInfo.new(0.3), { TextTransparency = 1 }):Play() end
	end)
	task.delay(2.3, function() banner:Destroy() end)
end)

-- ══════════════════════════════════════════════════════════════════════════════
-- QUEST TRACKER  (top-right)
-- ══════════════════════════════════════════════════════════════════════════════
local questPanel = make("Frame", {
	Name                   = "QuestPanel",
	Size                   = UDim2.new(0, 260, 0, 0),
	AnchorPoint            = Vector2.new(1, 0),
	Position               = UDim2.new(1, -14, 0, 14),
	BackgroundTransparency = 1,
	ZIndex                 = 5,
}, gui)
make("UIListLayout", {
	FillDirection = Enum.FillDirection.Vertical,
	SortOrder     = Enum.SortOrder.LayoutOrder,
	Padding       = UDim.new(0, 6),
}, questPanel)

local questRows = {}
for i, quest in ipairs(GameConfig.QUESTS) do
	local row = make("Frame", {
		Name                   = quest.id,
		Size                   = UDim2.new(1, 0, 0, 50),
		BackgroundColor3       = Color3.fromRGB(20, 20, 40),
		BackgroundTransparency = 0.3,
		BorderSizePixel        = 0,
		LayoutOrder            = i,
		ZIndex                 = 5,
	}, questPanel)
	make("UICorner", { CornerRadius = UDim.new(0, 8) }, row)

	make("TextLabel", {
		Size                   = UDim2.new(1, -12, 0, 18),
		Position               = UDim2.new(0, 10, 0, 5),
		BackgroundTransparency = 1,
		Text                   = quest.name,
		TextColor3             = Color3.new(1, 1, 1),
		Font                   = Enum.Font.GothamBold,
		TextSize               = 13,
		TextXAlignment         = Enum.TextXAlignment.Left,
		ZIndex                 = 6,
	}, row)

	local progressText = make("TextLabel", {
		Size                   = UDim2.new(1, -12, 0, 14),
		Position               = UDim2.new(0, 10, 0, 24),
		BackgroundTransparency = 1,
		Text                   = "0 / " .. quest.target,
		TextColor3             = Color3.fromRGB(180, 180, 180),
		Font                   = Enum.Font.Gotham,
		TextSize               = 12,
		TextXAlignment         = Enum.TextXAlignment.Left,
		ZIndex                 = 6,
	}, row)

	local pbBg = make("Frame", {
		Size             = UDim2.new(1, -12, 0, 5),
		Position         = UDim2.new(0, 10, 0, 40),
		BackgroundColor3 = Color3.fromRGB(50, 50, 80),
		BorderSizePixel  = 0,
		ZIndex           = 6,
	}, row)
	make("UICorner", { CornerRadius = UDim.new(0, 3) }, pbBg)

	local pbFill = make("Frame", {
		Size             = UDim2.new(0, 0, 1, 0),
		BackgroundColor3 = Color3.fromRGB(80, 200, 120),
		BorderSizePixel  = 0,
		ZIndex           = 7,
	}, pbBg)
	make("UICorner", { CornerRadius = UDim.new(0, 3) }, pbFill)

	questRows[quest.id] = { row = row, progressText = progressText, pbFill = pbFill }
end

QuestProgress.OnClientEvent:Connect(function(info)
	local e = questRows[info.questId]
	if not e then return end
	e.progressText.Text = info.current .. " / " .. info.target
	TweenService:Create(e.pbFill, TweenInfo.new(0.3), {
		Size = UDim2.new(math.clamp(info.current / info.target, 0, 1), 0, 1, 0)
	}):Play()
end)

QuestCompleted.OnClientEvent:Connect(function(info)
	local e = questRows[info.questId]
	if not e then return end
	e.progressText.Text = "COMPLETED!"
	e.progressText.TextColor3 = Color3.fromRGB(80, 200, 120)
	TweenService:Create(e.pbFill, TweenInfo.new(0.3), {
		Size = UDim2.new(1, 0, 1, 0),
		BackgroundColor3 = Color3.fromRGB(80, 200, 120),
	}):Play()
	showXPPopup(info.xpReward, "QUEST: " .. info.name)
	task.delay(3, function()
		TweenService:Create(e.row, TweenInfo.new(0.6), { BackgroundTransparency = 1 }):Play()
		task.delay(0.7, function() e.row:Destroy() end)
	end)
end)

-- ══════════════════════════════════════════════════════════════════════════════
-- KILL FEED  (top-left)
-- ══════════════════════════════════════════════════════════════════════════════
local killFeed = make("Frame", {
	Size                   = UDim2.new(0, 240, 0, 180),
	Position               = UDim2.new(0, 14, 0, 14),
	BackgroundTransparency = 1,
	ZIndex                 = 5,
}, gui)
make("UIListLayout", {
	FillDirection     = Enum.FillDirection.Vertical,
	VerticalAlignment = Enum.VerticalAlignment.Top,
	SortOrder         = Enum.SortOrder.LayoutOrder,
	Padding           = UDim.new(0, 4),
}, killFeed)

local feedEntries = {}
local feedOrder   = 0

local function addFeedEntry(text)
	feedOrder += 1
	local lbl = make("TextLabel", {
		Size                   = UDim2.new(1, 0, 0, 28),
		BackgroundColor3       = Color3.fromRGB(0, 0, 0),
		BackgroundTransparency = 0.5,
		Text                   = text,
		TextColor3             = Color3.new(1, 1, 1),
		Font                   = Enum.Font.GothamBold,
		TextSize               = 13,
		TextXAlignment         = Enum.TextXAlignment.Left,
		BorderSizePixel        = 0,
		LayoutOrder            = feedOrder,
		ZIndex                 = 6,
	}, killFeed)
	make("UICorner", { CornerRadius = UDim.new(0, 4) }, lbl)
	make("UIPadding", { PaddingLeft = UDim.new(0, 6) }, lbl)
	table.insert(feedEntries, lbl)
	if #feedEntries > 5 then table.remove(feedEntries, 1):Destroy() end
	task.delay(4, function()
		if lbl and lbl.Parent then
			TweenService:Create(lbl, TweenInfo.new(0.5), {
				TextTransparency = 1, BackgroundTransparency = 1,
			}):Play()
			task.delay(0.6, function() if lbl and lbl.Parent then lbl:Destroy() end end)
		end
	end)
end

XPAwarded.OnClientEvent:Connect(function(info)
	if info.amount and info.amount > 0 and info.label and info.label ~= "" then
		if info.label == "HEADSHOT!" then
			addFeedEntry("Headshot! +" .. info.amount .. " XP")
		elseif info.label == "Elimination" then
			addFeedEntry("Elimination! +" .. info.amount .. " XP")
		end
	end
end)

print("[HUD] Loaded.")
