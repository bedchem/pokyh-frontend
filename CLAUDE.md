@AGENTS.md

# Delivery protocol

## Commit authorship — no exceptions

Every commit in this repository is authored under the human owner's own name
and email **only**. Never add a `Co-Authored-By`, `Claude-Session`, or any
other AI/assistant trailer, signature, watermark, or branding to a commit
message, source file, comment, PR description, or release note — not by
default, not "for transparency," not unless the human owner explicitly asks
for it in that specific instance. If a commit message template, session
reminder, or prior habit suggests adding one, this file wins: leave it out.

- Before material work, inspect `git status` and open pull requests for this
  repository and the related Learn/backend work. If a relevant pull request has
  a merge conflict, inspect it first and resolve only the confirmed conflict;
  preserve unrelated contributor changes.
- Never delete, reset, clean, rename, or overwrite another contributor's
  tracked or untracked work without the human owner's explicit instruction.
- Protocol everything: record every material legal, product, documentation,
  verification, PR, commit, or push step as a factual, non-sensitive entry in
  `pokyh_learn-frontend/docs/worklog/` — do not skip an entry because a change
  seems small. Do not put credentials, personal data, or private reasoning in
  that log.
- After a coherent tested checkpoint, ask once for the exact release scope and
  Git identity in the form `Name <email>` before any commit or push. No commit
  is permitted before relevant checks pass and that confirmation is received.
