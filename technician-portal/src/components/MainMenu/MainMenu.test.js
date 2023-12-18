import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainMenu from './MainMenu';

test('MainMenu renders successfully', () => {
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    );
    const element = screen.getByText(/loading/i);
    expect(element).toBeInTheDocument();
  });