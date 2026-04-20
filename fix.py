
with open('script.js', 'r', encoding='utf-8') as f:
    d = f.read()
d = d.replace(r'[\''', '[\'')
d = d.replace(r'\']', '\']')
with open('script.js', 'w', encoding='utf-8') as f:
    f.write(d)

