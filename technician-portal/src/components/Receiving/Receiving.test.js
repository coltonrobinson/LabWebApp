/* eslint-disable testing-library/no-unnecessary-act */
import { fireEvent, render, screen } from '@testing-library/react';
import Receiving from './Receiving';
import { AppWrapper } from '../../contexts/app';
import ip from '../../utils/ip/ip';
import mockAxios from 'axios';
import { act } from 'react-dom/test-utils';

jest.mock('axios')

const mockedUseNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
    ...(jest.requireActual('react-router-dom')),
    useNavigate: () => mockedUseNavigate,
}))

beforeEach(() => {
    jest.clearAllMocks()

    mockAxios.get.mockImplementation(url => {
        switch (url) {
            case `http://${ip}:8000/api/create-order/`:
                return Promise.resolve({ data: [{ order_id: 1, customer_order_number: 'test' }] })
            default:
                return Promise.reject();
        }
    });
})

test('Receiving renders successfully', async () => {
    render(
        <AppWrapper sharedState={{
            salesOrder: 1, setSalesOrder: jest.fn(), setOrder: jest.fn()
        }}>
            <Receiving />
        </AppWrapper>
    )
    const submitButton = screen.getByText(/submit/i)
    expect(submitButton).toBeInTheDocument()
})

test('submitting correct number navigates', async () => {
    render(
        <AppWrapper sharedState={{
            salesOrder: 1, setSalesOrder: jest.fn(), setOrder: jest.fn()
        }}>
            <Receiving />
        </AppWrapper>
    )
    const submitButton = screen.getByText(/submit/i)
    const orderBox = screen.getByPlaceholderText(/sales order/i)
    await act(async () => {
        fireEvent.change(orderBox, { target: { value: '1' } })
        fireEvent.click(submitButton)
    })
    expect(orderBox).toHaveValue('1');
    expect(mockedUseNavigate).toBeCalledWith('/createSalesOrder')
})