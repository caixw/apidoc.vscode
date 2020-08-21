// SPDX-License-Identifier: MIT

import vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';

export class DocTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private client: LanguageClient;
    private folders: Array<FolderTreeItem> = [];

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem> = new vscode.EventEmitter<vscode.TreeItem>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem> = this._onDidChangeTreeData.event;

    private refresh(f: vscode.TreeItem): void {
        this._onDidChangeTreeData.fire(f);
    }

    constructor(client: LanguageClient) {
        this.client = client;
        this.update(false);

        // 注册 apidoc/outline 处理事件钩子
        this.client.onNotification('apidoc/outline', (outline: Outline) => {
            for (const f of this.folders) {
                if (f.fill(outline)) {
                    this.refresh(f);
                    return;
                }
            }
        });
    }

    // 刷新文档列表
    //
    // refresh 表示是否请求服务器刷新数据。
    update(refresh: boolean) {
        this.folders = [];
        for (const f of vscode.workspace.workspaceFolders!) {
            this.folders.push(new FolderTreeItem(f));

            if (refresh) {
                this.client.sendNotification('apidoc/refreshOutline', f);
            }
        }
    }

    getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
        if (!element) {
            return this.folders;
        }

        if (element instanceof FolderTreeItem) {
            const apis: Array<vscode.TreeItem> = [];

            element.servers.forEach((api) => { apis.push(api); });
            element.apis.forEach((api) => { apis.push(api); });

            return apis;
        } else if (element instanceof ServerTreeItem) {
            return element.apis;
        } else {
            return [];
        }
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }
}

// API 列表容器
class APIContainer extends vscode.TreeItem {
    apis: Array<APITreeItem> = [];

    constructor(label: string) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
    }

    protected reset() {
        this.apis = [];
    }

    push(api: API) {
        this.apis.push(new APITreeItem(api));
    }
}

// 表示 API 的列表项
class APITreeItem extends vscode.TreeItem {
    constructor(api: API) {
        super(api.method + '  ' + api.path, vscode.TreeItemCollapsibleState.None);

        this.command = {
            title: 'vscode.open',
            command: 'vscode.open',
            arguments: [
                vscode.Uri.parse(api.location.uri),
                {
                    preview: true,
                    selection: api.location.range,
                },
            ],
        };

        this.description = api.summary;
    }
}

// 项目列表项，包含了 API 列表和服务器列表。
export class FolderTreeItem extends APIContainer {
    uri: vscode.Uri;
    servers: ServerTreeItem[] = [];

    constructor(f: { name: string, uri: vscode.Uri }) {
        super(f.name);
        this.uri = f.uri;
    }

    protected reset() {
        this.servers = [];
        super.reset();
    }

    // 用 outline 的内容填充当前对象，之前的内容会被清空。
    fill(outline: Outline): boolean {
        if (!this.matched(outline)) {
            return false;
        }

        this.reset();

        outline.servers?.forEach((srv) => {
            const s = new ServerTreeItem(srv);
            outline.apis?.forEach((api) => {
                if (api.servers && api.servers.includes(srv.id)) {
                    s.push(api);
                }
            });
            this.servers.push(s);
        });

        outline.apis?.forEach((api) => {
            if (!api.servers || api.servers.length === 0) {
                this.push(api);
            }
        });

        return true;
    }

    // 确定 outline 与当前的项目是否匹配。如果 uri 相等就判断为匹配。
    private matched(outline: Outline): boolean {
        const folder = vscode.Uri.parse(outline.workspaceFolder.uri);
        return this.uri.scheme === folder.scheme
            && this.uri.path === folder.path;
    }
}

class ServerTreeItem extends APIContainer {
    constructor(srv: Server) {
        super(srv.id);
        this.description = srv.url;
    }
}

interface Outline {
    workspaceFolder: {
        uri: string;
        name: string;
    };

    location: Location;
    title: string;
    version: string;
    tags?: {
        id: string;
        title: string;
    }[];
    servers?: Server[];
    apis?: API[];
}

interface API {
    location: Location;
    method: string;
    path: string;
    tags?: string[];
    servers?: string[];
    deprecated?: string;
    summary?: string;
}

interface Server {
    id: string;
    url: string;
}

interface Location {
    uri: string; // 并不能真正地将服务端返回的字符串解析为 vscode.Uri
    range: vscode.Range;
}
