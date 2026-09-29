"""CI entrypoint for both v4 homes and all seven actual product pages.

The shared suite checks each active player: manual home reels, the dedicated
Japanese Noa film, and the retained product story/recording players. Real playback,
failed-resource retry, source links and no-JavaScript access remain required.
"""
from verify_showcase import main

if __name__ == '__main__':
    main(output='film-qa/products')
