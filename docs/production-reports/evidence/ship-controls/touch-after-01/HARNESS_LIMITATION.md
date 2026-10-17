This run is retained with exit 1, its exact harness and logs: 13/14 groups passed, including all seven TouchEvent capability-fixture groups. JavaScript, console and network errors were zero, and the tested package did not change.

The native profile's remaining failed assertion sampled a move before compositor delivery. The next recorded event shows that same move applied to the original pilot ID, with target changing as intended; ownership did not transfer. CDP acknowledgement does not guarantee the native event has already reached the document.

The corrected harness waits for the native TouchEvent delivery counter before sampling state. It does not alter controls, game clocks or other gameplay state. Its rerun is `touch-after-02`. This first run is not presented as a full approval.
