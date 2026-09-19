"""Retained CI entrypoint for current product layouts and native recordings.

The active contract is data-media-state, not the retired data-user-intent.
Shared acceptance retains real playback, network failure/retry, source links,
UI-story controls and no-JavaScript access. Assertions are not optional.
"""
from verify_showcase import main

if __name__ == '__main__':
    main(output='film-qa/products')
