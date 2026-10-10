export const GameRules = {
  sholoGuti: {
    title: 'Sholo Guti (16 Beads)',
    description: 'Move 16 beads across a connected 37-point board.',
    rules: [
      'Red starts on the top crown and first two grid rows; blue starts on the bottom two rows and crown.',
      'Tap a piece to select it, then tap a highlighted empty node to move',
      'Move pieces to adjacent empty nodes along the board lines',
      'Jump over an adjacent opponent piece to capture it (must land in empty node)',
      'Continue the same turn to make another capture when available',
      'Win by capturing all 16 opponent beads or blocking all their moves',
    ],
  },
  dotsBoxes: {
    title: 'Dots & Boxes (7x7)',
    description: 'Territorial grid-connection game',
    rules: [
      '7x7 dots create a 6x6 grid of boxes (36 total)',
      'Tap any unselected edge to draw a line in your color',
      'Complete the 4th side of a box to claim it (+1 point)',
      'Claiming a box grants you an extra turn',
      'If no box is completed, turn switches to opponent',
      'Win by having the most completed boxes when all lines are filled',
    ],
  },
  sos: {
    title: 'SOS Game (10x10)',
    description: 'Strategic 8-directional letter alignment game',
    rules: [
      '10x10 grid of touchable tiles (100 cells total)',
      'Use the bottom bar to toggle placing "S" or "O"',
      'Tap an empty tile to place your chosen letter',
      'Form S-O-S sequences horizontally, vertically, or diagonally',
      'Each completed S-O-S awards +1 point and a bonus turn',
      'If no S-O-S is formed, turn switches to opponent',
      'Win by having the most S-O-S sequences when the grid is full',
    ],
  },
} as const;

export type GameType = keyof typeof GameRules;
