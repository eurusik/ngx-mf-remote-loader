/**
 * @module ngx-mf-remote-loader
 * 
 * This module provides utilities for loading remote modules in Angular applications
 * with support for both browser and server-side rendering (SSR).
 * 
 * The main components are:
 * - RemoteLoader: Abstract base class for remote module loading
 * - RemoteLoaderBrowser: Browser implementation of RemoteLoader
 * - RemoteLoaderServer: Server implementation of RemoteLoader
 * - remoteLoader: Function to create lazy-loaded routes for remote modules
 */

/**
 * Export the core RemoteLoader abstract class and utilities
 */
export * from './remote-loader';

/**
 * Export the browser implementation of RemoteLoader
 */
export * from './remote-loader-browser';

/**
 * Export the server implementation of RemoteLoader
 */
export * from './remote-loader-server';
