import React from 'react';

type ComponentOptions = {
  interfaceOnly?: boolean;
  paperComponentName?: string;
  nativePackageName?: string;
};

export default function codegenNativeComponent<Props>(
  _viewName: string,
  _options?: ComponentOptions
) {
  return React.forwardRef<unknown, Props>((_props, _ref) => {
    const isDevelopment =
      (typeof import.meta !== 'undefined' && import.meta.env?.DEV === true) ||
      (typeof globalThis !== 'undefined' &&
        'process' in globalThis &&
        ((globalThis as unknown as {
          process?: { env?: Record<string, string | undefined> };
        }).process?.env?.NODE_ENV ?? 'production') !== 'production');

    if (isDevelopment) {
      console.warn(
        'codegenNativeComponent is not implemented for the web environment.'
      );
    }

    return null;
  });
}

