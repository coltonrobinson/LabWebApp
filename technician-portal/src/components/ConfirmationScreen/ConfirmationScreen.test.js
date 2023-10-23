import { fireEvent, render, screen } from '@testing-library/react';
import ConfirmationScreen from './ConfirmationScreen';
import { AppWrapper } from '../../contexts/app';

const mockedUseNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
    ...(jest.requireActual('react-router-dom')),
    useNavigate: () => mockedUseNavigate,
  }))

test('ConfirmationScreen renders successfully', () => {
    render(
        <AppWrapper sharedState={{confirmationMessage: 'testing'}}>
            <ConfirmationScreen />
        </AppWrapper>
    )
    const messageElement = screen.getByText('testing')
    expect(messageElement).toBeInTheDocument()
})

test('Menu button navigates to index', () => {
    render(
        <AppWrapper sharedState={{confirmationMessage: 'testing'}}>
            <ConfirmationScreen />
        </AppWrapper>
    )
    const menuButton = screen.getByText('Return to Main Menu')
    expect(menuButton).toBeInTheDocument()
    fireEvent.click(menuButton)
    expect(mockedUseNavigate).toBeCalledWith('/')
})