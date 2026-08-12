/**
 * Server-only OCR adapters.
 *
 * Import this subpath only from Node.js. Keeping the native PaddleOCR graph
 * behind a package subpath prevents browser and SSR bundlers from traversing
 * its Sharp, ONNX Runtime, and Gutenye dependencies.
 *
 * @packageDocumentation
 */

export { ONNXGutenyeProvider } from './onnx-gutenye';
