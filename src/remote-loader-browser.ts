import { RemoteItems, RemoteLoader } from './remote-loader';
import { loadRemoteModule } from '@nx/angular/mf';

/**
 * Browser-side implementation of the RemoteLoader.
 * 
 * This class is responsible for loading remote modules in the browser environment
 * using Nx's loadRemoteModule utility. It handles the loading of remote modules
 * and extracting the appropriate module export.
 * 
 * @example
 * ```typescript
 * const browserLoader = new RemoteLoaderBrowser();
 * browserLoader.load('app1', 'Module').then(module => {
 *   // Use the loaded module
 * });
 * ```
 */
export class RemoteLoaderBrowser extends RemoteLoader {
  /**
   * Loads a remote module using Nx's loadRemoteModule utility.
   * 
   * This method uses Nx's loadRemoteModule to dynamically load a module from a remote application.
   * If the remoteModule is 'Module', it returns the RemoteEntryModule property of the loaded module.
   * Otherwise, it returns the module as is.
   * 
   * @param remoteName - The name of the remote application as configured in webpack.config.js
   * @param remoteModule - The module name to load from the remote application
   * @returns A Promise resolving to the loaded module
   * 
   * @example
   * ```typescript
   * browserLoader.load('app1', 'Module').then(module => {
   *   // Use the loaded module
   * });
   * ```
   */
  load(remoteName: string, remoteModule: RemoteItems): Promise<any> {
    return loadRemoteModule(remoteName, './' + remoteModule).then((m) =>
      remoteModule === 'Module' ? m.RemoteEntryModule : m
    );
  }
}
