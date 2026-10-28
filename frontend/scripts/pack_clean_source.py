"""Pack clean source code for Engine and Frontend into a minimal zip file.
Excludes node_modules, virtualenvs, cache, build artifacts, databases, and heavy test result dumps.
"""
import os
import sys
import subprocess
import zipfile
import time

def pack_source(output_path='aiva_project_v5.11.0_source.zip'):
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    if not os.path.exists(os.path.join(repo_root, 'engine')) or not os.path.exists(os.path.join(repo_root, 'frontend')):
        # If run from frontend root
        repo_root = os.path.abspath(os.path.join(os.getcwd(), '..'))

    git_files = subprocess.check_output(['git', 'ls-files'], cwd=repo_root).decode('utf-8').splitlines()
    untracked_out = subprocess.check_output(['git', 'status', '--porcelain', '-u'], cwd=repo_root).decode('utf-8').splitlines()
    untracked = [line[3:].strip().replace('\\', '/') for line in untracked_out if line.startswith('?? ')]

    all_candidates = set(git_files + untracked)

    exclude_dirs = {
        'node_modules', '.venv', 'venv', 'env', 'ENV',
        'dist', 'dist-ssr', '.next', 'build',
        '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache',
        '.cache', 'cache',
        'bbox_testing', 'sandbox_data', 'results',
        'backups', '.git', '.worktrees',
        'mockup', 'reference', '.agent', '.pi'
    }

    exclude_exts = {
        '.zip', '.7z', '.tar', '.gz', '.rar',
        '.pyc', '.pyo', '.pyd',
        '.db', '.db-journal', '.sqlite', '.sqlite3',
        '.log', '.tmp', '.tsbuildinfo'
    }

    fixture_keep = {
        'frontend/temp/paperless_invoices_v5/DMS-27_result.json',
        'frontend/temp/paperless_invoices_v5/DMS-35_result.json',
        'frontend/temp/paperless_invoices_v5/DMS-40_result.json',
        'frontend/temp/paperless_invoices_v5/DMS-95_result.json',
        'frontend/temp/paperless_invoices_v5/DMS-100_result.json',
        'frontend/temp/paperless_invoices_v5/DMS-123_result.json',
    }

    def should_include(rel_path):
        parts = rel_path.replace('\\', '/').split('/')
        for p in parts[:-1]:
            if p in exclude_dirs:
                return False
        fname = parts[-1]
        _, ext = os.path.splitext(fname)
        if ext.lower() in exclude_exts:
            return False
        if fname in {'.env', 'temp.xlsx', 'aiva_frontend_v5.10.7_source.xlsx', 'aiva_v5.11.0.patch'}:
            return False
        if parts[0] == 'engine' and len(parts) > 1 and parts[1] == 'temp':
            return False
        if parts[0] == 'frontend' and len(parts) > 1 and parts[1] == 'temp':
            if len(parts) > 2 and parts[2] == 'schemas':
                return True
            if rel_path in fixture_keep:
                return True
            return False
        if len(parts) > 3 and parts[0] == 'engine' and parts[1] == 'tools' and parts[2] == 'n8n_port':
            if parts[3] in {'live', 'fixtures'}:
                return False
        return True

    included = []
    for f in sorted(all_candidates):
        if should_include(f):
            real_p = os.path.join(repo_root, f)
            if os.path.isfile(real_p):
                included.append(f)

    if os.path.exists(output_path):
        os.remove(output_path)

    start_time = time.time()
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in included:
            real_p = os.path.join(repo_root, f)
            z.write(real_p, f)

    elapsed = time.time() - start_time
    sz_bytes = os.path.getsize(output_path)
    sz_mb = sz_bytes / (1024 * 1024)
    print(f'Archive created: {output_path}')
    print(f'Files packed: {len(included)}')
    print(f'Size: {sz_mb:.2f} MB ({sz_bytes:,} bytes)')
    print(f'Time: {elapsed:.2f}s')

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'aiva_project_v5.11.0_source.zip'
    pack_source(out)
