// SPDX-License-Identifier: MIT

import { DocumentSelector } from 'vscode-languageclient';
import { workspace, window } from 'vscode';
import { promisify } from 'util';
import which from 'which';
import * as cp from 'child_process';
import * as semver from 'semver';

import pkg from '../package.json';
import { l } from './locale/locale';

const exec = promisify(cp.exec);

// 执行 apidoc 的默认选项
//
// 由于查询 apidoc 版本号的指令早于 init 指令执行，
// 所以得在查询 apidoc version 时，保证环境变量的正确。
const opt = {
    env: {
        'LANG': 'cmn-Hans'
    }
};

export const name = pkg.name;

export const version = pkg.version;


// 根据 package.json 中的 activationEvents 生成 DocumentSelector
export function documentSelector(): DocumentSelector {
    const selector: DocumentSelector = [];
    for (const item of pkg.activationEvents) {
        selector.push({
            scheme: 'file',
            language: item.split(':')[1],
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
