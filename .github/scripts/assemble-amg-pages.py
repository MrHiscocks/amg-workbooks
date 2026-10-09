"""Keep workbook URLs intact and add the built library at its requested URL."""
from pathlib import Path
import json
import os
import shutil
import sys

APP = Path('Y9/game-development/04_Game Forge/z_Asset Builder')
STAGE = Path('_pages_source')
SITE = Path('_site')


def stage(root):
    destination = root / STAGE
    if destination.exists():
        shutil.rmtree(destination)

    def ignore(directory, names):
        relative = Path(directory).relative_to(root)
        skip = {n for n in names if n in {'.git', '.github', '.DS_Store', 'node_modules', '__pycache__'}}
        if relative == Path('.'):
            skip.update(n for n in names if n in {str(STAGE), str(SITE)})
        skip.update(n for n in names if relative / n == APP)
        return skip

    shutil.copytree(root, destination, ignore=ignore)
    is_static = (root / '.nojekyll').exists()
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
            f.write(f'static={str(is_static).lower()}\n')
    print('Staged existing workbooks. Original Game Forge assets excluded from Pages.')


def assemble(root):
    site = root / SITE
    if (root / '.nojekyll').exists():
        if site.exists():
            shutil.rmtree(site)
        shutil.copytree(root / STAGE, site)
    if not site.is_dir():
        raise SystemExit('The existing workbook site has not been built. Deployment stopped.')
    built = root / APP / 'dist'
    if not (built / 'index.html').is_file():
        raise SystemExit('Game Forge build is missing. Deployment stopped.')
    catalogue = json.loads((built / 'catalogue.json').read_text())
    expected = ('https://raw.githubusercontent.com/' + os.environ['GITHUB_REPOSITORY'] +
                '/' + os.environ['GITHUB_SHA'] +
                '/Y9/game-development/04_Game%20Forge/z_Asset%20Builder/assets/')
    if not catalogue['assets']:
        raise SystemExit('Catalogue is empty. Deployment stopped.')
    for asset in catalogue['assets']:
        for file in [*asset['files'], asset['primary']]:
            if not file['url'].startswith(expected):
                raise SystemExit('An asset URL does not match the deployed commit and folder.')
    target = site / APP
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(built, target)
    if (target / 'downloads').exists() or (target / 'assets' / 'ground').exists():
        raise SystemExit('Original assets unexpectedly included in Pages. Deployment stopped.')
    # Existing HTML workbooks must still be present at the same relative paths.
    # Front-matter pages may intentionally use a Jekyll permalink instead.
    for source in (root / STAGE).rglob('*.html'):
        relative = source.relative_to(root / STAGE)
        if any(part.startswith(('.', '_')) for part in relative.parts):
            continue
        if source.read_bytes()[:3] != b'---' and not (site / relative).is_file():
            raise SystemExit(f'An existing HTML page is missing: {relative}')
    size = sum(p.stat().st_size for p in site.rglob('*') if p.is_file())
    if size >= 950_000_000:
        raise SystemExit(f'Combined site is {size:,} bytes: too close to the Pages limit.')
    print(f'Combined website: {size:,} bytes; {len(catalogue["assets"]):,} library concepts.')


if __name__ == '__main__':
    root = Path.cwd().resolve()
    if sys.argv[1:] == ['stage']:
        stage(root)
    elif sys.argv[1:] == ['assemble']:
        assemble(root)
    else:
        raise SystemExit('Use stage or assemble.')
