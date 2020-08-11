// SPDX-License-Identifier: MIT

import  vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
} from 'vscode-languageclient';

import * as config from './config';
import * as locale from './locale/locale';


// 初始化本地化信息
locale.init();
config.init();

let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext) {
    await config.activate();
    await createLSP(context);
    createStatusBarItem(context);
}

async function createLSP(context: vscode.ExtensionContext) {
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
    });

    context.subscriptions.push(client.start());
}

function createStatusBarItem(context: vscode.ExtensionContext) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = config.name;
    statusBarItem.tooltip = config.name + ' ' + config.version;
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    const disposable = vscode.window.onDidChangeActiveTextEditor(()=>{
        const id = vscode.window.activeTextEditor?.document.languageId;
        if (id && config.languages.includes(id)) {
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    });
    context.subscriptions.push(disposable);
}

export async function deactivate() {
    await config.deactivate();

    if (client) {
        return client.stop();
    }
}
