'use strict';

import { vi } from 'vitest';

vi.mock(import('../lib/monaco-adapter.js'), () => {
  return {
    createMonacoEditor: vi.fn(() => ({
      getValue: vi.fn(() => ''),
      setValue: vi.fn(),
      onDidChangeModelContent: vi.fn(),
      dispose: vi.fn(),
    })),
  };
});

// avoid loading css in tests by mocking the small helper module that imports the css
vi.mock('../lib/loadStyles.js', () => ({ default: {} }));

// import matey
import Matey from "../lib/matey";
global.matey = new Matey();
// import jsdom-worker to mock Worker object which doesn't work by default in Jest/jsdom
import 'jsdom-worker-fix';

// set up document body
document.body.innerHTML = '<div id="test-editor"></div>';

// initialise matey editors
const config = {
  rmlMapperUrl: "https://rml.io/api/rmlmapper/execute" // CI/CD needs this to pass all tests
};
global.matey.init("test-editor", config);
