import * as functions from './functions.js';

renderFunctionList(functions);
addFunctionSelectEventListener(functions);


function addFunctionSelectEventListener(functions) {
  let functionRunnerEventListener = null;

  const el = document.querySelector('#function-list');
  el.addEventListener('click', evt => {
    const section = getNearestAncestorByTag(evt.target, 'section');
    if (!section) {
      return;
    }
    const selectedFunction = functions[section.id];

    renderFunctionRunner(selectedFunction);
    renderFunctionResult('');

    removeFunctionRunnerEventListener(functionRunnerEventListener);
    functionRunnerEventListener = addFunctionRunnerEventListener(selectedFunction);
  });
}


function renderFunctionList(functions) {
  const el = document.querySelector('#function-list__body');
  el.innerHTML =
    Object.values(functions)
      .filter(prop => typeof prop === 'function')
      .sort((funA, funB) => funA.name < funB.name ? -1 : 1)
      .map(functionCard)
      .join('');
}


function functionCard(fun) {
  const argList = range(1, fun.length + 1).map(i => `arg${i}`).join(', ');
  return `
    <section id="${fun.name}" class="function-card">
      <div class="function-card__name">
        ${fun.name}(${argList})
      </div>
      <div class="function-card__body">
        <code>
          ${fun.toString()}
        </code>
      </div>
    </section>
  `;
}


function renderFunctionRunner(fun) {
  const el = document.querySelector('#function-runner__args');
  let html = `<h2>Function <code>${fun.name}()</code> accepts no arguments</h2>`;
  if (fun.length) {
    html = `<h2>Please enter argument(s) for <code>${fun.name}()</code>:</h2><ol>`;
    for (let i = 0; i < fun.length; i++) {
      html += `<li><input id="${i}" class="arg" /></li>`
    }
    html += '</ol>';
  }
  html += `<button id="run">Execute ${fun.name}()</button>`;
  el.innerHTML = html;
}


function addFunctionRunnerEventListener(fun) {
  function listener(evt) {
    if (evt.target.id !== 'run') {
      return;
    }

    const args = Array.from(document.querySelectorAll('.arg'))
      .sort((inputA, inputB) => parseInt(inputA.id) - parseInt(inputB.id))
      .map(input => input.value);

    const result = fun(...args);
    renderFunctionResult(result);
  }

  const el = document.querySelector('#function-runner');
  el.addEventListener('click', listener);

  return listener;
}


function removeFunctionRunnerEventListener(listener) {
  const el = document.querySelector('#function-runner');
  el.removeEventListener('click', listener);
}


function renderFunctionResult(result) {
  const el = document.querySelector('#function-runner__result');
  el.innerHTML = result;
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

function range(start, end) {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  return [...new Array(end - start)].map((_, i) => i + start);
}