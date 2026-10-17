This first baseline is retained, including its failing result and the exact script used.

The immediate-action observation is valid: native Chromium dispatched a secondary `pointerdown` (`isPrimary=false`) on DISPARAR while the pilot remained held, and the legacy build emitted zero shots. Holding also emitted zero shots before release.

The contact-release helper was wrong: CDP `touchEnd` lists the contacts ending, not the contacts remaining. Consequently the release and subsequent ownership assertions from this run do not establish game defects. The corrected helper is rerun in `touch-baseline-02`. Do not use this run as an approval certificate or attribute its release failures to the game.
