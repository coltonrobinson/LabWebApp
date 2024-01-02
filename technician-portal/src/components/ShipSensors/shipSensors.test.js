/* eslint-disable testing-library/no-unnecessary-act */
import { fireEvent, render, screen } from '@testing-library/react';
import ShipSensors from './shipSensors';
import mockAxios from 'axios';
import ip from '../../utils/ip/ip';
import { AppWrapper } from '../../contexts/app';
import { act } from 'react-dom/test-utils';

const mockedUseNavigate = jest.fn()

jest.mock('axios')
jest.mock('react-router-dom', () => ({
    ...(jest.requireActual('react-router-dom')),
    useNavigate: () => mockedUseNavigate,
}))

beforeEach(() => {
    jest.clearAllMocks()

    mockAxios.get.mockImplementation(url => {
        switch (url) {
            case `http://${ip}/api/get-orders-boxed/`:
                return Promise.resolve({ data: [{ order_id: 1, customer_order_number: 'test' }] })
            case `http://${ip}/api/set-order-shipped/`:
                return Promise.resolve({ data: { Result: 'Success' } })
            default:
                return Promise.reject();
        }
    });
})

test('shipSensors renders successfully', async () => {
    await act(async () => {
        render(
            <AppWrapper sharedState={{ setPopupMessage: jest.fn() }}>
                <ShipSensors />
            </AppWrapper>
        )
    })
    const submitButton = screen.getByText(/mark orders as picked up/i)
    expect(submitButton).toBeInTheDocument()
})

test('submit navigates and sets shipped', async () => {
    await act(async () => {
        render(
            <AppWrapper sharedState={{ setPopupMessage: jest.fn() }}>
                <ShipSensors />
            </AppWrapper>
        )
    })
    const submitButton = screen.getByText(/mark orders as picked up/i)
    const nameBox = screen.getByPlaceholderText(/enter your name/i)
    const selectAll = screen.getByText(/select all/i)
    await act(async () => {
        fireEvent.change(nameBox, { target: { value: 'test name' } })
    })
    fireEvent.click(selectAll)
    fireEvent.click(submitButton)
    expect(mockAxios.get).toBeCalledWith('http://127.0.0.1:8000/api/set-order-shipped/', {"params": {"name": "test name", "order_id": 1}})
    expect(mockedUseNavigate).toBeCalledWith('/')
})

test('submit without name sets popup', async () => {
    await act(async () => {
        render(
            <AppWrapper sharedState={{ setPopupMessage: jest.fn() }}>
                <ShipSensors />
            </AppWrapper>
        )
    })
    const submitButton = screen.getByText(/mark orders as picked up/i)
    fireEvent.click(submitButton)
    expect(mockedUseNavigate).toBeCalledTimes(0)
})

test('select all toggles list', async () => {
    await act(async () => {
        render(
            <AppWrapper sharedState={{ setPopupMessage: jest.fn() }}>
                <ShipSensors />
            </AppWrapper>
        )
    })
    const selectAll = screen.getByText(/select all/i)
    fireEvent.click(selectAll)
    fireEvent.click(selectAll)
})

test('select order toggles in list', async () => {
    await act(async () => {
        render(
            <AppWrapper sharedState={{ setPopupMessage: jest.fn() }}>
                <ShipSensors />
            </AppWrapper>
        )
    })
    const selectAll = screen.getByText(/test/i)
    fireEvent.click(selectAll)
    fireEvent.click(selectAll)
})