import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

const mockedUseNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom')),
  useNavigate: () => mockedUseNavigate,
}))

test('Navbar renders successfully', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    const element = screen.getByText(/home/i);
    expect(element).toBeInTheDocument();
  });

test('Navbar gets set when useNavigate is called', () => {
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  )
  mockedUseNavigate('/testing')
  expect(mockedUseNavigate).toBeCalledWith('/testing')
  const homeButton = screen.getByText(/home/i)
  fireEvent.click(homeButton)
  expect(mockedUseNavigate).toBeCalledWith('/')

})