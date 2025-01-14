import type { Context, Event, EventHint, Integration } from '@sentry/core';

import {
  getExpoGoVersion,
  getExpoSdkVersion,
  getHermesVersion,
  getReactNativeVersion,
  isExpo,
  isFabricEnabled,
  isHermesEnabled,
  isTurboModuleEnabled,
} from '../utils/environment';
import type { ReactNativeError } from './debugsymbolicator';

const INTEGRATION_NAME = 'ReactNativeInfo';

export interface ReactNativeContext extends Context {
  js_engine?: string;
  turbo_module: boolean;
  fabric: boolean;
  expo: boolean;
  hermes_version?: string;
  react_native_version?: string;
  component_stack?: string;
  hermes_debug_info?: boolean;
  expo_go_version?: string;
  expo_sdk_version?: string;
}

/** Loads React Native context at runtime */
export const reactNativeInfoIntegration = (): Integration => {
  return {
    name: INTEGRATION_NAME,
    setupOnce: () => {
      // noop
    },
    processEvent,
  };
};

function processEvent(event: Event, hint: EventHint): Event {
  const reactNativeError = hint?.originalException ? (hint?.originalException as ReactNativeError) : undefined;

  const reactNativeContext: ReactNativeContext = {
    turbo_module: isTurboModuleEnabled(),
    fabric: isFabricEnabled(),
    react_native_version: getReactNativeVersion(),
    expo: isExpo(),
  };

  if (isHermesEnabled()) {
    reactNativeContext.js_engine = 'hermes';
    const hermesVersion = getHermesVersion();
    if (hermesVersion) {
      reactNativeContext.hermes_version = hermesVersion;
    }
    reactNativeContext.hermes_debug_info = !isEventWithHermesBytecodeFrames(event);
  } else if (reactNativeError?.jsEngine) {
    reactNativeContext.js_engine = reactNativeError.jsEngine;
  }

  if (reactNativeContext.js_engine === 'hermes') {
    event.tags = {
      hermes: 'true',
      ...event.tags,
    };
  }

  if (reactNativeError?.componentStack) {
    reactNativeContext.component_stack = reactNativeError.componentStack;
  }

  const expoGoVersion = getExpoGoVersion();
  if (expoGoVersion) {
    reactNativeContext.expo_go_version = expoGoVersion;
  }

  const expoSdkVersion = getExpoSdkVersion();
  if (expoSdkVersion) {
    reactNativeContext.expo_sdk_version = expoSdkVersion;
  }

  event.contexts = {
    react_native_context: reactNativeContext,
    ...event.contexts,
  };

  return event;
}

/**
 * Guess if the event contains frames with Hermes bytecode
 * (thus Hermes bundle doesn't contain debug info)
 * based on the event exception/threads frames.
 *
 * This function can be relied on only if Hermes is enabled!
 *
 * Hermes bytecode position is always line 1 and column 0-based number.
 * If Hermes bundle has debug info, the bytecode frames pos are calculated
 * back to the plain bundle source code positions and line will be > 1.
 *
 * Line 1 contains start time var, it's safe to assume it won't crash.
 * The above only applies when Hermes is enabled.
 *
 * Javascript/Hermes bytecode frames have platform === undefined.
 * Native (Java, ObjC, C++) frames have platform === 'android'/'ios'/'native'.
 */
function isEventWithHermesBytecodeFrames(event: Event): boolean {
  for (const value of event.exception?.values || event.threads?.values || []) {
    for (const frame of value.stacktrace?.frames || []) {
      // platform === undefined we assume it's javascript (only native frames use the platform attribute)
      if (frame.platform === undefined && frame.lineno === 1) {
        return true;
      }
    }
  }
  return false;
}
