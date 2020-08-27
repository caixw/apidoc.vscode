// SPDX-License-Identifier: MIT

import vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
} from 'vscode-languageclient';

import * as config from './config';
import * as view from './view';
import * as locale from './locale/locale';


let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext) {
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
    client.onReady().then(() => {
        const c = client.initializeResult && client.initializeResult.capabilities;
        if (!c) {
            const msg = locale.l('client-not-has-capabilities');
            const ok = locale.l('ok');
            return vscode.window.showErrorMessage(msg, ok);
        }
    }).then(()=>{
        const treeViewProvider = new view.DocTreeDataProvider(client);
        const p = vscode.window.registerTreeDataProvider<vscode.TreeItem>('apidoc-explorer', treeViewProvider);
        context.subscriptions.push(p);
    }).then(()=>{
        const refresh = vscode.commands.registerCommand('apidoc.refresh', async (f?: view.FolderTreeItem)=>{
            let folder = f?.folder;

            if (!folder) {
                const picked = await vscode.window.showWorkspaceFolderPick();
                if (!picked) {
                    vscode.window.showErrorMessage(locale.l('unpick-any-folder'));
                    return;
                }
                folder = picked;
            }
            client.sendNotification('apidoc/refreshOutline', {name: folder.name, uri: folder.uri.toString()});
        });
        context.subscriptions.push(refresh);
    });

    context.subscriptions.push(client.start());
}

export async function deactivate() {
    if (client) {
        return client.stop();
    }
}
