// SPDX-License-Identifier: MIT

import { DocumentSelector } from 'vscode-languageclient';
import { workspace, window } from 'vscode';
import { promisify } from 'util';
import * as cp from 'child_process';
import * as semver from 'semver';
import pkg from '../package.json';

const exec = promisify(cp.exec);

export const name = pkg.name;

export const version = pkg.version;


// 根据 package.json 中的 activationEvents 生成 DocumentSelector
export function documentSelector(): DocumentSelector {
    const selector: DocumentSelector = [];
    for (const item of pkg.activationEvents) {
        selector.push({
            scheme: 'file',
            language: item.split(":")[1],
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
export async function getConfiguration(): Promise<Configuration|null> {
    let cmd = workspace.getConfiguration().get<string>('conf.cmd');
    if (!cmd) {
        cmd = name;
    }

    const { stdout, stderr } = await exec(`${cmd} version -kind=apidoc`);
    if (!stderr) {
        await window.showWarningMessage('%not-found-apidoc%', '%ok%');
        return null;
    }

    const version = stdout.trim();
    if (!semver.valid(version)) {
        await window.showWarningMessage('%version-incompatible%', '%ok%');
        return null;
    }

    if (semver.major(version) !== semver.major(version)) {
        await window.showWarningMessage('%version-incompatible%', '%ok%');
        return null;
    }

    return {
        command: cmd,
        port: workspace.getConfiguration().get<string>('conf.port')!,
    };
}
