"""Fail-closed coverage checks shared by the film QA runner and its unit tests."""
from collections import Counter
import json
import re
import subprocess


def validate_product_ids(actual, expected, label):
    """Require each ledger product exactly once; equal counts alone are insufficient."""
    for name, ids in [('expected products', expected), (label, actual)]:
        assert ids and all(isinstance(value, str) and re.fullmatch(r'[a-z0-9-]+', value)
                           for value in ids), f'{name}: product IDs must be nonempty and valid'
        duplicates = sorted(value for value, count in Counter(ids).items() if count > 1)
        assert not duplicates, f'{name}: duplicate products {duplicates}'
    missing = sorted(set(expected) - set(actual))
    unexpected = sorted(set(actual) - set(expected))
    assert not missing and not unexpected, f'{label}: missing {missing}; unexpected {unexpected}'


def load_expected_product_ids(root):
    """Use the source ledger, never the generated manifest, as the coverage oracle."""
    source = """
import {products} from './src/products.mjs';
import {recordings} from './src/films.mjs';
console.log(JSON.stringify({products: products.map(({id}) => id), recordings: Object.keys(recordings)}));
"""
    ledger = json.loads(subprocess.check_output(
        ['node', '--input-type=module', '-e', source], cwd=root, text=True, timeout=30))
    validate_product_ids(ledger['recordings'], ledger['products'], 'source recordings')
    return ledger['products']


def validate_manifest(manifest, expected):
    assert manifest['schema'] == 3, f"Expected manifest schema 3, got {manifest['schema']!r}"
    assert manifest['mode'] == 'premium-site-edits', 'Expected premium-site-edits mode'
    assert manifest['policy']['speed'] == 1, 'Film playback speed must remain unchanged'
    assert manifest['policy']['audio'] is False, 'Website edits must remain silent'
    validate_product_ids([item['id'] for item in manifest['recordings']], expected, 'manifest recordings')
    for item in manifest['recordings']:
        product = item['id']
        assert item['path'] == f'/media/products/{product}.mp4', f'{product}: wrong film path'
        assert item['poster'] == f'/media/products/{product}.jpg', f'{product}: wrong poster path'


def validate_directory(page, expected, route):
    actual = page.locator('.rm-film').evaluate_all(
        '(films) => films.map(film => film.dataset.productFilm)')
    validate_product_ids(actual, expected, f'{route} film players')
