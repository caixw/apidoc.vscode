// SPDX-License-Identifier: MIT

import * as assert from 'assert';
import * as config from '../../config';

interface Selector {
    language: string;
    scheme: string;
}

suite('config test suite', () => {
    test('name', ()=>{
        assert.equal(config.name, 'apidoc');
    });

    test('document selector', () => {
        const selector = config.documentSelector();

        assert.ok(selector.length > 0);

        for (const item of selector) {
            const s = <Selector>item;
            assert.equal(s.scheme, 'file');
            assert.ok(s.language.length > 0);
        }
    });
});
