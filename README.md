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

For server-side rendering, you need to customize the `RemoteLoaderServer` implementation to handle your specific remote modules:

```typescript
//# ngx-mf-remote-loader-server.ts
import { RemoteLoaderServer, RemoteItems } from 'ngx-mf-remote-loader';

export class CustomRemoteLoaderServer extends RemoteLoaderServer {
  load(remoteName: string, remoteModule: RemoteItems): Promise<any> {
    switch (remoteName + remoteModule) {
      case 'app1Module':
        return import('app1/Module').then((m) => m.RemoteEntryModule);
      case 'app2Module':
        return import('app2/Module').then((m) => m.RemoteEntryModule);
      // Add more cases as needed
      default:
        return super.load(remoteName, remoteModule);
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

## License

MIT
