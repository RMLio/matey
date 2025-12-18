// A separate module that can be mocked in tests
// (monaco-editor is not compatible with jsdom, used in vitest)
// Note that no other module should import monaco-editor directly; only this adapter module should do so
import * as monaco from 'monaco-editor';

export function createMonacoEditor(el, options) {
  return monaco.editor.create(el, options);
}

// not using these specific language workers for now, but keeping the imports here for future reference
// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
// import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

// Note that the approach using getWorkerModule as described in the official monaco-editor docs does not work
//   ref: https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md#using-vite
// I have my doubts about these official monaco-editor docs...
// So we use the approach with individual worker imports
//   ref: https://stackoverflow.com/questions/78431576/how-to-integrating-monaco-editor-with-vite-vue3-project
//   ref: https://dev.to/__4f1641/so-you-want-to-set-up-a-monaco-editor-with-a-language-server-2cpn
self.MonacoEnvironment = {
  getWorker(_workerId, label) {
    switch (label) {
      // case 'json':
      //   return new jsonWorker(); 
      // case 'css':
      // case 'scss':
      // case 'less':
      //   return new cssWorker();
      // case 'html':
      // case 'handlebars':
      // case 'razor':
      //   return new htmlWorker();
      // case 'typescript':
      // case 'javascript':
      //   return new tsWorker();
      case 'rmlio':
        // TODO a specific worker for RMLIO
        return new editorWorker();
      case 'rmlkgc':
        // TODO a specific worker for RMLKGC
        return new editorWorker();
      default:
        return new editorWorker(); 
    }
  }
};

