// SPDX-License-Identifier: MIT

import * as path from 'path';
import { runTests } from 'vscode-test';

// 项目的根目录。即 package.json 所在的目录
//
// 同时作为 extensionDevelopmentPath 参数使用；
// 同时还会将该目录的内容加载到启动的 vscode 测试用例中。
const rootDir = path.resolve(__dirname, '../../');

const extensionTestsPath = path.resolve(__dirname, './suite/index');

async function main() {
	try {
		// Download VS Code, unzip it and run the integration test
		await runTests({ extensionDevelopmentPath: rootDir, extensionTestsPath });
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main().catch((reason) => {
    console.error(reason);
    process.exit(1);
});
