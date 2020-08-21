// SPDX-License-Identifier: MIT

import vscode from 'vscode';
import * as config from './config';
import * as lsp from './lsp';
import * as locale from './locale/locale';

// 初始化本地化信息
locale.init();
config.init();

export async function activate(context: vscode.ExtensionContext) {
    await config.activate();
    await lsp.activate(context);
    createStatusBarItem(context);
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
    await lsp.deactivate();
    await config.deactivate();
}
