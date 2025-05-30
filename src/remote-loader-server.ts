import { RemoteItems, RemoteLoader } from './remote-loader';

/** Type alias for remote module names */
type RemotesKey = string;

/**
 * Server-side implementation of the RemoteLoader.
 * 
 * This class is responsible for loading remote modules on the server side.
 * It maintains a map of remote modules and provides methods to register and load them.
 * 
 * @example
 * ```typescript
 * const serverLoader = new RemoteLoaderServer();
 * serverLoader.registerRemoteModule('app1', 'Module', () => import('app1/Module'));
 * ```
 */
export class RemoteLoaderServer extends RemoteLoader {
  /**
   * Map of remote modules where the key is a combination of remoteName and remoteModule
   * and the value is a function that returns a Promise resolving to the module.
   * @protected
   */
  protected remoteModuleMap: Record<string, () => Promise<any>> = {};

  /**
   * Registers a remote module with its import function.
   * 
   * @param remoteName - The name of the remote application
   * @param remoteModule - The module name to load from the remote application
   * @param importFn - A function that returns a Promise resolving to the module
   * 
   * @example
   * ```typescript
   * serverLoader.registerRemoteModule('app1', 'Module', () => import('app1/Module'));
   * ```
   */
  registerRemoteModule(remoteName: string, remoteModule: RemoteItems, importFn: () => Promise<any>): void {
    this.remoteModuleMap[remoteName + remoteModule] = importFn;
  }

  /**
   * Loads a remote module based on the provided remoteName and remoteModule.
   * 
   * This method first checks if the module is registered in the remoteModuleMap.
   * If found, it imports the module and returns it.
   * For 'Module' type, it returns the RemoteEntryModule property if available.
   * 
   * In development mode, it provides a fallback for 'exampleAppModule'.
   * 
   * @param remoteName - The name of the remote application
   * @param remoteModule - The module name to load from the remote application
   * @returns A Promise resolving to the loaded module
   * @throws Error if the remote module is not found and not registered
   * 
   * @example
   * ```typescript
   * serverLoader.load('app1', 'Module').then(module => {
   *   // Use the loaded module
   * });
   * ```
   */
  load(remoteName: RemotesKey, remoteModule: RemoteItems): Promise<any> {
    const key = remoteName + remoteModule;
    const importFn = this.remoteModuleMap[key];
    
    if (importFn) {
      return importFn().then(m => 
        remoteModule === 'Module' && m.RemoteEntryModule ? m.RemoteEntryModule : m
      );
    }
    
    if (process.env.NODE_ENV === 'development' && key === 'exampleAppModule') {
      console.warn('Using example implementation for exampleAppModule');
      return Promise.resolve({});
    }
    
    throw new Error(`Remote module ${remoteName}/${remoteModule} not found. Make sure to register it using registerRemoteModule.`);
  }
}
