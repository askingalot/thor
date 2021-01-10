
getAvailableModules()
  .then(moduleInfo => {
    renderModuleSelect(moduleInfo);
    addModuleSelectListener();
  });


async function getAvailableModules() {
  const resp = await fetch('/modules');
  return await resp.json();
}


function renderModuleSelect(modules) {
  const el = document.getElementById('function-list__header--select-container');
  el.innerHTML = `
  <select id="function-list__header--select">
    <option value="">Please select a module</option>
    ${modules
      .map(m => `<option value="${m.path}">${m.name}</option>`)
      .join('')}
  </select>`;
}


function addModuleSelectListener() {
  let functionSelectListenerInfo = null

  const el = document.getElementById('function-list__header--select');
  el.addEventListener('change', evt => {
    removeListener(functionSelectListenerInfo);
    clearAllPanels();

    if (!evt.target.value) {
      return;
    }

    importFunctions(evt.target.value)
      .then(functions => {
        renderFunctionList(functions);
        functionSelectListenerInfo = addFunctionSelectListener(functions);
      });
  });
}


async function importFunctions(path) {
  // dynamically import the module
  const module = await import(path);

  // Remove anything that isn't a function and sort alphabetically
  return Object.values(module)
    .filter(val => typeof val === 'function')
    .sort((funA, funB) => funA.name < funB.name ? -1 : 1)
}


function renderFunctionList(functions) {
  const el = document.querySelector('#function-list__body');
  el.innerHTML = functions.map(functionCard).join('');
}


function functionCard(fun) {
  return `
    <section id="${fun.name}" class="function-card">
      <div class="function-card__name">
        ${fun.name}${extractParamList(fun)}
      </div>
    </section>
  `;
}


function addFunctionSelectListener(functions) {
  let functionRunnerListenerInfo = null;

  function listener(evt) {
    const section = getNearestAncestorByTag(evt.target, 'section');
    if (!section) {
      return;
    }

    const selectedFunction = functions.find(f => f.name === section.id);

    renderFunctionDisplay(selectedFunction);
    renderFunctionRunner(selectedFunction);
    clearPanel('#function-runner__result');

    removeListener(functionRunnerListenerInfo);
    functionRunnerListenerInfo = addFunctionRunnerListener(selectedFunction);
  }

  const selector = '#function-list';

  const el = document.querySelector(selector);
  el.addEventListener('click', listener);

  return { selector, listener, type: 'click' };
}


function renderFunctionDisplay(fun) {
  const el = document.querySelector('#function-display');
  el.innerHTML = `
    <h2>${fun.name}</h2>
    <hr/>
    <pre>
      <code>
${window.Prism.highlight(fun.toString(), window.Prism.languages.javascript, 'javascript')}
      </code>
    </pre>
  `;
}


function renderFunctionRunner(fun) {
  const el = document.querySelector('#function-runner__args');

  let html = `<h2>Function <code>${fun.name}()</code> accepts no arguments</h2>`;

  if (fun.length) {
    html = `<h2>Please enter the argument${fun.length === 1 ? '' : 's'} for <code>${fun.name}()</code>:</h2>`;

    html += '<ol>';
    for (let i = 0; i < fun.length; i++) {
      html += `<li><textarea id="${i}" class="arg"></textarea></li>`
    }
    html += '</ol>';
  }

  html += `<button id="run">Execute ${fun.name}()</button>`;
  el.innerHTML = html;

  const firstInput = document.querySelector('.arg');
  firstInput?.focus();
}


function addFunctionRunnerListener(fun) {
  function listener(evt) {
    if (evt.target.id !== 'run') {
      return;
    }

    const args = Array.from(document.querySelectorAll('.arg'))
      .sort((inputA, inputB) => parseInt(inputA.id) - parseInt(inputB.id))
      .map(input => input.value)
      .map(parseArg);

    const result = fun(...args);
    renderFunctionResult(result);
  }

  const selector = '#function-runner';

  const el = document.querySelector(selector);
  el.addEventListener('click', listener);

  return { selector, listener, type: 'click' };
}


function renderFunctionResult(result) {
  const el = document.querySelector('#function-runner__result');
  el.innerHTML = typeof result !== 'string'
    ? JSON.stringify(result)
    : result;
}


function removeListener(listenerInfo) {
  if (listenerInfo) {
    const el = document.querySelector(listenerInfo.selector)
    el.removeEventListener(listenerInfo.type, listenerInfo.listener);
  }
}


function clearAllPanels() {
  const panelSelectors = [
    '#function-runner__result', '#function-runner__args',
    '#function-display', '#function-list__body'];

  panelSelectors.forEach(clearPanel);
}


function clearPanel(selector) {
  const el = document.querySelector(selector);
  el.innerHTML = "";
}


function getNearestAncestorByTag(el, tagname) {
  if (!el?.tagName) {
    return null;
  }

  if (el.tagName.toUpperCase() === tagname.toUpperCase()) {
    return el;
  }

  return getNearestAncestorByTag(el.parentNode, tagname);
}


function extractParamList(fun) {
  const funString = fun.toString();

  const openParenPos = funString.indexOf('(');
  const closeParenPos = funString.indexOf(')');

  return funString.substring(openParenPos, closeParenPos + 1);
}


function parseArg(stringArg) {
  try {
    return JSON.parse(stringArg);
  } catch (error) {
    console.warn(`Failed tp parse "${stringArg}" as JSON. Treating value as string.`, error)
    return stringArg;
  }
}