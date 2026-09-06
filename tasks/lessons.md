# Lessons (revaudio-website)

Patterns from user corrections. Read at session start before website work.

## 2026-09-06 - never push until Dan says push clearly

The garage homepage pass went to origin/main as a noindex /garage preview before Dan had
reviewed it. Dan: "never push until i say to push clearly."

Rule: commit locally after each verified step; do NOT `git push` until Dan writes "push" in
plain words. Report "committed locally, not pushed". A preview route still deploys on push
(GitHub Pages) and lands on partner clones, so "noindex" is not a reason to push early.
The "rv close" ritual is Dan's explicit push instruction and still counts.
