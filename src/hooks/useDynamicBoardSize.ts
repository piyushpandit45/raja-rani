import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BoardSizeResult {
  boardSize: number;
  boardHeight?: number; // For non-square boards
  screenWidth: number;
  screenHeight: number;
}

interface DynamicBoardSizeOptions {
  /**
   * Additional height to reserve at the top (e.g., for headers, scoreboard, banner)
   * Default: 156 (50 header + 70 scoreboard + 36 banner)
   */
  reservedTopHeight?: number;
  /**
   * Additional height to reserve at the bottom (e.g., for controls, buttons)
   * Default: 80
   */
  reservedBottomHeight?: number;
  /**
   * Horizontal padding on each side
   * Default: 16
   */
  horizontalPadding?: number;
  /**
   * Whether the board should be rectangular (aspect ratio > 1)
   * Default: 1 (square)
   */
  aspectRatio?: number;
  /**
   * Extra vertical padding to account for spacing between elements
   * Default: 24
   */
  verticalPadding?: number;
}

/**
 * Hook to calculate dynamic board size based on viewport dimensions.
 * Ensures the game board fits completely on screen without scrolling.
 *
 * @param options - Configuration for reserved space and board dimensions
 */
export function useDynamicBoardSize(options: DynamicBoardSizeOptions = {}): BoardSizeResult {
  const {
    reservedTopHeight = 156,
    reservedBottomHeight = 80,
    horizontalPadding = 16,
    aspectRatio = 1,
    verticalPadding = 24,
  } = options;

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const availableHeight =
    screenHeight -
    insets.top -
    insets.bottom -
    reservedTopHeight -
    reservedBottomHeight -
    verticalPadding;

  const availableWidth = screenWidth - horizontalPadding * 2;

  // Calculate board dimensions based on aspect ratio
  let boardSize: number;
  let boardHeight: number | undefined;

  if (aspectRatio > 1) {
    // Rectangular board (width is the limiting factor)
    boardSize = Math.floor(availableWidth);
    boardHeight = Math.floor(boardSize * aspectRatio);

    // If height exceeds available space, recalculate based on height
    if (boardHeight > availableHeight) {
      boardHeight = Math.floor(availableHeight);
      boardSize = Math.floor(boardHeight / aspectRatio);
    }
  } else {
    // Square board - fit to the smaller dimension
    boardSize = Math.floor(Math.min(availableWidth, availableHeight));
  }

  return {
    boardSize,
    boardHeight,
    screenWidth,
    screenHeight,
  };
}
