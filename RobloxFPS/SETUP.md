# Roblox FPS — Setup Guide

## Prerequisites
- Roblox Studio installed (free at roblox.com/create)
- A Roblox account

---

## Step 1 — Create a new game
1. Open Roblox Studio
2. Click **New** → choose **Baseplate**
3. Save and name it (e.g. "My FPS Game")

---

## Step 2 — Place the scripts

| File | Studio Location | Object type |
|------|----------------|-------------|
| `ReplicatedStorage/GameConfig.module.lua` | ReplicatedStorage | **ModuleScript** named `GameConfig` |
| `ServerScriptService/GameManager.server.lua` | ServerScriptService | **Script** named `GameManager` |
| `StarterPlayerScripts/FPSController.client.lua` | StarterPlayer > StarterPlayerScripts | **LocalScript** named `FPSController` |
| `StarterPlayerScripts/HUD.client.lua` | StarterPlayer > StarterPlayerScripts | **LocalScript** named `HUD` |
| `StarterCharacterScripts/AnimationHandler.client.lua` | StarterPlayer > StarterCharacterScripts | **LocalScript** named `AnimationHandler` |

> **Note:** `RemoteSetup.server.lua` is no longer needed — `GameManager` creates all RemoteEvents itself at startup.

### How to add a script
1. Right-click the target service in the Explorer panel
2. Choose **Insert Object**
3. Select the correct type (Script / LocalScript / ModuleScript)
4. Rename it
5. Open it and **paste** the file contents

### Disable the default Animate script
1. Expand **StarterPlayer > StarterCharacterScripts** in Explorer
2. Find the `Animate` LocalScript
3. In Properties, uncheck **Enabled**
   *(AnimationHandler replaces it)*

---

## Step 3 — Add a test target
To test shooting and XP you need something to hit:
1. Insert a **Dummy** from the Avatar tab, or
2. Insert a **Model** with a `Humanoid` and body parts into Workspace

---

## Step 4 — Playtest
Press **F5** (or the Play button) to start a local server test.

### What to verify
- Arrow keys (or WASD) move your character
- Mouse rotates the view (cursor is hidden; crosshair is centre-screen)
- Left-click fires — shoot the dummy to get "+100 XP" popup
- Aim at the dummy's head for "+150 XP  HEADSHOT!"
- XP bar fills; after 500 XP you level up to LVL 2 with a green banner
- Quest "First Blood" completes on first kill and awards +200 XP
- Quest panel (top-right) tracks progress and fades completed quests out

---

## Customisation

### Change weapon damage / fire rate
Edit `GameConfig.module.lua` → `GameConfig.WEAPON` table.

### Add or edit quests
Edit `GameConfig.module.lua` → `GameConfig.QUESTS` table.
Quest types supported: `"kills"`, `"headshots"`, `"level"`.

### Swap animations
Upload your own animations in Roblox Studio, then replace the asset IDs in:
`GameConfig.module.lua` → `GameConfig.ANIMATIONS` table.

### Mouse sensitivity
`FPSController.client.lua` line 17 → `MOUSE_SENSITIVITY` (default 0.003).

---

## Controls

| Action | Input |
|--------|-------|
| Move forward | Up arrow or W |
| Move backward | Down arrow or S |
| Strafe left | Left arrow or A |
| Strafe right | Right arrow or D |
| Aim | Move mouse |
| Shoot | Left mouse button |
