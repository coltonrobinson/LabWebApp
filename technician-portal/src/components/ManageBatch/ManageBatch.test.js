/* eslint-disable testing-library/no-unnecessary-act */
import { fireEvent, render, screen } from '@testing-library/react';
import ManageBatch from './ManageBatch';
import { AppWrapper } from '../../contexts/app';
import mockAxios from 'axios';
import ip from '../../utils/ip/ip';
import { act } from 'react-dom/test-utils';

jest.mock('../TestingMenu/TestingMenu.js', () => () => {
    return <mock-testing-menu />
})
jest.mock('axios')
const mockedUseNavigate = jest.fn()
jest.spyOn(global.console, 'error').mockImplementation(() => { });

jest.mock('react-router-dom', () => ({
    ...(jest.requireActual('react-router-dom')),
    useNavigate: () => mockedUseNavigate,
}))

beforeEach(() => {
    jest.clearAllMocks()

    mockAxios.get.mockImplementation(url => {
        switch (url) {
            case `http://${ip}:8000/api/get-batch-by-id/`:
                return Promise.resolve({ data: { current_location: 'testLocation' } })
            case `http://${ip}:8000/api/generate-work-order?batch_id=1`:
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { 'content-type': 'application/json' },
                    data: {},
                    blob: jest.fn(() => Promise.resolve(new Blob([])))
                });
            default:
                return Promise.reject();
        }
    });
})

test('ManageBatch renders successfully', async () => {
    await act(async () => {
        render(
            <AppWrapper sharedState={
                {
                    batchNumber: 1, sensorList: [], setSensorList: jest.fn(),
                    procedureId: 1, setPopupMessage: jest.fn(), technicianId: 1
                }
            } >
                <ManageBatch />
            </AppWrapper>
        )
    })
    const calibrationProcedureLabel = screen.getByText(/calibration procedure:/i)
    expect(calibrationProcedureLabel).toBeInTheDocument()
})

test('Manage batch works with each procedureId', async () => {
    for (let i = 0; i <= 5; i++) {
        await act(async () => {
            render(
                <AppWrapper sharedState={
                    {
                        batchNumber: 1, sensorList: [], setSensorList: jest.fn(),
                        procedureId: i, setPopupMessage: jest.fn(), technicianId: 1
                    }
                } >
                    <ManageBatch />
                </AppWrapper>
            )
        })
    }
})

test('generating work order with failure is handled', async () => {
    await act(async () => {
        render(
            <AppWrapper sharedState={
                {
                    batchNumber: 2, sensorList: [], setSensorList: jest.fn(),
                    procedureId: 1, setPopupMessage: jest.fn(), technicianId: 1
                }
            } >
                <ManageBatch />
            </AppWrapper>
        )
    })
    const downloadWorkOrderButton = screen.getByText(/download work order/i)
    fireEvent.click(downloadWorkOrderButton)
    expect(mockAxios.get).toBeCalledWith(`http://${ip}:8000/api/generate-work-order?batch_id=2`)
})

test('generating work order with success returns blob', async () => {
    await act(async () => {
        render(
            <AppWrapper sharedState={
                {
                    batchNumber: 1, sensorList: [], setSensorList: jest.fn(),
                    procedureId: 1, setPopupMessage: jest.fn(), technicianId: 1
                }
            } >
                <ManageBatch />
            </AppWrapper>
        )
    })
    const downloadWorkOrderButton = screen.getByText(/download work order/i)
    fireEvent.click(downloadWorkOrderButton)
    expect(mockAxios.get).toBeCalledWith(`http://${ip}:8000/api/generate-work-order?batch_id=1`)
})