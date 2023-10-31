/* eslint-disable testing-library/no-unnecessary-act */
import { fireEvent, render, screen } from '@testing-library/react';
import SignInBox from './SignInBox';
import { AppWrapper } from '../../contexts/app';
import mockAxios from 'axios';
import ip from '../../utils/ip/ip';
import { act } from 'react-dom/test-utils';

const mockedUseNavigate = jest.fn()
const mockedUseLocation = jest.fn()

jest.mock('axios')

jest.mock('react-router-dom', () => ({
    ...(jest.requireActual('react-router-dom')),
    useNavigate: () => mockedUseNavigate,
    useLocation: () => mockedUseLocation,
}))

beforeEach(() => {
    jest.clearAllMocks()

    mockAxios.get.mockImplementation(url => {
        switch (url) {
            case `http://${ip}:8000/api/lookup-technician/`:
                return Promise.resolve({ data: [{ technician_id: 1 }] })
            default:
                return Promise.reject();
        }
    });
})

test('SignInBox renders successfully', () => {
    render(
        <AppWrapper sharedState={{
            setTechnicianId: jest.fn(), setPopupMessage: jest.fn(), technicianId: 1
        }}>
            <SignInBox />
        </AppWrapper>
    )
    const signInButton = screen.getByText(/sign in/i)
    expect(signInButton).toBeInTheDocument()
})

test('no technician id routes to sign in', () => {
    render(
        <AppWrapper sharedState={{
            setTechnicianId: jest.fn(), setPopupMessage: jest.fn(), technicianId: null
        }}>
            <SignInBox />
        </AppWrapper>
    )
    expect(mockedUseNavigate).toBeCalledWith('/signIn')
})

test('toggle sign in and out throws no errors', async () => {
    render(
        <AppWrapper sharedState={{
            setTechnicianId: jest.fn(), setPopupMessage: jest.fn(), technicianId: 1
        }}>
            <SignInBox />
        </AppWrapper>
    )
    const signInButton = screen.getByText(/sign in/i)
    fireEvent.click(signInButton)
    const nameField = screen.getByPlaceholderText(/name/i)
    const submitButton = screen.getByText(/submit/i)
    expect(nameField).toBeInTheDocument()
    fireEvent.change(nameField, { target: { value: 'Test' } })
    await act(async () => {
        fireEvent.click(submitButton)
    })
    const signOutButton = screen.getByText(/sign out/i)
    await act(async () => {
        fireEvent.click(signOutButton)
    })
    expect(mockAxios.get).toBeCalledWith("http://127.0.0.1:8000/api/lookup-technician/", {"params": {"technician": "Test"}})
})