import json, urllib.request, os

html_path = r'c:\Users\Rishikesh\OneDrive\Desktop\artha\SmartPark_Standalone.html'
content = open(html_path, encoding='utf-8').read()

payload = json.dumps({
    "description": "SmartPark AI - Intelligent Parking System",
    "public": True,
    "files": {
        "SmartPark_Standalone.html": {"content": content}
    }
}).encode('utf-8')

req = urllib.request.Request(
    'https://api.github.com/gists',
    data=payload,
    headers={
        'Content-Type': 'application/json',
        'User-Agent': 'SmartPark'
    },
    method='POST'
)

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())
    gist_url = data['html_url']
    raw_url  = data['files']['SmartPark_Standalone.html']['raw_url']
    print('Gist URL:', gist_url)
    print('Raw URL:', raw_url)
    # htmlpreview lets you render raw HTML files
    print('Preview:', 'https://htmlpreview.github.io/?' + raw_url)
