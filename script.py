import re
import os

file_path = 'src/translations/index.ts'
if not os.path.exists(file_path):
    print("No index.ts found")
    exit(0)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'hi: {': 'एआई',
    'bn: {': 'এআই',
    'pa: {': 'ਏਆਈ',
    'ml: {': 'എഐ',
    'kn: {': 'ಎಐ'
}

sections = re.split(r'(hi: \{|bn: \{|pa: \{|ml: \{|kn: \{)', content)

new_content = sections[0]
current_repl = None

for i in range(1, len(sections)):
    part = sections[i]
    if part in replacements:
        current_repl = replacements[part]
        new_content += part
    elif current_repl:
        def replacer(match):
            return re.sub(r'\bAI\b', current_repl, match.group(0))
        new_part = re.sub(r'"([^"]*)"', replacer, part)
        new_content += new_part
    else:
        new_content += part

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Processed index.ts')
