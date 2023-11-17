import { render, screen, act } from '@testing-library/react';
import Metrics from './Metrics';
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
                return Promise.resolve({ data: [{ calibration_procedure_id: 10001 }] })
            default:
                return Promise.reject()
        }
    });
})

test('Metrics renders successfully', async () => {
    jest.useFakeTimers();
    render(<Metrics />)
    const loading = screen.getByText(/loading.../i)
    expect(loading).toBeInTheDocument()

    await act(async () => {
        jest.advanceTimersByTime(5000);
    })
    const graphs = screen.getByTestId('graphs')
    expect(graphs).toBeInTheDocument()
})

