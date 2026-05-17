import os

car  = r'c:\Users\Rishikesh\OneDrive\Desktop\CAR PARKING'
base = r'c:\Users\Rishikesh\OneDrive\Desktop\artha'

css  = open(os.path.join(car, 'style.css'),  encoding='utf-8').read()
js   = open(os.path.join(car, 'app.js'),     encoding='utf-8').read()
html = open(os.path.join(car, 'index.html'), encoding='utf-8').read()

html = html.replace(
    '<link rel="stylesheet" href="style.css" />',
    '<style>\n' + css + '\n</style>'
)
html = html.replace(
    '<script src="app.js"></script>',
    '<script>\n' + js + '\n</script>'
)

dest = os.path.join(base, 'SmartPark_Standalone.html')
open(dest, 'w', encoding='utf-8').write(html)
print('Written:', dest, '|', len(html), 'bytes')
