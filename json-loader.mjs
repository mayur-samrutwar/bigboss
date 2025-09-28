export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.json')) {
    return {
      shortCircuit: true,
      url: new URL(specifier, context.parentURL).href,
    };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const response = await fetch(url);
    const json = await response.json();
    return {
      format: 'json',
      shortCircuit: true,
      source: JSON.stringify(json),
    };
  }
  return nextLoad(url, context);
}
