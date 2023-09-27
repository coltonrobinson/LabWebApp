const express = require('express');
const { BlobServiceClient } = require("@azure/storage-blob");
const { Pool } = require('pg');
const cors = require('cors');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const QRCode = require('qrcode');
const fetch = require('node-fetch');
require('dotenv').config()

const azureConnectionString = process.env.AZURE_CONNECTION_STRING;
const monnitSecretKey = process.env.IMONNIT_API_SECRET_KEY_ID;
const monnitKey = process.env.IMONNIT_API_KEY_ID;
const headers = {
    'APIKeyID': monnitKey,
    'APISecretKey': monnitSecretKey,
};

let ip;
let databaseConnection;
if (process.env.STATUS === 'production') {
    ip = process.env.PROD_IP;
    databaseConnection = process.env.PROD_DB_CONNECTION;
} else {
    ip = process.env.DEV_IP;
    databaseConnection = process.env.DEV_DB_CONNECTION;
};

const pool = new Pool(JSON.parse(databaseConnection))
const rollingDataPool = new Pool(JSON.parse(process.env.ROLLING_DATA_CONNECTION))

// Check database connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error connecting to database', err.stack);
    }
    console.log('Connected to database!');
    release();
})
const app = express();
const port = 8000;
app.locals.pool = pool;
app.use(cors());

app.listen(port, ip, () => {
    console.log(`Server running at http://${ip}:${port}/`);
});

app.get('/api/get-recent-data', (req, res) => {
    rollingDataPool.query('SELECT * FROM rolling_data ORDER BY timestamp DESC LIMIT 1', (err, result) => {
        if (err) {
            return res.status(500).json({ error: `Error executing query: ${err}` });
        }
        const data = result.rows;
        res.json(data);
    })
});

app.get('/api/get-calibrations-by-month', (req, res) => {
    const startDate = new Date(req.query.start_date);
    let endDate = new Date(startDate.getTime());
    endDate = new Date(endDate.setMonth(endDate.getMonth() + 1));

    pool.query(`SELECT * FROM api_order
                INNER JOIN api_batch
                ON api_order.order_id = api_batch.order_id
                INNER JOIN api_sensor
                ON api_batch.batch_id = api_sensor.batch_id
                WHERE received_timestamp > $1
                AND received_timestamp < $2
                AND api_sensor.certificate_id IS NOT NULL`, [startDate, endDate], (err, result) => {
        if (err) {
            return res.status(500).json({ error: `Error executing query: ${err}` });
        }
        const data = result.rows;
        res.json(data);
    })
});

app.get('/api/get-online-sensors', (req, res) => {
    const url = `https://www.imonnit.com/json/SensorListFull/`;
    const parseDate = (date) => {
        const strippedDate = date.replace('/Date(', '').replace(')/', '');
        return new Date(parseInt(strippedDate));
    }
    const parseLastCheckIn = (lastCommunication, minutes = 5) => {
        if (Math.abs(new Date().getTime() - lastCommunication.getTime()) < minutes * 60000) {
            return true;
        }
        return false;
    }

    fetch(`${url}`, {
        headers: headers,
    })
        .then(response => response.json())
        .then(data => {
            sensorList = []
            for (const sensor of data.Result) {
                const lastCheckIn = parseDate(sensor.LastCommunicationDate)
                if (parseLastCheckIn(lastCheckIn)) {
                    sensorList.push(sensor.SensorID)
                }
            }
            res.json(sensorList)
        })
});

app.get('/api/get-bulk-data', (req, res) => {
    let minutes = req.query.minutes;
    if (!minutes) {
        minutes = '10';
    }
    const start = new Date(Date.now() - minutes * 60000);

    rollingDataPool.query('SELECT * FROM rolling_data WHERE timestamp >= $1 ORDER BY timestamp DESC', [start], (err, result) => {
        if (err) {
            return res.status(500).json({ error: `Error executing query: ${err}` });
        }
        const data = result.rows;
        res.json(data);
    })
});


app.get('/api/get-last-humidity-stable-reading', (req, res) => {
    let type = req.query.type;
    let minutes = req.query.minutes;
    let reference = req.query.reference;
    let setPoint = req.query.set_point;
    if (!type) {
        type = 'humidity'
    }
    if (!minutes) {
        minutes = 180;
    }
    if (!reference) {
        reference = 'S000113';
    }
    if (setPoint) {
        setPoint = parseInt(setPoint);
    }
    const start = new Date(Date.now() - minutes * 60000);

    rollingDataPool.query(`SELECT rotronic_data, timestamp FROM rolling_data WHERE timestamp >= $1 ORDER BY timestamp DESC`, [start], (err, result) => {
        if (err) {
            return res.status(500).json({ error: `Error executing query: ${err}` });
        }
        let data = [];
        for (const row of result.rows) {
            if (row.rotronic_data[reference]) {
                data.push([row.rotronic_data[reference]['stability_data'][type], row['timestamp']])
            }
        }
        for (const row of data) {
            if (row[0].stable) {
                if (setPoint) {
                    if (row[0].assumed_set_point === setPoint) {
                        res.json(row);
                        return;
                    }
                } else {
                    res.json(row);
                    return;
                }
            }
        }
        res.json({ 'Result': `Unable to find stable data for set point ${setPoint}` });
    })
});


app.get('/api/get-last-temperature-stable-reading', (req, res) => {
    let minutes = req.query.minutes;
    let reference = req.query.reference;
    let setPoint = req.query.set_point;
    let stabilityCriteria = JSON.parse(req.query.stability_criteria)
    if (!minutes) {
        minutes = 180;
    }
    if (setPoint) {
        setPoint = parseInt(setPoint);
    }
    const start = new Date(Date.now() - minutes * 60000);
    rollingDataPool.query(`SELECT super_daq_data, timestamp FROM rolling_data WHERE timestamp >= $1 ORDER BY timestamp DESC`, [start], (err, result) => {
        if (err) {
            return res.status(500).json({ error: `Error executing query: ${err}` });
        }
        for (const row of result.rows) {
            if (row.super_daq_data) {
                const stabilityData = row.super_daq_data[reference].stability_data;
                if (stabilityData.slope < stabilityCriteria.slope && stabilityData.standard_deviation < stabilityCriteria.standardDeviation && Math.abs(stabilityData.assumed_set_point - stabilityData.average) < stabilityCriteria.difference && stabilityData.assumed_set_point === setPoint) {
                    res.json([stabilityData, row.timestamp]);
                    return;
                }
            }
        }
        res.json({ 'Result': `Unable to find stable data for set point ${setPoint}` });
    })
});


app.get('/api/get-humidity-reading-range', (req, res) => {
    let seconds = req.query.seconds;
    let timestamp = req.query.timestamp;

    if (!seconds) {
        seconds = 30;
    }
    if (timestamp) {
        timestamp = new Date(timestamp).getTime();
    }
    const start = new Date(timestamp - (seconds * 1000));
    const end = new Date(start.getTime() - (seconds * 1000));

    rollingDataPool.query(`SELECT timestamp, devices_under_test, rotronic_data FROM rolling_data WHERE timestamp BETWEEN $1 AND $2 ORDER BY timestamp DESC`, [end, start], (err, result) => {
        if (err) {
            return res.status(500).json({ error: `Error executing query: ${err}` });
        }
        const data = result.rows;
        res.json(data);
    })
});


app.get('/api/get-temperature-reading-range', (req, res) => {
    let seconds = req.query.seconds;
    let timestamp = req.query.timestamp;

    if (!seconds) {
        seconds = 30;
    }
    if (timestamp) {
        timestamp = new Date(timestamp).getTime();
    }
    const start = new Date(timestamp - (seconds * 1000));
    const end = new Date(start.getTime() - (seconds * 1000));

    rollingDataPool.query(`SELECT timestamp, devices_under_test, super_daq_data FROM rolling_data WHERE timestamp BETWEEN $1 AND $2 ORDER BY timestamp DESC`, [end, start], (err, result) => {
        if (err) {
            return res.status(500).json({ error: `Error executing query: ${err}` });
        }
        const data = result.rows;
        res.json(data);
    })
});


app.get('/api/get-order-by-id', (req, res) => {
    const orderId = req.query.order_id;

    pool.query('SELECT * FROM api_order WHERE order_id = $1', [orderId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: `Error executing query: ${err}` });
        }
        const orders = result.rows;
        res.json(orders[0]);
    })
});


app.get('/api/get-orders-to-ship', (req, res) => {
    pool.query(`
        SELECT api_order.order_id, api_order.customer_order_number
        FROM api_order
        WHERE api_order.active = true
        AND NOT EXISTS (
            SELECT 1
            FROM api_batch
            WHERE api_batch.order_id = api_order.order_id
            AND api_batch.active = true
        )
    `, (err, result) => {
        if (err) {
            return res.status(500).json({ error: `Error executing query: ${err}` });
        }
        const orders = result.rows;
        res.json(orders);
    });
});

app.get('/api/get-batch-by-id', (req, res) => {
    const batchId = req.query.batch_id;

    pool.query('SELECT * FROM api_batch WHERE batch_id = $1', [batchId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: `Error executing query: ${err}` });
        }
        const batches = result.rows;
        res.json(batches[0]);
    })
});

app.get('/api/get-batches-by-order-id', (req, res) => {
    const orderId = req.query.order_id;

    pool.query(`SELECT * FROM api_order INNER JOIN api_batch ON api_order.order_id = $1 WHERE api_batch.order_id = $1;`, [orderId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: `Error executing query: ${err}` });
        }
        const batches = result.rows;
        res.json(batches);
    })
});

app.get('/api/get-batches', (req, res) => {
    pool.query('SELECT * FROM api_batch ORDER BY batch_id', (err, result) => {
        if (err) {
            return res.status(500).json({ error: `Error executing query: ${err}` });
        }
        const batches = result.rows;
        res.json(batches);
    })
});

app.get('/api/get-batches-by-active-state', (req, res) => {
    const active = req.query.active;

    pool.query('SELECT * FROM api_batch INNER JOIN api_order ON api_batch.order_id = api_order.order_id WHERE api_batch.active=$1 ORDER BY batch_id DESC', [active], (err, result) => {
        if (err) {
            return res.status(500).json({ error: `Error executing query: ${err}` });
        }
        let batches = result.rows;
        let count = 0;

        function querySensors(batch) {
            pool.query('SELECT * FROM api_batch INNER JOIN api_sensor ON api_batch.batch_id = api_sensor.batch_id WHERE api_batch.batch_id = $1', [batch.batch_id], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: `Error executing sensor query: ${err}` });
                }
                batch.sensors = result.rows;
                count++;

                if (count === batches.length) {
                    res.json(batches);
                }
            });
        }
        for (const batch of batches) {
            querySensors(batch);
        }
    });
});


    app.get('/api/get-sensors', (req, res) => {
        const batchId = req.query.batch_id;
        let query;

        if (!batchId) {
            query = 'SELECT * FROM api_sensor'
        } else {
            query = `SELECT * FROM api_sensor WHERE batch_id = ${batchId}`
        }
        pool.query(query, (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const batches = result.rows;
            res.json(batches);
        })
    });

    app.get('/api/get-readings', (req, res) => {
        const sensors = req.query.sensors;
        const sensorIds = sensors.split(',').map(sensor => parseInt(sensor.trim()));

        pool.query('SELECT * FROM api_reading WHERE sensor_id = ANY($1::int[]) AND timestamp IS NOT NULL ORDER BY timestamp DESC', [sensorIds], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const readings = result.rows;
            res.json(readings);
        })
    });

    app.get('/api/get-readings-by-sensor-id', (req, res) => {
        const sensorId = req.query.sensor_id;

        pool.query('SELECT * FROM api_reading WHERE sensor_id = $1 ORDER BY reading_id DESC', [sensorId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const readings = result.rows;
            res.json(readings);
        })
    });

    app.get('/api/get-customer-by-id', (req, res) => {
        const customerId = req.query.customer_id;

        pool.query('SELECT * FROM api_customer WHERE customer_id = $1', [customerId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const customers = result.rows;
            res.json(customers[0]);
        })
    });

    app.get('/api/get-equipment', (req, res) => {
        pool.query('SELECT * FROM api_equipment', (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const equipment = result.rows;
            res.json(equipment);
        })
    });

    app.get('/api/get-calibration-procedures', (req, res) => {
        pool.query('SELECT * FROM api_calibration_procedure', (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const procedures = result.rows;
            res.json(procedures);
        })
    });

    app.get('/api/lookup-technician', (req, res) => {
        let technicianQuery = req.query.technician;
        let first_name;
        let last_name;
        if (technicianQuery) {
            try {
                technicianName = technicianQuery.toLowerCase().split(' ');
                first_name = technicianName[0];
                last_name = technicianName[1];
            } catch (error) {
                console.error(error);
            }
        }

        pool.query('SELECT * FROM api_technician', (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const technicians = result.rows;
            let response = [{ 'technician_id': null }]
            for (const technician of technicians) {
                if (technician['first_name'].toLowerCase() === first_name && technician['last_name'].toLowerCase() === last_name) {
                    response = [technician];
                    break;
                }
            }
            res.json(response);
        })
    });

    app.get('/api/create-order', (req, res) => {
        let timestamp = req.query.received_timestamp;
        let customerOrderNumber = req.query.customer_order_number;
        let customerId = req.query.customer_id;

        if (!timestamp) {
            timestamp = new Date().toISOString();
        }
        if (!customerId) {
            customerId = 1;
        }

        pool.query("INSERT INTO api_order (received_timestamp, customer_order_number, customer_id) VALUES ($1, $2, $3) RETURNING *", [timestamp, customerOrderNumber, customerId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const order = result.rows;
            res.json(order);
        })
    });

    app.get('/api/create-batch', (req, res) => {
        let currentLocation = req.query.current_location;
        let orderId = req.query.order_id;
        let calibrationProcedureId = req.query.calibration_procedure_id;
        let receivingTechnicianId = req.query.receiving_technician_id;
        let testingTechnicianId = req.query.testing_technician_id;
        let shippingTechnicianId = req.query.shipping_technician_id;

        pool.query("INSERT INTO api_batch (current_location, order_id, calibration_procedure_id, receiving_technician_id, testing_technician_id, shipping_technician_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [currentLocation, orderId, calibrationProcedureId, receivingTechnicianId, testingTechnicianId, shippingTechnicianId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const batch = result.rows;
            res.json(batch);
        })
    });

    app.get('/api/create-reading', (req, res) => {
        let type = req.query.type;
        let setPoint = req.query.set_point;
        let referenceReading = req.query.reference_reading;
        let sensorReading = req.query.sensor_reading;
        let labRh = req.query.lab_rh;
        let labTemperature = req.query.lab_temperature;
        let sensorId = req.query.sensor_id;
        let generatorId = req.query.generator_id;
        let referenceId = req.query.reference_id;
        let uncertainty = req.query.uncertainty;
        let tolerance = req.query.tolerance;
        let pass = false;

        myList = [type, setPoint, referenceReading, sensorReading, labRh, labTemperature, sensorId, generatorId, referenceId, uncertainty, tolerance, pass]

        if (Math.abs(referenceReading - sensorReading) < tolerance) {
            pass = true;
        }
        if (!sensorReading) {
            sensorReading = null;
        }
        pool.query("INSERT INTO api_reading (type, set_point, reference_reading, sensor_reading, lab_rh, lab_temperature, sensor_id, generator_id, reference_id, uncertainty, tolerance, pass) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *", [type, setPoint, referenceReading, sensorReading, labRh, labTemperature, sensorId, generatorId, referenceId, uncertainty, tolerance, pass], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const reading = result.rows;
            res.json(reading);
        })
    });


    app.get('/api/set-batch-active-state', (req, res) => {
        const batchId = req.query.batch_id;
        const activeState = req.query.active_state;

        pool.query("UPDATE api_batch SET active = $1 WHERE batch_id = $2", [activeState, batchId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            return res.json({ 'Result': `Batch ${batchId} active state set to ${activeState}` })
        })
    });


    app.get('/api/remove-batch-location', (req, res) => {
        const batchId = req.query.batch_id;

        pool.query("UPDATE api_batch SET current_location = $1 WHERE batch_id = $2", [null, batchId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            return res.json({ 'Result': `Batch ${batchId} location removed` });
        })
    });


    app.get('/api/set-order-active-state', (req, res) => {
        const orderId = req.query.order_id;
        const activeState = req.query.active_state;

        pool.query("UPDATE api_order SET active = $1 WHERE order_id = $2", [activeState, orderId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            return res.json({ 'Result': `Order ${orderId} active state set to ${activeState}` })
        })
    });

    app.get('/api/create-location-log', (req, res) => {
        let location = req.query.location;
        let batchId = req.query.batch_id;
        let timestamp = req.query.timestamp;

        if (!timestamp) {
            timestamp = new Date().toISOString()
        }

        pool.query("UPDATE api_batch SET current_location = $1 WHERE batch_id = $2", [location, batchId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
        })

        pool.query("INSERT INTO api_location_log (location, timestamp, batch_id) VALUES ($1, $2, $3) RETURNING *", [location, timestamp, batchId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const locationLog = result.rows;
            res.json(locationLog);
        })
    });

    app.get('/api/calibrate-sensor', (req, res) => {
        let sensorId = req.query.sensor_id;
        let currentReading = req.query.current_reading;
        let targetReading = req.query.target_reading;
        let url = `https://www.imonnit.com/json/SensorGetCalibration/`;
        let parameters = {
            'SensorID': sensorId,
        };

        const params = new URLSearchParams();
        for (const parameter in parameters) {
            params.append(parameter, parameters[parameter]);
        };

        fetch(`${url}?${params.toString()}`, {
            headers: headers,
        })
            .then(response => response.json())
            .then(result => {
                const currentCalibration = result.Result.Calibration1 / 10;
                const offset = (((targetReading - currentReading) + currentCalibration) * 10).toFixed(0)
                url = `https://www.imonnit.com/json/SensorSetCalibration/`;
                parameters = {
                    'SensorID': sensorId,
                    'Calibration1': offset,
                }
                const params = new URLSearchParams();
                for (const parameter in parameters) {
                    params.append(parameter, parameters[parameter]);
                };

                fetch(`${url}?${params.toString()}`, {
                    headers: headers,
                })
                    .then(response => {
                        if (response['status'] === 200) {
                            return response;
                        } else {
                            console.error('Status code: ', response['status'], response['statusText']);
                            return response['status'];
                        };
                    })
                    .then(response => response.json())
                    .then(result =>
                        res.json(result))
                    .catch(error => {
                        console.error(error);
                    });
            })
            .catch(error => {
                console.error(error);
            });
    });


    app.get('/api/create-sensor', (req, res) => {
        let sensorId = req.query.sensor_id;
        let checkDigit = req.query.check_digit;
        let batchId = req.query.batch_id;
        let sku;
        const manufacturer = 'Monnit Corporation';
        let url = `https://www.imonnit.com/json/AssignSensor/`;
        const parameters = {
            'NetworkID': 94464,
            'SensorID': sensorId,
            'CheckDigit': checkDigit,
            'reportInterval': 1,
            'activeStateInterval': 1,
        };
        const params = new URLSearchParams();
        for (const parameter in parameters) {
            params.append(parameter, parameters[parameter]);
        };


        fetch(`${url}?${params.toString()}`, {
            headers: headers,
        })
            .then(response => response.json())
            .then(response => {
                if (response['Result'] === 'Success') {
                    url = 'https://www.imonnit.com/json/SensorSetHeartbeat/'
                    fetch(`${url}?${params.toString()}`, {
                        headers: headers,
                    })
                        .then(response => response.json())
                        .then(response => {
                            if (response['Result'] === 'Success') {
                                url = 'https://www.imonnit.com/json/LookUpSensor/'
                                fetch(`${url}?${params.toString()}`, {
                                    headers: headers,
                                })
                                    .then(response => {
                                        if (response['status'] === 200) {
                                            return response.json();
                                        } else {
                                            res.json({ 'Result': 'Failed: Could not find sensor' });
                                        };
                                    })
                                    .then(response => {
                                        sku = response['Result']['SKU'];
                                        pool.query("INSERT INTO api_sensor (sensor_id, check_digit, manufacturer, sku, batch_id) VALUES ($1, $2, $3, $4, $5) RETURNING *", [sensorId, checkDigit, manufacturer, sku, batchId], (err, result) => {
                                            if (err) {
                                                pool.query("UPDATE api_sensor SET batch_id = $1 WHERE sensor_id = $2 RETURNING *", [batchId, sensorId], (err, result) => {
                                                    if (err) {
                                                        return res.status(500).json({ error: `Error executing query: ${err}` });
                                                    }
                                                    const sensor = result.rows;
                                                    res.json(sensor);
                                                });
                                            } else {
                                                const sensor = result.rows;
                                                res.json(sensor);
                                            }
                                        })
                                    })
                                    .catch(error => {
                                        console.error(error);
                                    });
                            } else {
                                res.json({ 'Result': 'Failed: Could not set heartbeat' });
                            };
                        })
                        .catch(error => {
                            console.error(error);
                        });
                } else {
                    res.json({ 'Result': 'Failed: unable to add to iMonnit' });
                };
            })
            .catch(error => {
                res.json({ 'Result': `Could not create sensor: ${error}` });
            });
    });


    app.get('/api/change-sensor-heartbeat', async (req, res) => {
        let sensorId = req.query.sensor_id;
        let reportInterval = req.query.heartbeat;

        let url = `https://www.imonnit.com/json/SensorSetHeartbeat/`;
        const parameters = {
            'SensorID': sensorId,
            'reportInterval': reportInterval,
            'activeStateInterval': reportInterval,
        };
        const params = new URLSearchParams();
        for (const parameter in parameters) {
            params.append(parameter, parameters[parameter]);
        };

        try {
            const response = await fetch(`${url}?${params.toString()}`, { headers: headers, });

            if (response['Result'] === 'Success') {
                res.json(response);
            } else {
                res.json({ 'Result': `Failed: ${response.json()}` });
            }
        } catch (error) {
            console.error(error);
            res.json({ 'Result': error });
        }
    });

    app.get('/api/get-certificates-by-order-id', (req, res) => {
        const orderId = req.query.order_id;
        pool.query(`SELECT * FROM api_order
                INNER JOIN api_batch
                ON api_batch.order_id = api_order.order_id
                INNER JOIN api_sensor
                ON api_sensor.batch_id = api_batch.batch_id
                INNER JOIN api_certificate
                ON api_certificate.certificate_id = api_sensor.certificate_id
                WHERE api_order.order_id = $1`, [orderId], (err, result) => {

            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const certificates = result.rows;
            res.json(certificates);
        })
    })

    app.get('/api/get-sensors-by-order-id', async (req, res) => {
        try {
            const orderId = req.query.order_id;
            let sensorSet = new Set();
            let seenSensorIds = new Set();
            const batchesResult = await pool.query(
                `SELECT * FROM api_order INNER JOIN api_batch ON api_order.order_id = $1 WHERE api_batch.order_id = $1;`,
                [orderId]
            );

            const batches = batchesResult.rows;

            for (const batch of batches) {
                const sensorsResult = await pool.query(
                    `SELECT * FROM api_batch INNER JOIN api_sensor ON api_batch.batch_id = $1 WHERE api_sensor.batch_id = $1;`,
                    [batch.batch_id]
                );

                const sensors = sensorsResult.rows;
                for (const sensor of sensors) {
                    if (!seenSensorIds.has(sensor.sensor_id)) {
                        seenSensorIds.add(sensor.sensor_id);
                        sensorSet.add(sensor);
                    }
                }
            }

            const sensorList = Array.from(sensorSet);
            res.json(sensorList);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: `Error executing query: ${err}` });
        }
    });

    app.get('/api/get-sensors-by-batch-id', (req, res) => {
        const batchId = req.query.batch_id;

        pool.query(`SELECT * FROM api_batch
                INNER JOIN api_sensor
                ON api_batch.batch_id = api_sensor.batch_id
                WHERE api_batch.batch_id = $1`, [batchId], (err, result) => {

            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const sensors = result.rows;
            res.json(sensors);
        })
    })

    app.get('/api/remove-sensor', (req, res) => {
        const sensorId = req.query.sensor_id;
        const checkDigit = req.query.check_digit

        let url = 'https://www.imonnit.com/json/SensorSetHeartbeat/'
        const parameters = {
            'NetworkID': 94464,
            'SensorID': sensorId,
            'CheckDigit': checkDigit,
            'reportInterval': 120,
            'activeStateInterval': 120,
        };

        const params = new URLSearchParams();
        for (const parameter in parameters) {
            params.append(parameter, parameters[parameter]);
        };

        fetch(`${url}?${params.toString()}`, {
            headers: headers,
        })
            .then(response => response.json())
            .then(() => {
                url = `https://www.imonnit.com/json/RemoveSensor/`;

                fetch(`${url}?${params.toString()}`, {
                    headers: headers,
                })
                    .then(response => {
                        if (response['status'] === 200) {
                            return response;
                        } else {
                            console.error('Status code: ', response['status'], response['statusText']);
                            return response['status'];
                        };
                    })
                    .then(response => response.json())
                    .then(result =>
                        res.json(result))
                    .catch(error => {
                        console.error(error);
                    });
            })
            .catch(error => {
                console.error(error);
            });
    });


    app.get('/api/print-certificate-labels', async (req, res) => {
        const calibrationDate = req.query.calibration_date;
        const dueDate = req.query.due_date;
        const certificateNumber = req.query.certificate_number;
        if (process.env.STATUS === 'development') {
            res.json({ 'Result': `Failed: print disabled in test environment` });
            return;
        }
        let url = `http://192.168.1.79:8000/print-label/`;

        fetch(`${url}?calibration_date=${calibrationDate}&due_date=${dueDate}&certificate_number=${certificateNumber}`)
            .then(response => {
                res.json({ 'Result': JSON.stringify(response) })
            })
            .catch(error => {
                res.json({ 'Result': `Failed: ${error}` })
            })
    });


    app.get('/api/print-pdf', async (req, res) => {
        const pdfBytes = req.query.pdf_bytes;

        let url = `http://192.168.1.79:8000/print-pdf/`;

        fetch(`${url}`, {
            data: pdfBytes
        })
            .then(response => {
                res.json({ 'Result': JSON.stringify(response) })
            })
    });


    app.get('/api/create-certificate', (req, res) => {
        const certificateJson = req.query.certificate_json;
        const sensorId = req.query.sensor_id;
        const template = req.query.template;
        const dueDate = req.query.due_date;
        const calibrationDate = req.query.calibration_date;

        pool.query("INSERT INTO api_certificate (generate_certificate_json, template) values ($1, $2) RETURNING *", [certificateJson, template], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const certificate = result.rows[0];
            pool.query("UPDATE api_sensor SET certificate_id = $1 WHERE sensor_id = $2 RETURNING *", [certificate.certificate_id, sensorId], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: `Error executing query: ${err}` });
                }
                let url = `https://www.imonnit.com/json/CalibrationCertificateCreate/`;
                const parameters = {
                    'SensorID': sensorId,
                    'DateCertified': calibrationDate,
                    'CertificationExpirationDate': dueDate,
                    'CalibrationFacilityID': 5,
                    'CalibrationNumber': `MNT-${certificate.certificate_id}`,
                };
                const params = new URLSearchParams();
                for (const parameter in parameters) {
                    params.append(parameter, parameters[parameter]);
                };


                fetch(`${url}?${params.toString()}`, {
                    headers: headers,
                })
                    .then(response => {
                        if (response['status'] === 200) {
                            res.json(certificate);
                        } else {
                            console.error('Status code: ', response['status'], response['statusText']);
                            res.json({ 'Result': 'Failed: unable to add to iMonnit' })
                        };
                    })
                    .catch(error => {
                        console.error(error);
                    });

            })
        })
    });


    app.get('/api/log-batch-interaction', (req, res) => {
        const department = req.query.department;
        const start = req.query.start;
        const technicianId = req.query.technician_id;
        const batchId = req.query.batch_id;

        const timestamp = new Date();
        const status = (start === 'true' || start === true) ? 'start' : 'end';
        const column1 = `${department}_${status}`;
        const column2 = `${department}_${status}_technician_id`;

        pool.query(`SELECT * FROM api_interaction_log WHERE batch_id = $1`, [batchId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            let query;

            if (result.rows[0]) {
                query = `UPDATE api_interaction_log SET ${column1} = $1, ${column2} = $2 WHERE batch_id = $3 RETURNING *`;
            } else {
                query = `INSERT INTO api_interaction_log (${column1}, ${column2}, batch_id) values ($1, $2, $3) RETURNING *`;
            }

            pool.query(query, [timestamp, technicianId, batchId], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: `Error executing query: ${err}` });
                }
                res.json(result.rows);
            })
        })
    });


    app.get('/api/update-batch-technician', (req, res) => {
        let department = req.query.department;
        let technicianId = req.query.technician_id;
        let batchId = req.query.batch_id;

        const query = `UPDATE api_batch SET ${department}_technician_id = $1 WHERE batch_id = $2 RETURNING *`

        pool.query(query, [technicianId, batchId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const updatedBatch = result.rows;
            res.json(updatedBatch);
        })
    });


    app.get('/api/update-certificate-json', (req, res) => {
        let certificateId = req.query.certificate_id;
        let certificateJson = req.query.certificate_json;

        pool.query("UPDATE api_certificate SET generate_certificate_json = $1 WHERE certificate_id = $2 RETURNING *", [certificateJson, certificateId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const certificate = result.rows;
            res.json(certificate);
        })
    });

    app.get('/api/generate-certificate', async (req, res) => {
        const certificateId = req.query.certificate_id;
        const upload = req.query.upload;

        pool.query("SELECT * FROM api_certificate WHERE certificate_id = $1", [certificateId], async (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const certificate = result.rows[0];
            const certificateJson = { ...{ 'CertNumber': `MNT-${certificate.certificate_id}` }, ...certificate.generate_certificate_json };

            try {
                const bytes = await fillCertificate(certificate.template, certificateJson);
                if (upload && process.env.STATUS === 'production') {
                    uploadPdfToAzure(bytes, `MNT-${certificate.certificate_id}.pdf`)
                        .catch((error) => {
                            console.error("Error uploading PDF:", error);
                            res.status(500).json({ error: "Error uploading PDF" })
                        });
                }
                res.setHeader("Content-Disposition", `attachment; filename=MNT-${certificateId}.pdf`);
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(Buffer.from(bytes));
            } catch (error) {
                console.error("Error occurred:", error);
                res.status(500).json({ error: "An error occurred while processing the PDF." });
            }
        });
    });


    app.get('/api/generate-return-record', async (req, res) => {
        const orderId = req.query.order_id;
        const today = new Date()
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        const seconds = String(today.getSeconds()).padStart(2, '0');


        pool.query(`SELECT api_order.customer_order_number, api_batch.calibration_procedure_id, api_technician.first_name, api_technician.last_name, api_sensor.*, api_certificate.generate_certificate_json, api_customer.*
                FROM api_order
                JOIN api_customer ON api_order.customer_id = api_customer.customer_id
                JOIN api_batch ON api_order.order_id = api_batch.order_id
                JOIN api_sensor ON api_sensor.batch_id = api_batch.batch_id 
                JOIN api_certificate ON api_sensor.certificate_id = api_certificate.certificate_id
                JOIN api_technician ON api_batch.shipping_technician_id = api_technician.technician_id
                WHERE api_order.order_id = $1;`, [orderId], async (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }

            let data;

            if (!result.rows[0]) {
                console.error('Unable to find data');
                res.json({ 'Result': 'Unable to find data' })
            } else {
                data = result.rows[0];

                const fields = {
                    'date': `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`,
                    'time': `${hours}:${minutes}:${seconds}`,
                    'technician': `${data.first_name} ${data.last_name}`,
                    'clientName': `${data.name}`,
                    'address1': `${data.address_line_1}, ${data.address_line_2}`,
                    'address2': `${data.city}, ${data.state} ${data.zip_code}`,
                    'contactName': `${data.contact_name}`,
                    'email': `${data.contact_email}`,
                    'orderNumber': `${orderId}`,
                    'shipVia': 'N/A',
                    'shipDate': 'N/A',
                    'trackingNumber': 'N/A',
                    'notes': '',
                    'scAddress1': '450 North, Flint Street',
                    'scAddress2': 'Kaysville, Utah 84037'
                }
                const bytes = await fillForm('returnRecordTemplate.pdf', fields);


                pool.query(`SELECT api_order.customer_order_number, api_batch.calibration_procedure_id, api_sensor.*, api_certificate.generate_certificate_json
                        FROM api_order
                        JOIN api_batch ON api_order.order_id = api_batch.order_id
                        JOIN api_sensor ON api_sensor.batch_id = api_batch.batch_id 
                        JOIN api_certificate ON api_sensor.certificate_id = api_certificate.certificate_id
                        WHERE api_order.order_id = $1;`, [orderId], async (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: `Error executing query: ${err}` });
                    }
                    const data = result.rows;

                    const finishedFormBytes = await addSensorsToReturnRecord(bytes, data)
                    res.setHeader("Content-Disposition", `attachment; filename=returnRecord${orderId}.pdf`);
                    res.setHeader("Content-Type", "application/json; charset=utf-8");
                    res.end(Buffer.from(finishedFormBytes));
                })
            }
        })
    });


    app.get('/api/generate-work-order', async (req, res) => {
        const batchId = req.query.batch_id;
        const today = new Date()
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        const seconds = String(today.getSeconds()).padStart(2, '0');
        const template = 'workOrderTemplate.pdf';


        pool.query(`SELECT api_batch.calibration_procedure_id, api_technician.first_name
                FROM api_batch
                JOIN api_technician ON api_batch.receiving_technician_id = api_technician.technician_id
                WHERE api_batch.batch_id = $1;`, [batchId], async (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }

            const data = result.rows[0];

            pool.query(`SELECT sensor_id FROM api_sensor WHERE batch_id = $1;`, [batchId], async (err, result) => {
                if (err) {
                    return res.status(500).json({ error: `Error executing query: ${err}` });
                }
                const sensors = result.rows;
                let sensorsString;

                for (let i = 0; i < sensors.length; i++) {
                    if (i === 0) {
                        sensorsString = `${sensors[i].sensor_id}`
                    } else {
                        sensorsString = sensorsString + `, ${sensors[i].sensor_id}`
                    }
                }
                const fields = {
                    'calibrationProcedure': `${data.calibration_procedure_id}`,
                    'workOrder': `${batchId}`,
                    'date': `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`,
                    'time': `${hours}:${minutes}:${seconds}`,
                    'technician': `${data.first_name}`,
                    'totalSensors': `${sensors.length}`,
                    'sensorIdList': sensorsString,
                }
                const bytes = await fillForm(template, fields);

                const pdfDoc = await PDFDocument.load(bytes);
                const page = pdfDoc.getPage(0);

                let qrCode = await QRCode.toBuffer(`${batchId}`);
                qrCode = await pdfDoc.embedPng(qrCode);

                page.drawImage(qrCode, {
                    x: 130,
                    y: 590,
                    width: 110,
                    height: 110,
                })

                const finishedPdf = await pdfDoc.save();

                res.setHeader("Content-Disposition", `attachment; filename=workOrder${batchId}.pdf`);
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(Buffer.from(finishedPdf));
            })
        })
    });

    app.get('/api/delete-batch', (req, res) => {
        const batchId = req.query.batch_id;


        pool.query('DELETE FROM api_interaction_log WHERE batch_id = $1 RETURNING *', [batchId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
        })
        pool.query('DELETE FROM api_batch WHERE batch_id = $1 RETURNING *', [batchId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: `Error executing query: ${err}` });
            }
            const data = result.rows;
            res.json(data);
        })
    });

    async function fillForm(template, fields) {
        const pdfBytes = fs.readFileSync(`templates/${template}`);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();

        for (const field in fields) {
            const textField = form.getTextField(field);
            textField.setText(fields[field]);
        }
        form.flatten();
        const filledPdfBytes = await pdfDoc.save();
        return filledPdfBytes;
    }

    async function fillCertificate(template, fields) {
        const pdfBytes = fs.readFileSync(`templates/${template}`);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();

        const page = pdfDoc.getPage(0);
        let technicianSignature = fs.readFileSync(`templates/signatures/Colton Signature.png`);
        technicianSignature = await pdfDoc.embedPng(technicianSignature);
        let authorizorSignature = fs.readFileSync(`templates/signatures/Kelly Signature.png`);
        authorizorSignature = await pdfDoc.embedPng(authorizorSignature);
        let qrCode = await QRCode.toBuffer(`https://sensorcalibrations.blob.core.windows.net/public-certificates/${fields.CertNumber}.pdf`);
        qrCode = await pdfDoc.embedPng(qrCode);
        page.drawImage(technicianSignature, {
            x: 110,
            y: 70,
            width: 115,
            height: 23,
        })
        page.drawImage(authorizorSignature, {
            x: 380,
            y: 70,
            width: 115,
            height: 23,
        })
        page.drawImage(qrCode, {
            x: 430,
            y: 120,
            width: 70,
            height: 70,
        })

        for (const field in fields) {
            const textField = form.getTextField(field);
            textField.setText(fields[field]);
        }
        form.flatten();
        const filledPdfBytes = await pdfDoc.save();
        return filledPdfBytes;
    }

    async function uploadPdfToAzure(pdfBytes, fileName) {
        const connectionString = azureConnectionString;
        const containerName = "public-certificates";
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);


        await blockBlobClient.uploadData(pdfBytes, {
            blobHTTPHeaders: { blobContentType: "application/pdf" },
        });
    }

    async function addSensorsToReturnRecord(bytes, sensorList) {
        sensorList.sort((certificateA, certificateB) => {
            if (certificateA.calibration_procedure_id === certificateB.calibration_procedure_id) {
                return certificateA.sensor_id - certificateB.sensor_id;
            } else {
                return certificateA.calibration_procedure_id - certificateB.calibration_procedure_id;
            }
        });

        const pdfDoc = await PDFDocument.load(bytes);
        const [newPage] = pdfDoc.getPages();
        const lineStarts = [53, 139, 203, 246, 315, 441, 498, 559];
        const rowHeight = 11;
        const fontSize = 6;
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        let availableHeight = 378;
        let startY = 394;

        let currentPage = newPage;

        for (let i = 0; i < sensorList.length; i++) {
            const sensor = sensorList[i];
            if (i * rowHeight > availableHeight) {
                currentPage = pdfDoc.addPage([newPage.getWidth(), newPage.getHeight()]);
                availableHeight = 720;
                startY = 750;
                i = 0;
            }

            currentPage.drawRectangle({
                x: 53,
                y: startY - i * rowHeight,
                width: 506,
                height: rowHeight,
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });

            const textArray = [
                `MNT-${sensor.certificate_id}`,
                JSON.stringify(sensor.sensor_id),
                sensor.generate_certificate_json.CS5,
                sensor.manufacturer,
                sensor.sku,
                sensor.customer_order_number,
                JSON.stringify(sensor.calibration_procedure_id),
            ];

            for (let j = 0; j < textArray.length; j++) {
                let textColor = rgb(0, 0, 0);
                const startX = lineStarts[j];
                const centerX = (lineStarts[j] + lineStarts[j + 1]) / 2;

                const text = textArray[j];
                const textWidth = font.widthOfTextAtSize(text, fontSize);

                const textX = centerX - textWidth / 2;

                currentPage.drawLine({
                    start: { x: startX, y: startY + 11 - i * rowHeight },
                    end: { x: startX, y: startY - i * rowHeight },
                    thickness: 1,
                    color: rgb(0, 0, 0),
                });

                if (textArray[j] === 'PASS') {
                    textColor = rgb(0, 0.5, 0);
                } else if (textArray[j] === 'FAIL') {
                    textColor = rgb(1, 0, 0);
                }

                currentPage.drawText(textArray[j], {
                    x: textX,
                    y: startY + 3 - i * rowHeight,
                    size: fontSize,
                    color: textColor,
                    textAlign: 'center', // Center-align the text
                });
            }
        }

        const modifiedPdfBytes = await pdfDoc.save();
        return modifiedPdfBytes;
    }