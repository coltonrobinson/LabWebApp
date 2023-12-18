import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainMenu from './MainMenu';
import mockAxios from 'axios';
import ip from '../../utils/ip/ip';

jest.mock('axios');
jest.mock('react-chartjs-2', () => ({
    Bar: () => null
}));

beforeEach(() => {
  jest.clearAllMocks()

  mockAxios.get.mockImplementation(url => {
      switch (url) {
          case `http://${ip}/api/get-calibrations-by-month/`:
              return Promise.resolve({ data: [{ order_id: 10000 }, { order_id: 10001 }] })
          case `http://${ip}/api/get-calibration-procedures/`:
              return Promise.resolve({ data: [{"calibration_procedure_id":1,"calibration_procedure":"Monnit Standard Temperature Calibration, 3-Set Points, Leaded, Submersible"},{"calibration_procedure_id":2,"calibration_procedure":"Monnit Low Temperature Calibration, 3-Set Points, Leaded, Submersible"},{"calibration_procedure_id":3,"calibration_procedure":"Monnit Humidity and Temperature Calibration"},{"calibration_procedure_id":4,"calibration_procedure":"Monnit Temperature Calibration, 3-Set Points, Dry"},{"calibration_procedure_id":5,"calibration_procedure":"Monnit Temperature Calibration in Climate Controlled Chamber"}] })
          default:
              return Promise.reject()
      }
  });
})

test('MainMenu renders successfully', () => {
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    );
    const element = screen.getByText(/loading/i);
    expect(element).toBeInTheDocument();
  });