// SPDX-License-Identifier: MIT

import { workspace } from 'vscode';
import * as assert from 'assert';
import * as config from '../../config';

interface Selector {
    language: string;
    scheme: string;
}

config.init();

suite('config test suite', () => {
    test('name', () => {
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

    test('activate and deactivate', async () => {
        const cfg = workspace.getConfiguration();
        let opt = cfg.get<Option>('editor.quickSuggestions');
        const comments = opt!.comments;

        await config.activate();
        opt = cfg.get<Option>('editor.quickSuggestions');
        assert.ok(opt!.comments);

        await config.deactivate();
        opt = cfg.get<Option>('editor.quickSuggestions');
        assert.equal(opt!.comments, comments);
    });
});

interface Option {
    comments?: boolean;
}
