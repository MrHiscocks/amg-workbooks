# Unit 5 staff dashboard

## Open the dashboard

Use the [Unit 5 Pages link](https://mrhiscocks.github.io/amg-workbooks/unit-5-progress/) for both schools. Find the passphrases in **Dashboard passphrases and backup import** in your separate private updater. Give each school its own passphrase and keep the course-lead passphrase private.

The course lead can filter across AMG, Maesteg and CCYD. A school passphrase opens only that school’s learner records. Staff can search, filter by progress, choose a focus list for a session and open individual reports.

## Update progress and marks

1. Open **Unit 5 Private Updater – Combined** locally. Pick a school and learner and edit their assignment progress or the **Provisional NEA marks** section. Use **Save learner** before switching.
2. Marks use the nine sections in WJEC’s Unit 5 assessment grid. The updater validates each maximum and shows a subtotal against the sections entered. A blank mark stays blank and zero counts as entered.
3. Marks are visible in the course-lead view. To include them in the school staff views, select **Include provisional marks in school staff views** before publishing. Each school then receives only its own learners’ marks.
4. Select **Download progress.json**. In GitHub, open [the current progress.json](https://github.com/MrHiscocks/amg-workbooks/blob/main/unit-5-progress/progress.json), select the pencil icon and replace the full contents with the downloaded file. Commit the change to `main`. Staff can use **Refresh progress** on the same link after GitHub Pages finishes deploying.

Keep a private backup of your changes. If you edited the previous version, import its private backup first to bring across the latest progress and school passphrases. The new updater’s initial records come from the 25 November 2026 snapshot. Provisional marks start blank.

## Private files

Only the ZIP contents belong on GitHub. The separate updater and private backups contain learner information and passphrases. Keep them in an approved location. The published learner data is encrypted, and the passphrases stay in the visitor’s browser. Use GitHub Pages for these encrypted records only if your school permits it. A shared passphrase can be forwarded. People who have retained an older file and passphrase can still decrypt that copy.

[GitHub Pages publishing setup](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [WJEC Unit 5 assessment grids, Appendix B](https://www.wjec.co.uk/media/wl4kj5l1/wjec-gce-computer-science-spec-from-2015.pdf)
