"""Homepage acceptance for the current product-led design.

A six-product, keyboard-operable selector intentionally replaces the previous
autoplay montage. Test that experience, including real frames, motion safety,
mobile navigation, failed-media recovery, and usable pages without JavaScript.
No production writes, network interception beyond controlled media failures,
or form submissions are performed.
"""
from verify_showcase import main

if __name__ == '__main__':
    main(home_only=True, output='film-qa/horio-premium')
