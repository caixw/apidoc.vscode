// SPDX-License-Identifier: MIT

import vscode from 'vscode';
import * as assert from 'assert';
import deepmerge from "deepmerge";
import * as config from '../../config';
import * as view from '../../view';
import { suite } from 'mocha';

config.init();

const outline = {
    workspaceFolder: {
        name: 'f1',
        uri: './f1/'
    },
    title: 'title',
    version: '1.1.1',
    location: {
        uri: './f1/file.go',
        range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(1, 1))
    },
    servers: [
        {
            id: 'admin',
            url: 'https://example.com/admin'
        }
    ],
    apis: [
        {
            location: {
                uri: './f1/file.go',
                range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(1, 1))
            },
            method: 'get',
            path: '/users',
            servers: new Array<string>()
        }
    ]
};

suite('FolderTreeItem test suite', () => {
    test('match', () => {
        const f = new view.FolderTreeItem({ name: 'f1', uri: vscode.Uri.file('./f1/') });
        const o = deepmerge({}, outline);

        assert.ok(f.fill(o));

        o.workspaceFolder.uri = './not-exists';
        assert.ok(!f.fill(o));
    });

    test('fill', () => {
        const f = new view.FolderTreeItem({ name: 'f1', uri: vscode.Uri.file('./f1/') });
        const o = deepmerge({}, outline);

        assert.ok(f.fill(o));
        assert.strictEqual(f.servers[0].apis.length, 0);
        assert.strictEqual(f.apis.length, 1);
        assert.strictEqual(f.servers.length, 1);

        // 将 api 从全局移至 servers[admin]
        o.apis[0].servers!.push('admin');
        assert.ok(f.fill(o));
        assert.strictEqual(f.servers[0].apis.length, 1);
        assert.strictEqual(f.apis.length, 0);
        assert.strictEqual(f.servers.length, 1);
    });
});
