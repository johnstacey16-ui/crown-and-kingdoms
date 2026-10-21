# Civilisation-specific castle production — 22 October 2026

Castles displayed each civilisation's unique unit and technology in solo menus,
but training and research accepted only the static building definition. Those
extra options could not be purchased. Multiplayer menus omitted them, and save
validation would reject a queue containing them.

The existing `trOf` and `rsOf` catalogue functions now serve production checks,
authenticated multiplayer menus/commands and save restoration. They accept an
explicit civilisation list so a loaded save is checked against its saved
kingdoms, independently of the current game. Existing base castle options are
preserved. Each castle gains only its owning civilisation's unique entries;
foreign units and technologies are rejected before payment.
Invalid saved civilisation lists are rejected before replacing the current
world; older saves without that field retain their existing default mapping.

Training still pays normal costs, reserves population, respects five-unit queue
limits and excludes simultaneous research. Cancellation refunds the queued
unit's normal price. Research retains age, prerequisite, duplicate, cost and
completion-effect checks. Network authentication, ownership and scheduled-frame
replay remain in force. Controller bindings are unchanged.

`tests/castle-civilization-production.test.mjs` exercises all 26 implemented
civilisations through paid training, cancellation/refund, research completion
and unit spawning. It checks foreign-entry rejection, unique production saves
including completed queues, restoration while a different civilisation is
currently active, invalid-save isolation and authenticated guest training,
cancellation and unique research through scheduled host frames.

Existing isolated production/research tests now supply the catalogue dependency;
their resource, population, exclusivity and shape checks remain in place. Source
assertions refer to the shared catalogue rather than requiring static-only
membership. The new tests use the full production game scripts.

This restores access to already implemented content. It does not establish
reference balance, complete civilisation restrictions, Xbox DLC coverage or
physical controller acceptance. No hosting or service configuration is changed.

## Recorded verification

Verified code: [a09a055](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/a09a055a359313be7be525de01d490f9150ed209).

- [Source and atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39696509431): passed.
- [Complete regression run](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39696509556): 164 standalone files, 19 campaign simulations and three seeded AI skirmishes passed.
- [Chromium graphics and responsive layouts](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39696509440): passed.
- Local runs passed 43 production/research checks, 20 save checks, and 77 controller/live-multiplayer/rendering checks (overlapping suites), plus the two corrected isolated fixture checks. All three seeded skirmishes also completed locally.

The full run exposed two additional isolated fixtures using the old static-only
membership assumption or missing a catalogue stub. Their precondition, resource,
HP-upgrade and completion assertions are retained and pass against the final code.
