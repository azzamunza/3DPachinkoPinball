# Pachinko Machine Redesign Prompt

## Date: 2025-11-29

## Tasks:
1. Change the whole design layout of the machine to look like this:
https://github.com/azzamunza/3DPachinkoPinball/blob/main/references/Gemini_Generated_Image_tyo0gwtyo0gwtyo0.png

The image depicts a modern, vertical (stand-up) Pachinko machine that expertly blends traditional Pachinko elements with the aesthetics and features of a modern Pinball machine, enhanced by vibrant LED lighting.

### 1. Overall Structure and Orientation
- **Orientation**: The machine is correctly oriented vertically (portrait), suitable for a stand-up arcade or parlour machine. The playfield is viewed directly front-on.
- **Header**: The name "PACHINKO" is prominently displayed across the top of the playfield frame in a stylised, modern, metallic font, illuminated by brilliant neon/LED lighting.
- **Frame**: The main frame of the machine is a sleek, brushed metallic silver, giving it a premium, futuristic feel. The edges are accented with bright, multi-colored (primarily blue, magenta, and cyan) LED backlighting, which is a key aesthetic element of modern machines.

### 2. The Playfield (The Pin Layout)
- **Background/Theme**: The playfield surface is a wooden texture accented by darker, deep blue/purple graphics that suggest a cosmic or deep space theme, contributing to the visual appeal.
- **Pins/Pegs**: The small, standard Pachinko-sized silver pins (pegs) are dense and clearly visible across the entire central area of the playfield, creating the classic ball-bouncing maze.
- **Absence of Wedges**: The angled side wedges typically found in a Pinball machine's lower playfield have been removed, creating a wider, more open Pachinko-style area leading to the ball-catching/payout mechanisms at the bottom.
- **Ball Rails and Targets**: Pinball-style ball rails and illuminated targets are integrated into the design, offering defined paths and scoring opportunities. These targets are shaped like stylised geometric icons, glowing with neon colours.
- **Coin Slot Entry (Top)**: Centred at the very top of the machine, above the "PACHINKO" logo area, there is a small, circular hole/divot representing the ball entry/coin slot as requested.

### 3. Central Feature (The Digital Slot Machine)
- **Integration**: Centred within the main playfield is the modern digital video slot machine display. This display screen is clearly integrated into the machine, not just the background.
- **Design**: The screen is rectangular and displays a vivid, modern three-reel slot interface with digital video reels rather than traditional mechanical reels. The symbols, text (e.g., "BAR," "777," "JACKPOT"), and lighting are crisp and dynamic, consistent with modern casino-style slots.
- **Funnels**: A curved row of pachinko pins/pegs funnels the balls downward towards the area around the central slot machine, making it the primary target for triggering an event or payout.

### 4. Payout/Catchment Area
- **Bottom Area**: The bottom of the playfield features the catchment areas where balls are collected, leading to potential payouts. These areas are illuminated and designed to resemble typical Pachinko ball trays or catchers, rather than just the drain and flippers of a standard Pinball game.

## Other Tasks:

### A. USE my GitHub Jackpot slot Machine from here: ./JackpotMachine/index.html. Adjust it to accept balls following the current gameplay requirements to trigger the game.

### B. The Mortar Cannon is not aiming correctly. Adjust as follows:
- **B.1** Centre the Mortar Canon below the two Pinball flippers.
- **B.2** Show a red target dot at the location the mortar cannon is pointed at.
- **B.3** The mortar cannon should rotate on a gimbal around its axis. Rotation left and right, and pivot up and down. The target dots' position should be determined by the position of the mortar cannon with a ray cast towards the x,y position of the mouse projected back onto the game surface.
- **B.4** There is a collision issue with the balls. Balls should not pass through any surface. The game area is a fully contained space. The mortar cannon is shooting from inside the play area. The play area can be referred to as having height, length, and depth. A 3D space. The Mortar cannon shoots balls into the very top section of the game, where they land in areas that have rails that direct the balls into various different directions, where they fall back into the Pachinko board and encounter the Pachinko pins.
