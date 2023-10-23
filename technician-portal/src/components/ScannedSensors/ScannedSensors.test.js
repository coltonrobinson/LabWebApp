import { render, screen } from '@testing-library/react';
import ScannedSensors from './ScannedSensors';

test('ScannedSensors renders successfully with no sensors', () => {
    render(<ScannedSensors sensorList={[]} />)
    const sensors = screen.getByText(/No sensors scanned/i)
    expect(sensors).toBeInTheDocument()
})

test('ScannedSensors renders successfully with sensors', () => {
    render(<ScannedSensors sensorList={[{sensor: 12345, online: false}]} />)

    const sensors = screen.getByText(/12345/i)
    expect(sensors).toBeInTheDocument()
})

test('ScannedSensors shows red when sensor is offline', () => {
    render(<ScannedSensors sensorList={[{sensor: 12345, online: false}]} />)

    const sensors = screen.getByText(/12345/i)
    expect(sensors).toHaveClass('red_sensor')
})

test('ScannedSensors shows green when sensor is online', () => {
    render(<ScannedSensors sensorList={[{sensor: 12345, online: true}]} />)

    const sensors = screen.getByText(/12345/i)
    expect(sensors).toHaveClass('green_sensor')
})