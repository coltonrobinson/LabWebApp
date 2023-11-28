import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';
import { AppWrapper } from '../../contexts/app';

test('Header renders successfully', () => {
  render(
    <AppWrapper sharedState={{ technician: {}, setTechnician: jest.fn(), setTechnicianId: jest.fn() }}>
      <MemoryRouter>
        <Header title={'test title'} />
      </MemoryRouter>
    </AppWrapper>
  );
  const element = screen.getByText(/test title/i);
  expect(element).toBeInTheDocument();
});

it('should render a default title', () => {
  render(
    <AppWrapper sharedState={{ technician: {}, setTechnician: jest.fn(), setTechnicianId: jest.fn() }}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </AppWrapper>
  )
  const defaultHeader = screen.getByText(/default title/i);
  expect(defaultHeader).toBeInTheDocument();
})


test('home button is clickable', () => {
  render(
    <AppWrapper sharedState={{ technician: {}, setTechnician: jest.fn(), setTechnicianId: jest.fn() }}>
      <MemoryRouter>
        <Header title={'test title'} />
      </MemoryRouter>
    </AppWrapper>
  )
  const button = screen.getByRole('button', { className: 'home_button' });
  fireEvent.click(button);
})