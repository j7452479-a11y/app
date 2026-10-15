<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep shared storefront chrome in StorePage and merchant navigation in DashboardShell so every frontend page uses the same design system.
- Keep sector catalog data in a single typed module and carry the template query parameter through sign-up into setup so selection is never lost.
- Merchant additions are frontend-only, using in-memory interaction state and explicitly simulated outcomes; do not imply external actions or account creation occurred without connected services.
