import json
from pathlib import Path

from assistant.parser import parse_message


def main():
    cases = json.loads(Path(__file__).with_name('test_messages.json').read_text(encoding='utf-8'))
    matched_fields = 0
    total_fields = 0
    fully_correct = 0
    for case in cases:
        actual = parse_message(case['message'])
        expected = case['expected']
        correct = all(actual.get(key) == value for key, value in expected.items())
        fully_correct += correct
        matched_fields += sum(actual.get(key) == value for key, value in expected.items())
        total_fields += len(expected)
    print(f'Messages: {len(cases)}')
    print(f'Exact message accuracy: {fully_correct}/{len(cases)} ({fully_correct / len(cases):.0%})')
    print(f'Field accuracy: {matched_fields}/{total_fields} ({matched_fields / total_fields:.0%})')


if __name__ == '__main__':
    main()
