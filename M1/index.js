const express = require("express");
const amqp = require("amqplib");
const winston = require("winston");

const app = express();
const QUEUE_NAME = "task_queue";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logfile.log" }),
  ],
});

app.use(express.json());

app.post("/process", async (req, res) => {
  const task = req.body;

  try {
    const connection = await amqp.connect("amqp://127.0.0.1");
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(task)), {
      persistent: true,
    });

    res.status(200).json({ message: "Task submitted successfully." });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to submit the task." });
  }
});

const port = 3000;
app.listen(port, () => {
  logger.info(`M1 microservice listening at http://localhost:${port}`);
});
