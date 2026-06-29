type NodeStartupSnapshot = {
  isBuildingSnapshot?: () => boolean;
  addDeserializeCallback?: (callback: () => void) => void;
};

export function getNodeStartupSnapshot(): NodeStartupSnapshot | undefined {
  // @ts-expect-error Node.js types not present since this is an optional API
  return globalThis?.process?.getBuiltinModule?.('v8')?.startupSnapshot;
}

export function isNodeProcessCurrentlyBuildingSnapshot(): boolean {
  if ('Bun' in globalThis) {
    return false;
  }

  try {
    return getNodeStartupSnapshot()?.isBuildingSnapshot?.() ?? false;
  } catch {
    return false;
  }
}
