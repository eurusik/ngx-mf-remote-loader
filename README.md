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

## License

MIT
