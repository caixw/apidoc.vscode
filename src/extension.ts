// SPDX-License-Identifier: MIT

import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
} from 'vscode-languageclient';
import { SemanticTokensFeature } from 'vscode-languageclient/lib/semanticTokens.proposed';

import * as config from './config';
import * as locale from './locale/locale';


// 初始化本地化信息
locale.init();

let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext) {
    await config.activate();

    const cfg = await config.getConfiguration();
    if (cfg === null) { return; }

    const serverOptions: ServerOptions = {
        command: cfg.command,
        args: ['lsp', '-p=' + cfg.port, '-m='+config.lspMode, '-h'],
        options: {'env': config.environment}
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: config.documentSelector(),
    };

    client = new LanguageClient(config.name, `${config.name} lsp server`, serverOptions, clientOptions);
    client.registerFeature(new SemanticTokensFeature(client)); // TODO 直到 LSP 3.16.0 正式上线
    client.onReady().then(() => {
        const c = client.initializeResult && client.initializeResult.capabilities;
        if (!c) {
            const msg = locale.l('client-not-has-capabilities');
            const ok = locale.l('ok');
            return vscode.window.showErrorMessage(msg, ok);
        }
    });

    context.subscriptions.push(client.start());
}

export async function deactivate() {
    await config.deactivate();

    if (client) {
        return client.stop();
    }
}
