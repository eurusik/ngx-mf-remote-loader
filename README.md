# ngx-mf-remote-loader

SSR-compatible dynamic remote module loader for Angular + Nx Micro Frontends.

## Installation

```bash
npm install ngx-mf-remote-loader
```

## Features

- SSR-compatible remote module loading
- Works with Angular and Nx Micro Frontends
- Simple API for loading remote modules
- Separate implementations for browser and server environments

## Usage

### Basic Setup

1. First, provide the appropriate `RemoteLoader` implementation in your app module:

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RemoteLoader, RemoteLoaderBrowser } from 'ngx-mf-remote-loader';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [
    {
      provide: RemoteLoader,
      useClass: RemoteLoaderBrowser
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

2. Use the `remoteLoader` function in your routes:

```typescript
// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { remoteLoader } from 'ngx-mf-remote-loader';

const routes: Routes = [
  {
    path: 'remote-feature',
    loadChildren: remoteLoader('remoteAppName')
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```

### SSR Configuration

For SSR applications, you need to provide different implementations for browser and server:

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RemoteLoader } from 'ngx-mf-remote-loader';
import { AppComponent } from './app.component';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [
    {
      provide: RemoteLoader,
      useFactory: () => {
        const platformId = inject(PLATFORM_ID);
        if (isPlatformBrowser(platformId)) {
          const { RemoteLoaderBrowser } = require('ngx-mf-remote-loader');
          return new RemoteLoaderBrowser();
        } else {
          const { RemoteLoaderServer } = require('ngx-mf-remote-loader');
          return new RemoteLoaderServer();
        }
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

### Customizing Server-Side Loading

For server-side rendering, you need to customize the `RemoteLoaderServer` implementation to handle your specific remote modules. There are two main approaches:

#### Approach 1: Using registerRemoteModule

```typescript
//# ngx-mf-remote-loader-server.ts
import { RemoteLoaderServer, RemoteItems } from 'ngx-mf-remote-loader';

export class CustomRemoteLoaderServer extends RemoteLoaderServer {
  constructor() {
    super();
    // Register all your remote modules
    this.registerRemoteModule('app1', 'Module', () => import('app1/Module'));
    this.registerRemoteModule('app2', 'Module', () => import('app2/Module'));
    // Add more registrations as needed
  }
  
  // You can also override the load method to add custom logic
  load(remoteName: string, remoteModule: RemoteItems): Promise<any> {
    // Custom logic here if needed
    return super.load(remoteName, remoteModule);
  }
}
```

#### Approach 2: Direct switch case implementation

This approach directly handles the module loading with switch cases:

```typescript
//# ngx-mf-remote-loader-server.ts
import { RemoteLoader, RemoteItems } from 'ngx-mf-remote-loader';

// Define your specific remote module types for better type safety
type RemotesKey =
  | 'app1'
  | 'app2'
  | 'app3-component';

export class CustomRemoteLoaderServer extends RemoteLoader {
  load(remoteName: RemotesKey, remoteModule: RemoteItems): Promise<any> {
    switch (remoteName + remoteModule) {
      case 'app1Module':
        // eslint-disable-next-line @nx/enforce-module-boundaries
        return import('app1/Module').then((m) => m.RemoteEntryModule);
      case 'app2Module':
        // eslint-disable-next-line @nx/enforce-module-boundaries
        return import('app2/Module').then((m) => m.RemoteEntryModule);
      case 'app3-componentCarouselComponent':
        // eslint-disable-next-line @nx/enforce-module-boundaries
        return import('app3-component/CarouselComponent');
      // Add more cases as needed
      default:
        throw new Error(`Remote module ${remoteName}/${remoteModule} not found`);
    }
  }
}
```

## Module Federation Manifest Setup

**Important:** Setting up the module-federation.manifest.json file is a required step for ngx-mf-remote-loader to work properly. This manifest is essential for mapping remote module names to their URLs and is a crucial part of the Nx Module Federation setup that our library depends on.

### Manifest Structure

The manifest file is a simple JSON mapping of remote module names to their URLs:

```json
{
  "remote-app-1": "http://localhost:4201",
  "remote-app-2": "http://localhost:4202",
  "remote-app-3": "http://localhost:4203"
}
```

### Loading the Manifest

**Required Step:** For ngx-mf-remote-loader to function correctly, you must load the manifest file in your host application and set the remote definitions as shown below:

#### Using setRemoteDefinitions (Deprecated in Nx 22)

```typescript
// main.ts
import { setRemoteDefinitions } from '@nx/angular/mf';

// Load the manifest file at application startup
fetch('assets/module-federation.manifest.json')
  .then((res) => res.json())
  .then((definitions) => setRemoteDefinitions(definitions))
  .then(() => import('./bootstrap').catch((err) => console.error(err)));
```

#### Using init() from @module-federation/enhanced/runtime (Recommended)

```typescript
// main.ts
import { init } from '@module-federation/enhanced/runtime';

// Example of direct initialization
init({
  name: 'host',
  remotes: [{
    name: 'my-remote-app',
    entry: 'http://localhost:4201/mf-manifest.json'
  }]
});

// Or loading from a manifest file
fetch('assets/module-federation.manifest.json')
  .then((res) => res.json())
  .then((definitions) => {
    const remotes = Object.entries(definitions).map(([name, entry]) => ({
      name,
      entry
    }));
    
    return init({
      name: 'host',
      remotes
    });
  })
  .then(() => import('./bootstrap').catch((err) => console.error(err)));
```

> **Note:** `setRemoteDefinitions` will be removed in Nx 22. It's recommended to migrate to `init()` from `@module-federation/enhanced/runtime`.

#### Workaround for Lazy-Loaded Modules

If your application has calls to `loadRemoteModule` inside lazy-loaded NgModules, you might encounter issues with loading federated modules. Here's a workaround that makes remote definitions available globally:

```typescript
// main.ts
import { setRemoteDefinitions } from '@nx/angular/mf';

fetch('assets/module-federation.manifest.json')
  .then((res) => res.json())
  .then((remoteDefinitions) => {
    setRemoteDefinitions(remoteDefinitions);
    
    // Workaround: Make remote definitions available globally
    // This helps with loading federated modules in lazy-loaded NgModules
    // See https://github.com/nrwl/nx/issues/27842
    Object.assign(globalThis, { remoteDefinitions });
  })
  .then(() => import('./bootstrap').catch((err) => console.error(err)));
```

This workaround assigns the remote definitions to the global scope, making them accessible to lazy-loaded modules that need to resolve remote module URLs.

This initialization step is essential for our library to properly resolve and load remote modules.

### How It Works

1. **Initialization**: The host application loads the manifest file and passes it to `setRemoteDefinitions()`
2. **Remote Loading**: When `loadRemoteModule()` is called, it:
   - Looks up the remote's URL in the manifest
   - Dynamically loads the JavaScript from that URL
   - Returns the requested module or component

### Environment-Specific Manifests

You can create environment-specific manifest files for different deployment environments:

```
/assets/
  module-federation.manifest.dev.json
  module-federation.manifest.prod.json
  module-federation.manifest.json  # The active manifest
```

During the build process, you can copy the appropriate environment-specific manifest to the main module-federation.manifest.json file.

### Advanced: Dynamic Manifest Updates

For applications that need to update remote URLs at runtime:

```typescript
import { setRemoteDefinitions } from '@nx/angular/mf';

// Fetch an updated manifest from your API
fetchUpdatedManifest().then(newDefinitions => {
  setRemoteDefinitions(newDefinitions);
  // Now loadRemoteModule will use the updated URLs
});
```

### Troubleshooting

Common issues with module federation manifest:

- **404 Not Found**: Ensure the manifest file is correctly copied to the assets folder during build
- **Remote Loading Failures**: Verify that the URLs in your manifest are correct and accessible
- **SSR Errors**: For server-side rendering, ensure you've properly configured the server-side loader

### Implementation Details

Under the hood, the library uses Nx's `loadRemoteModule` function, which relies on the manifest definitions:

```typescript
// RemoteLoaderBrowser implementation
export class RemoteLoaderBrowser extends RemoteLoader {
  load(remoteName: string, remoteModule: RemoteItems): Promise<any> {
    return loadRemoteModule(remoteName, './' + remoteModule).then((m) => {
      return remoteModule === 'Module' ? m.RemoteEntryModule : m;
    });
  }
}
```

This approach ensures compatibility with the Nx Module Federation system while providing a more convenient API for Angular applications.

## Recommended Companion Tool: nx-mf-remote-loader-generator

For the best development experience, we strongly recommend using our companion tool [nx-mf-remote-loader-generator](https://github.com/eurusik/nx-mf-remote-loader-generator) which automates the creation and configuration of remote components that work seamlessly with this library.

### What nx-mf-remote-loader-generator Does

- Creates a new Angular component in your specified remote application
- Configures the component to be exposed via Module Federation
- Updates the remote application's TypeScript configuration
- **Automatically adds the component to the remote loader server for SSR support**
- Adds type declarations for the remote component

### Installation

```bash
npm install nx-mf-remote-loader-generator
```

### Usage

Once installed, you can use the generator to create a new remote component:

```bash
nx g nx-mf-remote-loader-generator:remoteComponent \
  --remote=my-remote-app \
  --name=MyComponent \
  --selector=my-remote-component
```

### How It Works With ngx-mf-remote-loader

When you generate a remote component using this generator, it automatically:

1. **Registers the component in the remote loader server** with code like:
   ```typescript
   case 'my-remoteMyComponent':
     // eslint-disable-next-line @nx/enforce-module-boundaries
     return import('my-remote/MyComponent');
   ```

2. **Adds type declarations** in the remotes.d.ts file:
   ```typescript
   declare module 'my-remote/MyComponent'
   ```

3. In your host application, you can now use the remote component with our recommended directive [ngx-remote-component](https://github.com/eurusik/ngx-remote-component):

   First, install the directive:
   ```bash
   npm install ngx-remote-component
   ```

   Import the module and configure it with our loader:
   ```typescript
   import { NgModule } from '@angular/core';
   import { RemoteComponentModule, REMOTE_COMPONENT_LOADER } from 'ngx-remote-component';
   import { RemoteLoaderBrowser, RemoteLoaderServer } from 'ngx-mf-remote-loader';

   @NgModule({
     imports: [
       RemoteComponentModule
     ],
     providers: [
       {
         provide: REMOTE_COMPONENT_LOADER,
         // Use RemoteLoaderBrowser for browser environments
         useClass: RemoteLoaderBrowser
         // Or use RemoteLoaderServer for server-side rendering
         // useClass: RemoteLoaderServer
       }
     ]
   })
   export class AppModule { }
   ```

   Then use the directive in your templates:
   ```typescript
   @Component({
     template: `
       <div 
         ngxRemoteComponent
         [remoteName]="'my-remote'"
         [componentName]="'MyComponent'"
         [inputs]="{ 
           productId: { id: '12345' },
           productParams: { quantity: 1, price: 19.99 }
         }"
         (outputs)="handleOutputs($event)">
       </div>
     `
   })
   export class AppComponent {
     handleOutputs(outputs: Record<string, any>) {
       // Handle outputs from the remote component
       console.log('Output received:', outputs);
       
       // Example: Handle a specific output
       if ('buttonClick' in outputs) {
         console.log('Button clicked with data:', outputs['buttonClick']);
       }
     }
   }
   ```

4. **Server-Side Rendering**: When the page is rendered on the server, ngx-mf-remote-loader will use the registered component from the server-side registry to render it properly.

For more information about the nx-mf-remote-loader-generator, visit [https://github.com/eurusik/nx-mf-remote-loader-generator](https://github.com/eurusik/nx-mf-remote-loader-generator).

## License

MIT
