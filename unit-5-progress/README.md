# Unit 5 staff dashboard

## Open the dashboard

Share the same staff link with the staff who need access to Unit 5. It opens the full cohort without a password prompt. Staff can search, filter by school or progress, choose a focus list and open individual reports. The private updater contains a **Copy staff link** button.

The tracker uses five assignments. Earlier discussion work is covered by the 1.2 final Discussion and existing-system work is covered by the Investigation. Older backups are filtered to the same assignment list when imported.

## Update progress and marks

1. Open **Unit 5 Private Updater – Combined** locally. Pick a school and learner and edit their assignment progress or the **Provisional NEA marks** section. Use **Save learner** before switching.
2. Marks use the nine sections in WJEC’s Unit 5 assessment grid. The updater validates each maximum and shows a subtotal against the sections entered. A blank mark stays blank and zero counts as entered.
3. Provisional marks stay in the private updater by default. To include them in the shared dashboard, select **Include provisional marks in the shared dashboard** before publishing.
4. Select **Download progress.json**. In GitHub, open [the current progress.json](https://github.com/MrHiscocks/amg-workbooks/blob/main/unit-5-progress/progress.json), select the pencil icon and replace the full contents with the downloaded file. Commit the change to `main`. Staff can use **Refresh progress** on the same link after GitHub Pages finishes deploying.

Keep a private backup of your changes. Import an earlier backup to bring across the latest progress and provisional marks.

## Private files

Only the public dashboard files belong on GitHub. Keep the updater and backups private. Anyone who has the shared staff link can open the full cohort, so share it with staff authorised to view all learners. Routine updates to progress.json use the same link.

[GitHub Pages publishing setup](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [WJEC Unit 5 assessment grids, Appendix B](https://www.wjec.co.uk/media/wl4kj5l1/wjec-gce-computer-science-spec-from-2015.pdf)
