"""No browser, media renderer or extra Python packages needed for these regressions."""
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from product_film_contract import load_expected_product_ids, validate_directory, validate_manifest, validate_product_ids

PRODUCTS = ['genie', 'ai-meeting', 'oathra', 'aisecure', 'agent-team', 'launchloom', 'noa']


def manifest_for(ids=PRODUCTS):
    return {
        'schema': 3, 'mode': 'premium-site-edits', 'policy': {'speed': 1, 'audio': False},
        'recordings': [{'id': product, 'path': f'/media/products/{product}.mp4',
                        'poster': f'/media/products/{product}.jpg'} for product in ids],
    }


class ProductFilmContractTests(unittest.TestCase):
    def test_source_ledger_covers_all_seven_products_including_noa(self):
        self.assertCountEqual(load_expected_product_ids(ROOT), PRODUCTS)

    def test_source_loader_rejects_missing_duplicate_and_unknown_recordings(self):
        for ids in [PRODUCTS[:-1], PRODUCTS[:-1] + ['genie'], PRODUCTS[:-1] + ['unknown']]:
            payload = json.dumps({'products': PRODUCTS, 'recordings': ids})
            with self.subTest(ids=ids), patch('product_film_contract.subprocess.check_output', return_value=payload):
                with self.assertRaises(AssertionError):
                    load_expected_product_ids(ROOT)

    def test_current_manifest_passes(self):
        validate_manifest(manifest_for(), PRODUCTS)

    def test_expected_set_can_grow_without_changing_the_validator(self):
        products = PRODUCTS + ['future-product']
        validate_manifest(manifest_for(products), products)

    def test_manifest_cannot_omit_noa(self):
        with self.assertRaisesRegex(AssertionError, r"missing \['noa'\]"):
            validate_manifest(manifest_for(PRODUCTS[:-1]), PRODUCTS)

    def test_duplicate_cannot_mask_a_missing_product(self):
        with self.assertRaisesRegex(AssertionError, 'duplicate products'):
            validate_manifest(manifest_for(PRODUCTS[:-1] + ['genie']), PRODUCTS)

    def test_same_count_wrong_product_fails(self):
        with self.assertRaisesRegex(AssertionError, r"missing \['noa'\]; unexpected \['unknown'\]"):
            validate_manifest(manifest_for(PRODUCTS[:-1] + ['unknown']), PRODUCTS)

    def test_unexpected_extra_product_fails(self):
        with self.assertRaisesRegex(AssertionError, 'unexpected'):
            validate_manifest(manifest_for(PRODUCTS + ['unknown']), PRODUCTS)

    def test_stale_schema_and_changed_media_policy_fail(self):
        for field, value in [('schema', 2), ('mode', 'other'), ('speed', 2), ('audio', True)]:
            with self.subTest(field=field):
                manifest = manifest_for()
                target = manifest['policy'] if field in ['speed', 'audio'] else manifest
                target[field] = value
                with self.assertRaises(AssertionError):
                    validate_manifest(manifest, PRODUCTS)

    def test_wrong_media_and_poster_paths_fail(self):
        for field in ['path', 'poster']:
            with self.subTest(field=field):
                manifest = manifest_for()
                manifest['recordings'][-1][field] = manifest['recordings'][0][field]
                with self.assertRaisesRegex(AssertionError, 'noa: wrong'):
                    validate_manifest(manifest, PRODUCTS)

    def test_invalid_or_empty_expected_sets_fail_closed(self):
        for expected in [[], ['genie', 'genie'], ['../genie'], [None]]:
            with self.subTest(expected=expected), self.assertRaises(AssertionError):
                validate_product_ids(PRODUCTS, expected, 'fixture')

    def test_directory_checks_identity_not_just_count(self):
        page = Mock()
        for actual in [PRODUCTS, list(reversed(PRODUCTS))]:
            page.locator.return_value.evaluate_all.return_value = actual
            validate_directory(page, PRODUCTS, '/products/')
        for actual in [PRODUCTS[:-1], PRODUCTS[:-1] + ['genie'],
                       PRODUCTS[:-1] + ['unknown'], PRODUCTS + ['unknown'],
                       PRODUCTS[:-1] + [None]]:
            page.locator.return_value.evaluate_all.return_value = actual
            with self.subTest(actual=actual), self.assertRaises(AssertionError):
                validate_directory(page, PRODUCTS, '/en/products/')
        page.locator.assert_called_with('.rm-film')


if __name__ == '__main__':
    unittest.main()
