#!/usr/bin/env python3
"""
parse-data.py — Parse emoji-spire TypeScript data files and output JSON.

Usage: python .claude/skills/generate-gdd/scripts/parse-data.py
Run from project root.

Output (stdout): JSON with cards, enemies, events, stats
"""

import re
import json
import sys
import os


# ---------------------------------------------------------------------------
# Low-level helpers
# ---------------------------------------------------------------------------

def extract_string(text, key):
    """Extract a single-quoted string value for the given TS object key."""
    match = re.search(rf"{re.escape(key)}:\s*'([^']+)'", text)
    return match.group(1) if match else None


def extract_int(text, key):
    """Extract an integer value for the given TS object key."""
    match = re.search(rf"{re.escape(key)}:\s*(\d+)", text)
    return int(match.group(1)) if match else None


def extract_blocks(text):
    """Return a list of top-level { ... } blocks found in text."""
    blocks = []
    depth = 0
    start = -1
    for i, ch in enumerate(text):
        if ch == '{':
            if depth == 0:
                start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start != -1:
                blocks.append(text[start:i + 1])
                start = -1
    return blocks


def find_array_content(content, array_name):
    """Return the inner content of `export const <array_name>... = [...]`."""
    match = re.search(rf"export const {re.escape(array_name)}[^=]*=\s*\[", content)
    if not match:
        return None
    i = match.end()
    depth = 1
    while i < len(content) and depth > 0:
        if content[i] == '[':
            depth += 1
        elif content[i] == ']':
            depth -= 1
        i += 1
    return content[match.end():i - 1]


def find_function_body(content, func_match):
    """Return the body { ... } of a function given its re.Match object."""
    # The opening { is the last char matched by the pattern
    brace_start = func_match.end() - 1
    depth = 0
    i = brace_start
    while i < len(content):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                break
        i += 1
    return content[brace_start:i + 1]


# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------

TYPE_MAP = {'attack': '공격', 'defense': '방어', 'skill': '스킬'}
INTENT_MAP = {'attack': '공격', 'defend': '방어', 'buff': '버프'}


def parse_cards(filepath):
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    array_content = find_array_content(content, 'ALL_CARDS')
    if array_content is None:
        return []

    cards = []
    for block in extract_blocks(array_content):
        name = extract_string(block, 'name')
        cost = extract_int(block, 'cost')
        type_match = re.search(r"type:\s*'(attack|defense|skill)'", block)
        card_type = type_match.group(1) if type_match else None
        description = extract_string(block, 'description')

        if name and cost is not None and card_type and description:
            cards.append({
                'name': name,
                'cost': cost,
                'type': TYPE_MAP[card_type],
                'description': description,
            })

    return cards


def parse_enemies(filepath):
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    # Only match exported factory functions that return a single Enemy
    func_pattern = re.compile(r'export function (create\w+)\(\):\s*Enemy\s*\{')
    enemies = []

    for func_match in func_pattern.finditer(content):
        func_body = find_function_body(content, func_match)

        # Extract the LAST return { ... } block (skips inner returns in arrow funcs)
        return_matches = list(re.finditer(r'return\s*\{', func_body))
        if not return_matches:
            continue
        return_match = return_matches[-1]

        ret_start = func_body.index('{', return_match.start())
        depth = 0
        j = ret_start
        while j < len(func_body):
            if func_body[j] == '{':
                depth += 1
            elif func_body[j] == '}':
                depth -= 1
                if depth == 0:
                    break
            j += 1
        return_block = func_body[ret_start:j + 1]

        name = extract_string(return_block, 'name')
        emoji_match = re.search(r"emoji:\s*'([^']+)'", return_block)
        emoji = emoji_match.group(1) if emoji_match else ''
        max_hp = extract_int(return_block, 'maxHp')

        if not name or max_hp is None:
            continue

        # Collect all intents in the function body
        intent_pattern = re.compile(
            r"intent:\s*\{\s*type:\s*'(\w+)'(?:,\s*value:\s*(\d+))?\s*\}"
        )
        actions = []
        for m in intent_pattern.finditer(func_body):
            intent_type = m.group(1)
            intent_value = int(m.group(2)) if m.group(2) else None
            label = INTENT_MAP.get(intent_type, intent_type)
            if intent_value is not None:
                label += f'({intent_value})'
            actions.append(label)

        # Classify role by HP thresholds
        if max_hp >= 100:
            role = '보스'
        elif max_hp >= 45:
            role = '엘리트'
        else:
            role = '일반'

        enemies.append({
            'name': name,
            'emoji': emoji,
            'hp': max_hp,
            'role': role,
            'actions': actions,
        })

    return enemies


def parse_events(filepath):
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    array_content = find_array_content(content, 'EVENTS')
    if array_content is None:
        return []

    events = []
    for block in extract_blocks(array_content):
        title = extract_string(block, 'title')
        if not title:
            continue

        # Find choices array content
        choices_match = re.search(r'choices:\s*\[', block)
        if not choices_match:
            continue

        ci = choices_match.end()
        depth = 1
        while ci < len(block) and depth > 0:
            if block[ci] == '[':
                depth += 1
            elif block[ci] == ']':
                depth -= 1
            ci += 1
        choices_content = block[choices_match.end():ci - 1]

        choices = []
        effects = []
        for choice_block in extract_blocks(choices_content):
            text = extract_string(choice_block, 'text')
            desc = extract_string(choice_block, 'description')
            if text:
                choices.append(text)
            if desc:
                effects.append(desc)

        events.append({
            'title': title,
            'choices': choices,
            'effects': effects,
            'choice_count': len(choices),
        })

    return events


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # Force UTF-8 output on Windows (avoids cp949 UnicodeEncodeError with emojis)
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    root = os.getcwd()
    paths = {
        'cards':   os.path.join(root, 'src', 'data', 'cards.ts'),
        'enemies': os.path.join(root, 'src', 'data', 'enemies.ts'),
        'events':  os.path.join(root, 'src', 'data', 'events.ts'),
    }

    for name, path in paths.items():
        if not os.path.exists(path):
            print(f"Error: {path} not found. Run from project root.", file=sys.stderr)
            sys.exit(1)

    cards   = parse_cards(paths['cards'])
    enemies = parse_enemies(paths['enemies'])
    events  = parse_events(paths['events'])

    # --- Summary statistics ---
    total_cards = len(cards)
    avg_cost = round(sum(c['cost'] for c in cards) / total_cards, 1) if total_cards else 0.0
    type_counts = {}
    for c in cards:
        type_counts[c['type']] = type_counts.get(c['type'], 0) + 1

    total_enemies = len(enemies)
    avg_hp = round(sum(e['hp'] for e in enemies) / total_enemies) if total_enemies else 0
    role_counts = {}
    for e in enemies:
        role_counts[e['role']] = role_counts.get(e['role'], 0) + 1

    total_events = len(events)
    total_choices = sum(e['choice_count'] for e in events)

    result = {
        'cards': cards,
        'enemies': enemies,
        'events': events,
        'stats': {
            'total_cards':    total_cards,
            'avg_cost':       avg_cost,
            'attack_cards':   type_counts.get('공격', 0),
            'defense_cards':  type_counts.get('방어', 0),
            'skill_cards':    type_counts.get('스킬', 0),
            'total_enemies':  total_enemies,
            'avg_hp':         avg_hp,
            'normal_enemies': role_counts.get('일반', 0),
            'elite_enemies':  role_counts.get('엘리트', 0),
            'boss_enemies':   role_counts.get('보스', 0),
            'total_events':   total_events,
            'total_choices':  total_choices,
        },
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
