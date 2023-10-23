import { render, screen } from '@testing-library/react';
import BatchEntry from './BatchEntry';
import { AppWrapper } from '../../contexts/app';

const mockedUseNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom')),
  useNavigate: () => mockedUseNavigate,
}))

test('BatchEntry renders successfully', () => {
    render(
        <AppWrapper sharedState={{
            batchNumber: 3000, setBatchNumber: jest.fn(), setSensorList: jest.fn(), setProcedureId: jest.fn(),
            technicianId: 1, setPopupMessage: jest.fn(), sensorGrid: [], setSensorGrid: jest.fn()
        }}>
            <BatchEntry />
        </AppWrapper>
    )
    const submitButton = screen.getByText(/submit/i)
    expect(submitButton).toBeInTheDocument()
})

test('sensorGrid having entries resets to empty list', () => {
    const mockSetSensorGrid = jest.fn()
    render(
        <AppWrapper sharedState={{
            batchNumber: 3000, setBatchNumber: jest.fn(), setSensorList: jest.fn(), setProcedureId: jest.fn(),
            technicianId: 1, setPopupMessage: jest.fn(), sensorGrid: ['testing'], setSensorGrid: mockSetSensorGrid
        }}>
            <BatchEntry />
        </AppWrapper>
    )
    expect(mockSetSensorGrid).toBeCalledWith([])
})