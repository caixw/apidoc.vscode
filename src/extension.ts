// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import * as config from './config';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
} from 'vscode-languageclient';

let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext) {
    const cfg = await config.getConfiguration();
    if (cfg === null) { return; }

    const serverOptions: ServerOptions = {
        command: cfg.command,
        args: ['lsp', '-p=' + cfg.port, '-m=stdio', '-h']
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: config.documentSelector(),
    };

    client = new LanguageClient(config.name, `${config.name} lsp server`, serverOptions, clientOptions);
    client.onReady().then(() => {
        const c = client.initializeResult && client.initializeResult.capabilities;
        if (!c) {
            return vscode.window.showErrorMessage('%client-not-has-capabilities%', '%ok%');
        }
    });

    context.subscriptions.push(client.start());
}

export function deactivate() {
    if (client) {
        return client.stop();
    }
}
