import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainMenu from './MainMenu';

test('MainMenu renders successfully', () => {
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    );
    const element = screen.getByText(/receiving/i);
    expect(element).toBeInTheDocument();
  });

  test('Menu buttons render', () => {  
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    );
  
    const receivingButton = screen.getByText(/receiving/i);
    fireEvent.click(receivingButton);
  });

  test('"Manage" button renders', () => {  
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    );
  
    const manageButton = screen.getByText(/manage/i);
    fireEvent.click(manageButton);
  });

  test('"Shipping" button renders', () => {  
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    );
  
    const shippingButton = screen.getByText(/shipping/i);
    fireEvent.click(shippingButton);
  });

  test('"Boxed sensors" button renders', () => {  
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    );
  
    const boxedButton = screen.getByText(/boxed sensors/i);
    fireEvent.click(boxedButton);
  });

  test('"Lab View" button renders', () => {  
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    );
  
    const labViewButton = screen.getByText(/lab view/i);
    fireEvent.click(labViewButton);
  });

  test('"Metrics" button renders', () => {  
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    );
  
    const metricsButton = screen.getByText(/metrics/i);
    fireEvent.click(metricsButton);
  });