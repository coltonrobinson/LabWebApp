import { fireEvent, render, screen, act } from '@testing-library/react';
import AddBatchMenu from './AddBatchMenu';
import { AppWrapper } from '../../contexts/app';
import mockAxios from 'axios';

jest.mock('axios')

test('AddBatchMenu renders successfully', () => {
    render(
        <AppWrapper sharedState={{ setPopupMessage: jest.fn(), technicianId: 1 }} >
            <AddBatchMenu />
        </AppWrapper>
    )

    const currentLocation = screen.getByText(/current location/i)
    expect(currentLocation).toBeInTheDocument()
})

it('should toggle menu on button click', () => {
    render(
        <AppWrapper sharedState={{ setPopupMessage: jest.fn(), technicianId: 1 }} >
            <AddBatchMenu />
        </AppWrapper>
    )

    const hideButton = screen.getByText(/calibration procedure:/i)
    let currentLocation = screen.getByText(/current location/i)
    expect(hideButton).toBeInTheDocument()

    fireEvent.click(hideButton)
    const showButton = screen.getByText(/calibration procedure:/i)
    expect(showButton).toBeInTheDocument()
    expect(currentLocation).not.toBeInTheDocument()

    fireEvent.click(showButton)
    expect(showButton).not.toBeInTheDocument()
    currentLocation = screen.getByText(/current location/i)
    expect(currentLocation).toBeInTheDocument()
})

test('sensor box accepts text', () => {
    render(
        <AppWrapper sharedState={{ setPopupMessage: () => jest.fn(), technicianId: null }} >
            <AddBatchMenu batchNumber={3000} />
        </AppWrapper>
    )
    const mockSensor = '12345:ABCDE'
    const addSensorBox = screen.getByPlaceholderText(/sensor id:check digit/i)
    const addSensorForm = screen.getByTestId('addSensorForm')
    expect(addSensorBox).toBeInTheDocument()
    expect(addSensorForm).toBeInTheDocument()
    expect(addSensorBox).toHaveValue('')
    fireEvent.change(addSensorBox, {
        target: {
            value: mockSensor
        }
    })
    expect(addSensorBox).toHaveValue(mockSensor)
})

// test('checkStatus called after 4 seconds', async () => {
//     jest.useFakeTimers();
//     mockAxios.get.mockImplementation(Promise.resolve({ data: [12345] }))
//     render(
//         <AppWrapper sharedState={{ setPopupMessage: () => jest.fn() }} >
//             <AddBatchMenu batchNumber={3000} />
//         </AppWrapper>
//     )

//     await act(async () => {
//         jest.advanceTimersByTime(4000);
//     })
    
// })