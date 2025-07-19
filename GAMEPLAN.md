Game Plan: Power Siphon

High Concept: A top-down, automatic-attacking survival game where you don't find new weapons by levelling up, but by forcefully siphoning them from special elite enemies. Think Vampire Survivors meets Kirby.

1. Core Gameplay Loop

    Survive: The player moves around the screen, automatically using their currently equipped power.

    Swarm: Hordes of weak "fodder" enemies constantly spawn and move toward the player.

    Identify: Periodically, a visually distinct Elite enemy spawns, carrying a specific power.

    Siphon: The player must get close to the Elite and perform a "siphon" action (e.g., hold down a key for 1.5 seconds). This is a high-risk, high-reward moment.

    Empower: Upon a successful siphon, the Elite is destroyed, and the player's old power is replaced with the new one.

    Escalate: The player uses their new, powerful ability to clear the screen more effectively.

    Level Up: Killing any enemy drops XP gems. Collecting these fills a bar, and levelling up offers passive stat boosts (not new powers).

    Repeat: Survive as long as possible against increasingly difficult waves.

2. Key Mechanics (Jam-Scope)

    Player Character:

        Movement: Standard 8-directional movement.

        Power Slot: Can only hold one active power at a time. This is the core design constraint that forces strategic choices.

        Siphon Ability: A short-range, channeled ability. While siphoning, the player might be rooted in place or slowed, creating a moment of vulnerability. It should have a short cooldown (e.g., 5 seconds) to prevent spamming.

    Enemies:

        Fodder (Thralls): Simple, weak enemies (e.g., gray circles). Move directly at the player. Their only purpose is to provide pressure and drop XP.

        Elites (Power Bearers): The most important enemy type. They should be visually distinct (e.g., brightly colored, different shapes). They move slower and have more health. Each color/shape corresponds to a specific power.

3. Example Powers (Easy to Implement)

When you siphon an Elite, you get their power. These powers attack automatically on a timer.

    Elite: Red Triangle → Power: Homing Spirit

        Effect: Every 2 seconds, fire a slow-moving projectile that seeks the nearest enemy.

        Implementation: Instantiate a projectile that adjusts its velocity towards the closest enemy's position in its Update() loop.

    Elite: Blue Square → Power: Revolving Scythes

        Effect: Two scythes constantly orbit the player, damaging any enemy they touch.

        Implementation: Create two "scythe" objects and parent them to the player. In the Update() loop, simply rotate the parent object.

    Elite: Yellow Star → Power: Chain Lightning

        Effect: Every 3 seconds, a bolt of lightning arcs from the player to the nearest enemy, then jumps to 2 more nearby enemies.

        Implementation: Find the nearest enemy, draw a line/effect, then from that enemy find the next nearest (that isn't the player), and so on.

4. Progression System (The Vampire Survivors Part)

    Experience (XP): Fodder and Elites drop XP gems on death.

    Level Up: When the XP bar is full, the game pauses and offers the player a choice of 3 random passive upgrades.

    Passive Upgrades (Examples):

        +15% Movement Speed

        -10% Power Cooldown (attacks happen faster)

        +20% Max Health

        +25% Pickup Radius (for XP gems)

        +10% Power Damage

This system keeps progression happening even when you're sticking with a power you like.

5. Jam Implementation Plan (MVP)

    Day 1 (Morning): The Basics

        Create the player character (a circle) that moves.

        Create a spawner that spawns basic "Fodder" enemies (squares) that move towards the player.

        Implement basic health and a "Game Over" screen.

    Day 1 (Afternoon): The Core Mechanic

        Create one Elite enemy type (e.g., a Red Triangle).

        Implement the Siphon action (e.g., hold 'Space' when near the Elite).

        On a successful siphon, grant the player one hard-coded power (e.g., the Homing Spirit). This is the most critical step. If this works, the game works.

    Day 2 (Morning): Add Variety

        Implement the other 2-3 Elite types and their corresponding powers.

        Create the system where siphoning a new power replaces the old one.

        Implement the XP/Level Up system with 3-4 passive upgrades.

    Day 2 (Afternoon): Polish

        Add a simple UI (Health bar, XP bar, timer).

        Add basic sounds using bfxr or sfxr.

        Create a simple start menu.

        Balance the game: tweak spawn rates, enemy health, and upgrade percentages.

This plan focuses on getting a playable loop functional as quickly as possible, then layering complexity on top. Good luck!
