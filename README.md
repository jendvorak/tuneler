# Tuneler - Classic Tank Combat Game

A web-based recreation of the classic 90s split-screen tank combat game where two players compete against each other by digging tunnels and battling underground!

![Tuneler Game](https://img.shields.io/badge/Game-Tuneler-green)

## Features

- **Split-screen gameplay** - Two players share the same screen with independent viewports
- **Tunnel digging mechanics** - Dig through terrain to create paths and strategic positions
- **Physics-based movement** - Realistic gravity and momentum-based tank control
- **Resource management** - Manage fuel and ammunition wisely
- **Local multiplayer** - Play with a friend on the same keyboard
- **Retro aesthetic** - Classic green terminal-style graphics

## How to Play

### Starting the Game

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
2. Click the "START GAME" button
3. Battle your opponent!

### Controls

#### Player 1 (Green Tank)
- **W** - Thrust Up
- **S** - Thrust Down
- **A** - Thrust Left
- **D** - Thrust Right
- **SPACE** - Fire

#### Player 2 (Magenta Tank)
- **I** - Thrust Up
- **K** - Thrust Down
- **J** - Thrust Left
- **L** - Thrust Right
- **ENTER** - Fire

### Game Mechanics

#### Movement
- Use thrust controls to move your tank in any direction
- Movement consumes fuel
- Tanks are affected by gravity - you'll fall if not supported by terrain
- Momentum is realistic - you'll keep moving even after releasing controls

#### Fuel Management
- Each tank starts with 100 fuel
- Thrusting consumes fuel
- Fuel slowly regenerates when stationary
- Without fuel, you can't move!

#### Combat
- Each tank has 10 shots
- Aim is automatic - bullets target the opponent
- Bullets are affected by gravity
- Direct hits deal 25 damage
- Explosions dig terrain

#### Terrain
- Tanks automatically dig through terrain where they move
- Bullets create explosions that dig larger areas
- Use terrain strategically for cover and tactical advantage
- Procedurally generated with caves and varied topology

#### Winning
- Destroy the enemy tank to win
- Game ends when one tank's health reaches zero
- Press **R** to restart after game over

## Strategy Tips

1. **Conserve Fuel** - Don't thrust constantly, let gravity and momentum work for you
2. **Use Terrain** - Dig defensive positions and use terrain as cover
3. **Manage Ammo** - You only have 10 shots, make them count!
4. **Positioning** - Try to get above your opponent for gravity-assisted shots
5. **Evasion** - Keep moving to avoid incoming fire

## Technical Details

- Pure vanilla JavaScript, HTML5, and CSS3
- Canvas-based rendering
- 60 FPS game loop
- Particle effects system
- Split-screen viewports with independent camera tracking
- Responsive physics engine

## Running Locally

### Simple Method (File Protocol)
Just double-click `index.html` to open it in your browser.

### Local Web Server (Recommended)
For the best experience, run a local web server:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server

# PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Browser Compatibility

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ❌ Internet Explorer (not supported)

## Credits

Inspired by the classic DOS game "Tunneler" by Geoffrey Silverton (1991).

## License

This is a fan recreation for educational purposes. Feel free to modify and share!

## Changelog

### v1.0.0
- Initial release
- Split-screen multiplayer
- Full physics simulation
- Terrain generation and digging
- Combat system with bullets and explosions
- Resource management (fuel & ammo)
- HUD with health, fuel, and ammo displays
- Particle effects
- Game over and restart functionality

---

**Enjoy the game! May the best tank win!** 🎮
