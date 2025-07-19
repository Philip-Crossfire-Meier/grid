import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock React Native components
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null
}));

jest.mock('react-native', () => ({
  StyleSheet: {
    create: jest.fn((styles) => styles)
  },
  View: 'div',
  SafeAreaView: 'div'
}));

// Mock the EditableGrid component
jest.mock('../../components/EditableGrid', () => {
  return function MockEditableGrid() {
    const mockReact = require('react');
    return mockReact.createElement('div', { 'data-testid': 'editable-grid' }, 'Mocked EditableGrid');
  };
});

import App from '../../App.js';

describe('App Component', () => {
  test('renders without crashing', () => {
    render(React.createElement(App));
    expect(screen.getByTestId('editable-grid')).toBeInTheDocument();
  });

  test('renders the main application structure', () => {
    const { container } = render(React.createElement(App));
    expect(container).toBeInTheDocument();
  });
});
