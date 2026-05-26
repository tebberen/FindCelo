import os
import re

for root, dirs, files in os.walk('.'):
    if '.git' in dirs: dirs.remove('.git')
    if 'node_modules' in dirs: dirs.remove('node_modules')
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r') as f:
                    content = f.read()
                    matches = re.findall(r'https://farcaster\.xyz/miniapps/11ftF6b53u7y/findcelo.*', content)
                    for m in matches:
                        if 'ref' in m or 'address' in m or '${' in m:
                            print(f'MATCH in {path}: {m.strip()[:150]}')
            except: pass
