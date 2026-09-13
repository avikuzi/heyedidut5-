import subprocess
import os
import tempfile
import sys
import re

temp_dir = tempfile.gettempdir()
exe_path = os.path.join(temp_dir, 'cloudflared.exe')

if not os.path.exists(exe_path):
    print("cloudflared.exe not found at", exe_path)
    sys.exit(1)

print("[Cloudflare Tunnel] Starting HTTP2 TCP tunnel for http://127.0.0.1:3000 ...")
cmd = [exe_path, 'tunnel', '--protocol', 'http2', '--edge-ip-version', '4', '--url', 'http://127.0.0.1:3000']

p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='ignore')

for line in p.stdout:
    sys.stdout.write(line)
    sys.stdout.flush()
    if 'trycloudflare.com' in line:
        match = re.search(r'(https://[a-zA-Z0-9-]+\.trycloudflare\.com)', line)
        if match:
            url = match.group(1)
            print(f"\n==========================================")
            print(f"STABLE HTTP2 CLOUDFLARE URL: {url}")
            print(f"==========================================\n")
            with open('public_url.txt', 'w', encoding='utf-8') as f:
                f.write(url)

p.wait()
