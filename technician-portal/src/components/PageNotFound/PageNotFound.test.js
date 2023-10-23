import { render, screen } from '@testing-library/react';
import PageNotFound from './PageNotFound';

test('PageNotFound renders successfully', () => {
    render(<PageNotFound />)
    const message = screen.getByText(/404: Oops/i)
    expect(message).toBeInTheDocument()
})