# ngx-mf-remote-loader

A lightweight, SSR-compatible remote module loader for Angular applications with Micro Frontend architecture.

## Overview

This package solves the challenge of loading remote modules in Angular applications that use Server-Side Rendering (SSR). It provides a unified API for loading remote modules in both browser and server environments.

## Key Features

- **SSR Compatibility**: Works seamlessly in both browser and server environments
- **Angular Router Integration**: Easy integration with Angular's lazy loading
- **Nx Support**: Built to work with Nx Micro Frontend architecture
- **Extensible API**: Simple to customize for specific project needs
- **TypeScript Support**: Fully typed with comprehensive JSDoc documentation

## Use Cases

- Loading remote modules in Angular applications with SSR
- Implementing Micro Frontend architecture with Angular
- Lazy loading remote components and modules
- Creating a unified API for module federation in Angular

## Technical Details

The package provides:
- Abstract `RemoteLoader` class
- Browser implementation using Nx's module federation
- Server implementation with configurable module mapping
- Helper functions for Angular router integration
