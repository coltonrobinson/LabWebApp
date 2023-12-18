import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';
import { AppWrapper } from '../../contexts/app';

const mockedUseNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom')),
  useNavigate: () => mockedUseNavigate,
}))

test('Navbar renders successfully', () => {
  render(
    <AppWrapper sharedState={{ technicianId: 1 }}>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </AppWrapper>
  );
  const element = screen.getByText(/home/i);
  expect(element).toBeInTheDocument();
});

test('Navbar gets set when useNavigate is called', () => {
  render(
    <AppWrapper sharedState={{ technicianId: 1 }}>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </AppWrapper>
  )
  mockedUseNavigate('/testing')
  expect(mockedUseNavigate).toBeCalledWith('/testing')
  const homeButton = screen.getByText(/home/i)
  fireEvent.click(homeButton)
  expect(mockedUseNavigate).toBeCalledWith('/')

})