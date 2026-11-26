# Unit 5 staff dashboard

## Open the dashboard

Open the private access link for your school. The dashboard opens without a password prompt. Keep each link within its intended school and bookmark the original link so you can reopen it later. The [dashboard landing page](https://mrhiscocks.github.io/amg-workbooks/unit-5-progress/) directs staff to their private link.

The course-lead link opens all three schools. A school link opens only that school’s learner records. Staff can search, filter by progress, choose a focus list for a session and open individual reports.

The tracker uses five assignments. Earlier discussion work is covered by the 1.2 final Discussion and existing-system work is covered by the Investigation. Older backups are filtered to the same assignment list when imported.

## Update progress and marks

1. Open **Unit 5 Private Updater – Combined** locally. Pick a school and learner and edit their assignment progress or the **Provisional NEA marks** section. Use **Save learner** before switching.
2. Marks use the nine sections in WJEC’s Unit 5 assessment grid. The updater validates each maximum and shows a subtotal against the sections entered. A blank mark stays blank and zero counts as entered.
3. Marks are visible in the course-lead view. To include them in the school staff views, select **Include provisional marks in school staff views** before publishing. Each school then receives only its own learners’ marks.
4. Select **Download progress.json**. In GitHub, open [the current progress.json](https://github.com/MrHiscocks/amg-workbooks/blob/main/unit-5-progress/progress.json), select the pencil icon and replace the full contents with the downloaded file. Commit the change to `main`. Staff can use **Refresh progress** on the same link after GitHub Pages finishes deploying.

Keep a private backup of your changes. If you edited the previous version, import its private backup first to bring across the latest progress and school passphrases. The new updater’s initial records come from the 25 November 2026 snapshot. Provisional marks start blank.

## Private files

Only the public dashboard files belong on GitHub. Keep the private updater, backups and staff access links in an approved location. The published learner data is encrypted. Anyone with a private access link can open that view. Use GitHub Pages for these encrypted records only if your school permits it. People who have retained an older file and its credentials can still decrypt that copy.

Routine snapshot updates work with the existing private links. To replace a private link, publish a new encrypted link access file alongside the snapshot encrypted with the rotated updater credential. Share the replacement link with the affected school.

[GitHub Pages publishing setup](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [WJEC Unit 5 assessment grids, Appendix B](https://www.wjec.co.uk/media/wl4kj5l1/wjec-gce-computer-science-spec-from-2015.pdf)
