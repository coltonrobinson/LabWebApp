import { fireEvent, render, screen } from '@testing-library/react';
import ErrorMessage from './ErrorMessage';
import { AppWrapper } from '../../contexts/app';

window.scroll = jest.fn()

test('ErrorMessage renders successfully', () => {
    const mockSetPopupMessage = jest.fn()
    render(
        <AppWrapper sharedState={{ popupMessage: 'test', setPopupMessage: mockSetPopupMessage }}>
            <ErrorMessage />
        </AppWrapper>
    )

    const messageText = screen.getByText('test')
    const closeButton = screen.getByText(/close/i)
    expect(messageText).toBeInTheDocument()
    expect(closeButton).toBeInTheDocument()
    fireEvent.click(closeButton)
    expect(mockSetPopupMessage).toBeCalledWith('')
})