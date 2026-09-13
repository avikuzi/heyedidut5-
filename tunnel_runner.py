import subprocess
import time
import re
import sys

while True:
    print("\n[Tunnel Runner] Connecting to localhost.run...")
    cmd = [
        'ssh',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'ServerAliveInterval=15',
        '-o', 'ServerAliveCountMax=3',
        '-R', '80:127.0.0.1:3000',
        'nokey@localhost.run'
    ]
    try:
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='ignore')
        for line in p.stdout:
            sys.stdout.write(line)
            sys.stdout.flush()
            if '.lhr.life' in line:
                match = re.search(r'(https://[a-zA-Z0-9-]+\.lhr\.life)', line)
                if match:
                    url = match.group(1)
                    print(f"\n==========================================")
                    print(f"ACTIVE PUBLIC URL: {url}")
                    print(f"==========================================\n")
                    with open('public_url.txt', 'w', encoding='utf-8') as f:
                        f.write(url)
        p.wait()
    except Exception as e:
        print("Tunnel process error:", e)
        
    print("[Tunnel Runner] Connection closed. Reconnecting in 3 seconds...")
    time.sleep(3)
