import { render, screen } from '@testing-library/react';
import DropDown from './DropDown';
import { AppWrapper } from '../../contexts/app';
import mockAxios from 'axios';
import ip from '../../utils/ip/ip';
import userEvent from '@testing-library/user-event';

jest.mock('axios')

beforeEach(() => {
    jest.clearAllMocks()

    mockAxios.get.mockImplementation(url => {
        switch (url) {
            case `https://${ip}/api/create-batch/`:
                return Promise.resolve({ data: [{ batch_id: 1 }] })
            case `https://${ip}/api/log-batch-interaction/`:
                return Promise.resolve()
            default:
                return Promise.reject()
        }
    });
})

test('DropDown renders successfully', () => {
    render(
        <AppWrapper sharedState={{ technicianId: 1, setPopupMessage: jest.fn() }}>
            <DropDown
                options={[{ "calibration_procedure_id": 1, "calibration_procedure": "Testing procedure 1" }, { "calibration_procedure_id": 2, "calibration_procedure": "Testing procedure 2" }]}
                setSelectedOption={jest.fn()}
                batches={[]}
                setBatches={jest.fn()}
            />
        </AppWrapper>
    )
    const dropDown = screen.getByRole('combobox')
    expect(dropDown).toBeInTheDocument()
})

it('should create batch when an option is selected', () => {
    const mockSetSelectedOption = jest.fn()
    render(
        <AppWrapper sharedState={{ technicianId: 1, setPopupMessage: jest.fn() }}>
            <DropDown
                options={[{ "calibration_procedure_id": 1, "calibration_procedure": "Testing procedure 1" }, { "calibration_procedure_id": 2, "calibration_procedure": "Testing procedure 2" }]}
                setSelectedOption={mockSetSelectedOption}
                batches={[]}
                setBatches={jest.fn()}
            />
        </AppWrapper>
    )
    const procedure1 = screen.getByText(/testing procedure 1/i)
    const dropDown = screen.getByRole('combobox')
    userEvent.selectOptions(dropDown, procedure1)
    expect(mockSetSelectedOption).toBeCalled()
})

it('should set popup when technician id is not present', () => {
    const mockSetPopup = jest.fn()
    render(
        <AppWrapper sharedState={{ technicianId: null, setPopupMessage: mockSetPopup }}>
            <DropDown
                options={[{ "calibration_procedure_id": 1, "calibration_procedure": "Testing procedure 1" }, { "calibration_procedure_id": 2, "calibration_procedure": "Testing procedure 2" }]}
                setSelectedOption={jest.fn()}
                batches={[]}
                setBatches={jest.fn()}
            />
        </AppWrapper>
    )
    const procedure1 = screen.getByText(/testing procedure 1/i)
    const dropDown = screen.getByRole('combobox')
    userEvent.selectOptions(dropDown, procedure1)
    expect(mockSetPopup).toBeCalled()
})