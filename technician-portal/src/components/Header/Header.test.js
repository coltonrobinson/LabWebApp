import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

test('Header renders successfully', () => {
  render(
    <MemoryRouter>
      <Header title={'test title'} />
    </MemoryRouter>
  );
  const element = screen.getByText(/test title/i);
  expect(element).toBeInTheDocument();
});

it('should render a default title', () => {
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  )
  const defaultHeader = screen.getByText(/default title/i);
  expect(defaultHeader).toBeInTheDocument();
})


test('home button is clickable', () => {
  render(
    <MemoryRouter>
      <Header title={'test title'} />
    </MemoryRouter>
  )
  const button = screen.getByRole('button', {className: 'home_button'});
  fireEvent.click(button);
})