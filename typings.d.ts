import { Compiler } from "webpack";

export = VersionCheckWebpackPlugin;

export type EntryEntries = {[x: string]: string};

declare class VersionCheckWebpackPlugin {
	constructor(options?: VersionCheckWebpackPlugin.Options);

	private options: VersionCheckWebpackPlugin.Options;
	private updaterName: string;
	private updaterExtension: string;
	private updaterPath: string;

	private getPrePath(): string;

	private generateFile(compiler: Compiler): void;

	private removeFile(): void;

	private getEntryEntries(compiler: Compiler): EntryEntries;

	public apply(compiler: Compiler): void;

	static readonly version: number;
	static readonly pluginName: 'VersionCheckWebpackPlugin';
}

declare namespace VersionCheckWebpackPlugin {
	interface Options { versionFilename?: string, entryNeedInjectedUpdater?: string | [] }
}
