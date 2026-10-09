from pathlib import Path
size=sum(p.stat().st_size for p in Path('dist').rglob('*') if p.is_file())
print(f'Pages deployment: {size:,} bytes ({size/1_000_000:.1f} MB)')
if size>=950_000_000:raise SystemExit('Site is too close to the 1 GB Pages limit. Use external asset delivery.')
