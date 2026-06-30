type NodeStartupSnapshot = {
  isBuildingSnapshot?: () => boolean;
  addDeserializeCallback?: (callback: () => void) => void;
};

declare global {
  var process:
    | { getBuiltinModule: (module: 'v8') => { startupSnapshot: NodeStartupSnapshot } }
    | undefined;
}

export function addV8SnapshotDeserializeCallback(callback: () => void) {
  try {
    const startUpSnapshot = globalThis?.process?.getBuiltinModule?.('v8')?.startupSnapshot;
    if (startUpSnapshot?.isBuildingSnapshot?.() ?? false) {
      startUpSnapshot?.addDeserializeCallback?.(callback);
    }
  } catch {
    // catch is needed due to Bun runtime implementing v8 module with the callback throwing `NotImplementedError: node:v8 isBuildingSnapshot is not yet implemented in Bun.`
    // a fix was merged for https://github.com/oven-sh/bun/issues/32501 so this is likely get solved for 1.3.15
    return;
  }
}
