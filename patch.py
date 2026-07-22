import sys
content = open('src/App.tsx').read()
old_str = open('current_cards.tsx').read()
new_str = open('new_cards.tsx').read()
if old_str in content:
    open('src/App.tsx', 'w').write(content.replace(old_str, new_str))
    print('Success')
else:
    print('Failed to find old string')
