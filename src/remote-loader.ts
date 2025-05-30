import { LoadChildren, ROUTES, RouterModule } from '@angular/router';
import { NgModule, inject } from '@angular/core';

/**
 * Type representing the possible remote module items that can be loaded.
 * 
 * - 'Module': Represents the main entry module of a remote application
 * - string: Any other module or component from the remote application
 */
export type RemoteItems = 'Module' | string;

/**
 * Abstract base class for remote module loading.
 * 
 * This class defines the contract for loading remote modules in both browser and server environments.
 * Implementations should provide the logic for loading modules from remote applications.
 * 
 * @example
 * ```typescript
 * class CustomRemoteLoader extends RemoteLoader {
 *   load(remoteName: string, remoteModule: RemoteItems): Promise<any> {
 *     // Custom implementation
 *   }
 * }
 * ```
 */
export abstract class RemoteLoader {
  /**
   * Loads a remote module from a specified remote application.
   * 
   * @param remoteName - The name of the remote application
   * @param remoteModule - The module name to load from the remote application
   * @returns A Promise resolving to the loaded module
   */
  abstract load(remoteName: string, remoteModule: RemoteItems): Promise<any>;
}

/**
 * Creates a lazy-loaded route configuration for a remote module.
 * 
 * This function creates a proxy Angular module that uses the RemoteLoader to dynamically
 * load a remote module. It's designed to be used in Angular route configurations to enable
 * lazy loading of remote modules.
 * 
 * @param name - The name of the remote application to load
 * @returns A LoadChildren function that can be used in Angular route configurations
 * 
 * @example
 * ```typescript
 * const routes: Routes = [
 *   {
 *     path: 'remote-feature',
 *     loadChildren: remoteLoader('remoteAppName')
 *   }
 * ];
 * ```
 */
export function remoteLoader(name: string): LoadChildren {
  @NgModule({
    imports: [RouterModule.forChild([])],
    providers: [
      {
        provide: ROUTES,
        multi: true,
        useFactory: () => {
          const loader = inject(RemoteLoader);
          return { path: '', loadChildren: () => loader.load(name, 'Module') };
        },
      },
    ],
  })
  class ProxyRoutingModule {}

  return () => ProxyRoutingModule;
}
