
import zhconv
import os

files = [
    'styles.css'
]

for file in files:
    if os.path.exists(file):
        content = None
        current_enc = 'utf-8'
        for enc in ['utf-8', 'utf-16', 'utf-8-sig', 'cp950']:
            try:
                with open(file, 'r', encoding=enc) as f:
                    content = f.read()
                current_enc = enc
                break
            except UnicodeDecodeError:
                continue
                
        if content is not None:
            converted = zhconv.convert(content, 'zh-tw')
            if content != converted:
                with open(file, 'w', encoding=current_enc) as f:
                    f.write(converted)
                print(f'Converted {file} (using {current_enc})')
            else:
                print(f'No simplified characters found in {file}')
        else:
            print(f'Could not read {file}')

