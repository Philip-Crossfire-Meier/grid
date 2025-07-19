import React from 'react';
import '@testing-library/jest-dom';

// Set up global variables
global.__DEV__ = true;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Create simple DOM elements for React Native components
const createMockComponent = (name) => {
  const Component = React.forwardRef((props, ref) => {
    const { children, testID, onPress, onChangeText, ...otherProps } = props;
    
    if (name === 'TextInput') {
      return React.createElement('input', {
        ...otherProps,
        ref,
        'data-testid': testID,
        onChange: onChangeText ? (e) => onChangeText(e.target.value) : undefined,
        defaultValue: props.value || '',
      });
    }
    
    if (name === 'TouchableOpacity') {
      return React.createElement('button', {
        ...otherProps,
        ref,
        'data-testid': testID,
        onClick: onPress,
      }, children);
    }
    
    const element = name === 'Text' ? 'span' : 'div';
    return React.createElement(element, {
      ...otherProps,
      ref,
      'data-testid': testID,
    }, children);
  });
  
  Component.displayName = name;
  return Component;
};

// Mock react-native with simpler components
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: 'web', select: (options) => options.web || options.default },
  StyleSheet: { create: (styles) => styles },
  Dimensions: { get: () => ({ width: 375, height: 667 }) },
  View: createMockComponent('View'),
  Text: createMockComponent('Text'),
  TextInput: createMockComponent('TextInput'),
  TouchableOpacity: createMockComponent('TouchableOpacity'),
  ScrollView: createMockComponent('ScrollView'),
}));

// Mock Expo modules
jest.mock('expo', () => ({
  registerRootComponent: jest.fn(),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: createMockComponent('StatusBar'),
}));
