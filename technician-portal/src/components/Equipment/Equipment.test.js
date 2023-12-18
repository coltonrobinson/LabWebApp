import { render, screen } from '@testing-library/react';
import Equipment from './Equipment';


const mockReadings = {
    "Humidity": 67.17,
    "Temperature": 19.26,
    "stability_data": {
        "humidity": {
            "slope": 0.0005555555555555767,
            "stable": false,
            "average": 67.173,
            "assumed_set_point": 70,
            "standard_deviation": 0.012905492014562779
        },
        "temperature": {
            "slope": 0.0015454995054400916,
            "stable": false,
            "average": 19.271,
            "assumed_set_point": 20,
            "standard_deviation": 0.009128709291752518
        }
    }
}

function renderEquipment(mockReadings) {
    const assetId = 'S000119'
    const description = 'Rotronic HygroClip2 Humidity Reference'
    const openedEquimpent = {current: 'S000119'}

    render(
        <Equipment assetId={assetId} readings={mockReadings} description={description} openedEquipment={openedEquimpent} />
    )
}


test('Equipment renders successfully', () => {
    renderEquipment(mockReadings)
    const assetId = screen.getAllByText(/S000119/i)
    expect(assetId.length).toBeGreaterThan(0)
})

test('readings with humidity displays humidity', () => {
    renderEquipment(mockReadings)
    const slope = screen.getAllByText(/slope:/i)
    expect(slope.length).toEqual(2)
})

test('stable humidity readings show stable', () => {
    mockReadings.stability_data.humidity.stable = true;
    renderEquipment(mockReadings)
    const button = screen.getByRole('button', { name: name => name.startsWith('Temperature: ') });
    expect(button).toHaveClass('stable_green')
})

test('readings without humidity don\'t display humidity', () => {
    delete mockReadings.Humidity;
    delete mockReadings.stability_data.humidity;
    renderEquipment(mockReadings)
    const slope = screen.getAllByText(/slope:/i)
    expect(slope.length).toEqual(1)
})

test('stable temperature readings show stable', () => {
    mockReadings.stability_data.stable = true;
    mockReadings.stability_data.temperature.stable = true;
    renderEquipment(mockReadings)
    const button = screen.getByRole('button', { name: name => name.startsWith('Temperature: ') });
    const stableElement = screen.getByText('Temperature stable');
    expect(stableElement).toBeInTheDocument();
    expect(button).toHaveClass('stable_green')
})

test('non-stable readings show not stable', () => {
    mockReadings.stability_data.stable = false;
    mockReadings.stability_data.temperature.stable = false;
    renderEquipment(mockReadings)
    const notStableElement = screen.getByText('Temperature not stable');
    expect(notStableElement).toBeInTheDocument();
    
})