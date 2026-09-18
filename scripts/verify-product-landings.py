"""Keep the existing CI entrypoint; validate the current product-led presentation.

The shared suite checks all 14 pages at three viewports, genuine native video
playback, six distinct measured visual treatments, keyboard operation,
no-JavaScript navigation and failed-media recovery. Packaged media integrity
and range responses remain covered by verify-packaged-films.py.
"""
from verify_showcase import main

if __name__ == '__main__':
    main(home_only=False, output='film-qa/product-landings')
