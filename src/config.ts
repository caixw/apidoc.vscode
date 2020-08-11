// SPDX-License-Identifier: MIT

// 当前文件提供了整个项目中所有配置相关的内容。

import { DocumentSelector } from 'vscode-languageclient';
import { workspace, window } from 'vscode';
import { promisify } from 'util';
import which from 'which';
import * as cp from 'child_process';
import * as semver from 'semver';

import pkg from '../package.json';
import { l } from './locale/locale';

const exec = promisify(cp.exec);

// 提供的默认环境变量
export const environment = {
    'LANG': 'cmn-Hans'
};

// apidoc 支持的语言 ID
export let languages: Array<string> = [];

const quickSuggestionsKey = 'editor.quickSuggestions'; // 需要修改的配置项名称
let oldQuickSuggestions: any = {}; // 系统的默认的配置项，方便后期恢复用。
const newQuickSuggestions = { 'comments': true }; // 需要修改的项；

// 初始化当前文件
//
// 应该在调用任何内容之前调用此函数进行初始化
export function init() {
    for(const item of pkg.activationEvents) {
        languages.push(item.split(':')[1]);
    }
}

// 初始化配置相关的信息
export async function activate(): Promise<void> {
    const cfg = workspace.getConfiguration();
    oldQuickSuggestions = cfg.get(quickSuggestionsKey);
    return await cfg.update(quickSuggestionsKey, Object.assign({ ...oldQuickSuggestions }, newQuickSuggestions ));
}

// 恢复旧有的配置项
export async function deactivate(): Promise<void> {
    const cfg = workspace.getConfiguration();
    return await cfg.update(quickSuggestionsKey, oldQuickSuggestions);
}

export const name = pkg.name;

// 当前插件的版本号
//
// 插件版本号应该与 apidoc 的主版本号始终相同，
// 可以直接通过此值与 apidoc 的主版本号是否相同判断兼容性。
export const version = pkg.version;

// 连接 lsp 的模式
//
// 可以是 stdio、tcp、udp 等。
export const lspMode = 'stdio';


// 根据 package.json 中的 activationEvents 生成 DocumentSelector
export function documentSelector(): DocumentSelector {
    const selector: DocumentSelector = [];
    for (const lang of languages) {
        selector.push({
            scheme: 'file',
            language: lang,
        });
    }
    return selector;
}

// 配置项
export interface Configuration {
    command: string;
    port: string;
}

// 返回配置项中获取的配置内容
export async function getConfiguration(): Promise<Configuration | null> {
    let cmd = workspace.getConfiguration().get<string>('conf.cmd');
    if (!cmd) {
        cmd = await which(name);
    }
    if (!cmd) {
        await window.showWarningMessage(l('not-found-apidoc'), l('ok'));
        return null;
    }

    const opt = { 'env': environment };
    const { stdout, stderr } = await exec(`${cmd} version -kind=apidoc`, opt);
    if (stderr.trim()) {
        console.error(stderr);
        await window.showWarningMessage(l('not-found-apidoc'), l('ok'));
        return null;
    }

    const version = stdout.trim();
    if (!semver.valid(version)) {
        await window.showWarningMessage(l('version-incompatible'), l('ok'));
        return null;
    }

    if (semver.major(version) !== semver.major(version)) {
        await window.showWarningMessage(l('version-incompatible'), l('ok'));
        return null;
    }

    return {
        command: cmd,
        port: workspace.getConfiguration().get<string>('conf.port')!,
    };
}
