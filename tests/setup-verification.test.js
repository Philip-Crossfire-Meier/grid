import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Jest Setup Verification', () => {
  test('can render a simple React component', () => {
    const TestComponent = () => React.createElement('div', null, 'Hello Test');
    render(React.createElement(TestComponent));
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });

  test('mocks are working correctly', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  test('can render React Native components as HTML elements', () => {
    const { Text } = require('react-native');
    const TestComponent = () => React.createElement(Text, null, 'Hello React Native');
    render(React.createElement(TestComponent));
    expect(screen.getByText('Hello React Native')).toBeInTheDocument();
  });
});
